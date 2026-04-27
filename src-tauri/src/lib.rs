mod ai_client;
mod clipboard_listener;
mod models;
mod prompt;
mod secure_store;
mod state_store;

use models::{AiRunResponse, AppStateSnapshot, ModelConfig, RunAgentRequest};
use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};
use state_store::StateStore;
use tauri::{
    LogicalSize,
    PhysicalPosition, Position,
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

struct PreparedAgentRunContext {
    agent_id: String,
    endpoint: String,
    model_config: ModelConfig,
    system_prompt: Option<String>,
    system_prompt_chars: usize,
    user_prompt: String,
    user_prompt_chars: usize,
    api_key: String,
}

const QUICK_WINDOW_BOTTOM_INSET: f64 = 26.0;
const QUICK_WINDOW_FIXED_WIDTH: f64 = 492.0;
static QUICK_AUTO_HIDE_SUPPRESSED_UNTIL_MS: AtomicU64 = AtomicU64::new(0);

fn current_epoch_ms() -> u64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis() as u64,
        Err(_) => 0,
    }
}

fn is_quick_auto_hide_suppressed() -> bool {
    current_epoch_ms() < QUICK_AUTO_HIDE_SUPPRESSED_UNTIL_MS.load(Ordering::Relaxed)
}

fn resolve_user_prompt(request: RunAgentRequest) -> Result<String, String> {
    let prompt_source = request
        .prompt_override
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(request.source_text);
    let user_prompt = prompt::build_prompt("", &prompt_source);

    if user_prompt.is_empty() {
        return Err("Prompt cannot be empty.".to_string());
    }

    Ok(user_prompt)
}

fn prepare_agent_run_context(
    store: &StateStore,
    request: RunAgentRequest,
) -> Result<PreparedAgentRunContext, String> {
    let snapshot = store.get()?;

    let agent = snapshot
        .agents
        .iter()
        .find(|agent| agent.id == request.agent_id)
        .ok_or_else(|| "Agent not found.".to_string())?;

    let user_prompt = resolve_user_prompt(request)?;
    let endpoint = snapshot.settings.api_base_url.trim().to_string();

    if endpoint.is_empty() {
        return Err("API endpoint cannot be empty. Update settings first.".to_string());
    }

    let fallback_api_key = snapshot.api_key.as_deref();
    let api_key = secure_store::read_api_key(fallback_api_key)?;
    let system_prompt = prompt::normalized_system_prompt(&agent.system_prompt);

    Ok(PreparedAgentRunContext {
        agent_id: agent.id.clone(),
        endpoint,
        model_config: snapshot.settings.model.clone(),
        system_prompt_chars: agent.system_prompt.chars().count(),
        user_prompt_chars: user_prompt.chars().count(),
        user_prompt,
        system_prompt,
        api_key,
    })
}

fn format_agent_run_error(context: &PreparedAgentRunContext, details: &str) -> String {
    format!(
        "Failed to generate answer.\nagentId: {}\nendpoint: {}\nmodel: {}\nsystemPromptChars: {}\nuserPromptChars: {}\ndetails: {}",
        context.agent_id,
        context.endpoint,
        context.model_config.model,
        context.system_prompt_chars,
        context.user_prompt_chars,
        details,
    )
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Some(icon) = app.default_window_icon().cloned() {
            let _ = window.set_icon(icon);
        }
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
fn suppress_quick_auto_hide(duration_ms: u64) {
    let capped_duration = duration_ms.min(10_000);
    let until = current_epoch_ms().saturating_add(capped_duration);
    QUICK_AUTO_HIDE_SUPPRESSED_UNTIL_MS.fetch_max(until, Ordering::Relaxed);
}

#[tauri::command]
fn resize_quick_window(
    app: tauri::AppHandle,
    _width: f64,
    height: f64,
) -> Result<QuickWindowResizeResult, String> {
    let quick_window = app
        .get_webview_window("quick")
        .ok_or_else(|| "Quick window is not available.".to_string())?;

    let mut target_width = QUICK_WINDOW_FIXED_WIDTH;
    let mut target_height = height.max(72.0);

    let monitor = quick_window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| app.primary_monitor().ok().flatten());

    if let (Some(monitor), Ok(window_position)) = (monitor, quick_window.outer_position()) {
        let monitor_position = monitor.position();
        let monitor_size = monitor.size();
        let min_y = monitor_position.y as f64;
        let mut current_y = window_position.y as f64;
        let max_width_from_position =
            (monitor_position.x + monitor_size.width as i32 - window_position.x).max(360) as f64;

        let compute_max_height_from_y = |y: f64| {
            (min_y + monitor_size.height as f64 - y - QUICK_WINDOW_BOTTOM_INSET).max(72.0)
        };

        let mut max_height_from_position = compute_max_height_from_y(current_y);

        // If there is not enough space below, move the window up before resizing.
        if target_height > max_height_from_position {
            let overflow = target_height - max_height_from_position;
            let new_y = (current_y - overflow).max(min_y);

            if (new_y - current_y).abs() >= 1.0 {
                let _ = quick_window.set_position(Position::Physical(
                    PhysicalPosition::new(window_position.x, new_y.round() as i32),
                ));

                current_y = new_y;
                max_height_from_position = compute_max_height_from_y(current_y);
            }
        }

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
    let context = prepare_agent_run_context(&store, request)?;

    ai_client::run_chat_completion(
        &context.api_key,
        &context.endpoint,
        &context.model_config,
        context.system_prompt.as_deref(),
        &context.user_prompt,
    )
    .await
    .map_err(|error| format_agent_run_error(&context, &error))
}

#[tauri::command]
async fn run_agent_stream(
    app: tauri::AppHandle,
    store: State<'_, StateStore>,
    request: RunAgentRequest,
) -> Result<(), String> {
    let context = prepare_agent_run_context(&store, request)?;

    ai_client::run_chat_completion_stream(
        &app,
        &context.api_key,
        &context.endpoint,
        &context.model_config,
        context.system_prompt.as_deref(),
        &context.user_prompt,
    )
    .await
    .map_err(|error| format_agent_run_error(&context, &error))
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
                    if !is_quick_auto_hide_suppressed() {
                        let _ = window.hide();
                        let _ = window.set_skip_taskbar(true);
                    }

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
                .tooltip("daisy")
                .show_menu_on_left_click(false);

            if let Some(icon) = app.default_window_icon().cloned() {
                tray_builder = tray_builder.icon(icon);
            }

            let _tray = tray_builder.build(app)?;

            if let Some(main_window) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon().cloned() {
                    let _ = main_window.set_icon(icon);
                }
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
            suppress_quick_auto_hide,
            resize_quick_window,
            run_agent,
            run_agent_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
