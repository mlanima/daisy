mod ai_client;
mod clipboard_listener;
mod models;
mod secure_store;
mod state_store;

use models::{AiRunResponse, AppStateSnapshot, RunAgentRequest};
use serde::Serialize;
use state_store::StateStore;
use tauri::{
    LogicalSize,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State, WindowEvent,
};

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
struct QuickWindowResizeResult {
    width: f64,
    height: f64,
    is_height_clamped: bool,
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_skip_taskbar(false);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn open_main_window(app: tauri::AppHandle) {
    show_main_window(&app);

    if let Some(quick_window) = app.get_webview_window("quick") {
        let _ = quick_window.hide();
    }
}

#[tauri::command]
fn resize_quick_window(
    app: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<QuickWindowResizeResult, String> {
    let quick_window = app
        .get_webview_window("quick")
        .ok_or_else(|| "Quick window is not available.".to_string())?;

    let mut target_width = width.max(360.0);
    let mut target_height = height.max(72.0);

    let monitor = quick_window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| app.primary_monitor().ok().flatten());

    if let (Some(monitor), Ok(window_position)) = (monitor, quick_window.outer_position()) {
        let monitor_position = monitor.position();
        let monitor_size = monitor.size();
        let max_width_from_position =
            (monitor_position.x + monitor_size.width as i32 - window_position.x).max(360) as f64;
        let max_height_from_position =
            (monitor_position.y + monitor_size.height as i32 - window_position.y).max(72) as f64;

        target_width = target_width.min(max_width_from_position);
        target_height = target_height.min(max_height_from_position);
    }

    let is_height_clamped = target_height + 0.5 < height.max(72.0);

    let _ = quick_window.set_resizable(true);
    quick_window
        .set_size(LogicalSize::new(target_width, target_height))
        .map_err(|error| format!("Failed to resize quick window: {error}"))?;

    Ok(QuickWindowResizeResult {
        width: target_width,
        height: target_height,
        is_height_clamped,
    })
}

#[tauri::command]
fn get_app_state(store: State<'_, StateStore>) -> Result<AppStateSnapshot, String> {
    store.get()
}

#[tauri::command]
fn save_app_state(
    store: State<'_, StateStore>,
    snapshot: AppStateSnapshot,
) -> Result<AppStateSnapshot, String> {
    store.save(snapshot)
}

#[tauri::command]
fn save_api_key(
    store: State<'_, StateStore>,
    api_key: String,
) -> Result<(), String> {
    // Save to keyring (may fail silently on Windows)
    secure_store::save_api_key(&api_key)?;
    
    // Also save to state file as fallback
    let mut snapshot = store.get()?;
    snapshot.api_key = if api_key.trim().is_empty() {
        None
    } else {
        Some(api_key.trim().to_string())
    };
    store.save(snapshot)?;
    
    Ok(())
}

#[tauri::command]
fn has_api_key(store: State<'_, StateStore>) -> Result<bool, String> {
    let snapshot = store.get()?;
    let fallback = snapshot.api_key.as_deref();
    secure_store::has_api_key(fallback)
}

#[tauri::command]
fn clear_api_key(store: State<'_, StateStore>) -> Result<(), String> {
    // Clear from keyring
    secure_store::clear_api_key()?;
    
    // Clear from state file
    let mut snapshot = store.get()?;
    snapshot.api_key = None;
    store.save(snapshot)?;
    
    Ok(())
}

#[tauri::command]
fn get_api_key_preview(store: State<'_, StateStore>) -> Result<String, String> {
    let snapshot = store.get()?;
    let fallback = snapshot.api_key.as_deref();
    secure_store::read_api_key_preview(fallback)
}

#[tauri::command]
fn get_latest_clipboard_capture(
    store: State<'_, StateStore>,
) -> Result<Option<models::ClipboardCapturedEvent>, String> {
    store.get_latest_clipboard_capture()
}

#[tauri::command]
async fn run_agent(
    store: State<'_, StateStore>,
    request: RunAgentRequest,
) -> Result<AiRunResponse, String> {
    let snapshot = store.get()?;

    let agent = snapshot
        .agents
        .iter()
        .find(|agent| agent.id == request.agent_id)
        .ok_or_else(|| "Agent not found.".to_string())?
        .clone();

    let user_prompt = request
        .prompt_override
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(request.source_text)
        .trim()
        .to_string();

    if user_prompt.is_empty() {
        return Err("Prompt cannot be empty.".to_string());
    }

    let fallback_api_key = snapshot.api_key.as_deref();
    let api_key = secure_store::read_api_key(fallback_api_key)?;
    let endpoint = snapshot.settings.api_base_url.trim();
    let model_config = snapshot.settings.model;

    if endpoint.is_empty() {
        return Err("API endpoint cannot be empty. Update settings first.".to_string());
    }

    let system_prompt = agent.system_prompt.replace("{text}", "");
    let system_prompt = system_prompt.trim().to_string();
    let system_prompt = if system_prompt.is_empty() {
        None
    } else {
        Some(system_prompt.as_str())
    };

    ai_client::run_chat_completion(
        &api_key,
        endpoint,
        &model_config,
        system_prompt,
        &user_prompt,
    )
    .await
    .map_err(|error| {
        format!(
            "Failed to generate answer.\nagentId: {}\nendpoint: {}\nmodel: {}\nsystemPromptChars: {}\nuserPromptChars: {}\ndetails: {}",
            agent.id,
            endpoint,
            model_config.model,
            agent.system_prompt.chars().count(),
            user_prompt.chars().count(),
            error,
        )
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .on_menu_event(|app, event| match event.id().as_ref() {
            "tray_open" => show_main_window(app),
            "tray_quit" => app.exit(0),
            _ => {}
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(false) = event {
                if window.label() == "quick" {
                    let _ = window.hide();
                    let _ = window.set_skip_taskbar(true);
                    return;
                }
            }

            if let WindowEvent::CloseRequested { api, .. } = event {
                // Keep the app running in the system tray.
                api.prevent_close();
                let _ = window.hide();
                let _ = window.set_skip_taskbar(true);
            }
        })
        .on_tray_icon_event(|app, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(app);
            }
        })
        .setup(|app| {
            let store = StateStore::new(&app.handle())
                .map_err(|error| -> Box<dyn std::error::Error> { error })?;

            app.manage(store);
            clipboard_listener::start_listener(app.handle().clone());

            let open_item =
                MenuItem::with_id(app, "tray_open", "Open Assistant", true, Option::<&str>::None)?;
            let quit_item =
                MenuItem::with_id(app, "tray_quit", "Quit", true, Option::<&str>::None)?;
            let tray_menu = Menu::with_items(app, &[&open_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .tooltip("aids")
                .show_menu_on_left_click(false);

            if let Some(icon) = app.default_window_icon().cloned() {
                tray_builder = tray_builder.icon(icon);
            }

            let _tray = tray_builder.build(app)?;

            if let Some(main_window) = app.get_webview_window("main") {
                let _ = main_window.hide();
                let _ = main_window.set_skip_taskbar(true);
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_app_state,
            save_app_state,
            save_api_key,
            has_api_key,
            clear_api_key,
            get_api_key_preview,
            get_latest_clipboard_capture,
            open_main_window,
            resize_quick_window,
            run_agent
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
