use crate::{models::{ClipboardCapturedEvent, WindowSize}, state_store::StateStore};
use arboard::Clipboard;
use rdev::{Button, Event, EventType, Key, listen};
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, Position, WebviewUrl, WebviewWindowBuilder,
};

const DOUBLE_COPY_WINDOW_MS: u128 = 650;
const POST_POPUP_SUPPRESSION_MS: u128 = 450;
const SELECTION_ANCHOR_TTL_MS: u128 = 8_000;
const QUICK_WINDOW_BOTTOM_INSET: f64 = 26.0;

pub fn start_listener(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let mut ctrl_pressed = false;
        let mut c_pressed = false;
        let mut last_copy_chord: Option<Instant> = None;
        let mut suppress_copy_until: Option<Instant> = None;
        let mut last_mouse_position: Option<(f64, f64)> = None;
        let mut last_selection_anchor: Option<(f64, f64, Instant)> = None;

        let is_suppressed = |until: Option<Instant>| {
            until.is_some_and(|value| Instant::now() < value)
        };

        let reset_copy_state = |
            ctrl_pressed: &mut bool,
            c_pressed: &mut bool,
            last_copy_chord: &mut Option<Instant>,
        | {
            *ctrl_pressed = false;
            *c_pressed = false;
            *last_copy_chord = None;
        };

        let listener_result = listen(move |event: Event| match event.event_type {
            EventType::KeyPress(key) => match key {
                Key::ControlLeft | Key::ControlRight => {
                    ctrl_pressed = true;
                }
                Key::KeyC if ctrl_pressed => {
                    if c_pressed || is_suppressed(suppress_copy_until) {
                        return;
                    }

                    c_pressed = true;
                }
                _ => {
                    if ctrl_pressed && !is_suppressed(suppress_copy_until) {
                        ctrl_pressed = false;
                        c_pressed = false;
                        last_copy_chord = None;
                    }
                }
            },
            EventType::KeyRelease(key) => match key {
                Key::ControlLeft | Key::ControlRight => {
                    ctrl_pressed = false;
                    c_pressed = false;
                }
                Key::KeyC => {
                    if !c_pressed {
                        return;
                    }

                    c_pressed = false;

                    if is_suppressed(suppress_copy_until) {
                        return;
                    }

                    let now = Instant::now();

                    if let Some(previous_chord) = last_copy_chord {
                        if now.duration_since(previous_chord).as_millis() <= DOUBLE_COPY_WINDOW_MS {
                            last_copy_chord = None;
                            reset_copy_state(
                                &mut ctrl_pressed,
                                &mut c_pressed,
                                &mut last_copy_chord,
                            );
                            suppress_copy_until = Some(
                                Instant::now()
                                    + std::time::Duration::from_millis(
                                        POST_POPUP_SUPPRESSION_MS as u64,
                                    ),
                            );
                            let app = app_handle.clone();
                            let anchor_position = resolve_anchor_position(
                                last_selection_anchor,
                                last_mouse_position,
                            );
                            std::thread::spawn(move || {
                                trigger_clipboard_capture(app, anchor_position);
                            });
                            return;
                        }
                    }

                    last_copy_chord = Some(now);
                }
                _ => {}
            },
            EventType::MouseMove { x, y } => {
                last_mouse_position = Some((x, y));
            }
            EventType::ButtonRelease(Button::Left) => {
                if let Some((x, y)) = last_mouse_position {
                    last_selection_anchor = Some((x, y, Instant::now()));
                }
            }
            _ => {}
        });

        if let Err(error) = listener_result {
            eprintln!("Global keyboard listener stopped: {error:?}");
        }
    });
}

fn trigger_clipboard_capture(app_handle: AppHandle, anchor_position: Option<(f64, f64)>) {
    let mut clipboard = match Clipboard::new() {
        Ok(clipboard) => clipboard,
        Err(error) => {
            eprintln!("Failed to access clipboard: {error}");
            return;
        }
    };

    let text = match clipboard.get_text() {
        Ok(value) => value,
        Err(error) => {
            eprintln!("Failed to read clipboard text: {error}");
            return;
        }
    };

    let trimmed_text = text.trim().to_string();

    if trimmed_text.is_empty() {
        return;
    }

    let window_size = app_handle
        .try_state::<StateStore>()
        .and_then(|store| store.get().ok())
        .map(|snapshot| snapshot.settings.window_size)
        .unwrap_or_default();

    show_quick_window(&app_handle, anchor_position, window_size);

    let payload = ClipboardCapturedEvent {
        text: trimmed_text,
        captured_at_epoch_ms: current_epoch_ms(),
    };

    if let Some(store) = app_handle.try_state::<StateStore>() {
        let _ = store.set_latest_clipboard_capture(payload.clone());
    }

    if let Err(error) = app_handle.emit("clipboard-captured", payload) {
        eprintln!("Failed to emit clipboard-captured event: {error}");
    }
}

fn resolve_anchor_position(
    selection_anchor: Option<(f64, f64, Instant)>,
    mouse_position: Option<(f64, f64)>,
) -> Option<(f64, f64)> {
    if let Some((x, y, captured_at)) = selection_anchor {
        if Instant::now().duration_since(captured_at).as_millis() <= SELECTION_ANCHOR_TTL_MS {
            return Some((x, y));
        }
    }

    mouse_position
}

fn quick_popup_dimensions(_window_size: WindowSize) -> (f64, f64, f64) {
    (492.0, 128.0, 492.0)
}

fn show_quick_window(
    app_handle: &AppHandle,
    anchor_position: Option<(f64, f64)>,
    window_size: WindowSize,
) {
    let (x, y) = anchor_position.unwrap_or((120.0, 120.0));
    let (popup_width, popup_height, popup_min_width) = quick_popup_dimensions(window_size);
    let ideal_x = if x > popup_width + 24.0 {
        (x - popup_width - 18.0).max(0.0)
    } else {
        (x + 18.0).max(0.0)
    };
    let ideal_y = (y + 18.0).max(0.0);
    let (target_x, target_y) = clamp_to_monitor_bounds(
        app_handle,
        ideal_x,
        ideal_y,
        popup_width,
        popup_height,
    );
    let target_position = Position::Physical(PhysicalPosition::new(target_x, target_y));

    if let Some(quick_window) = app_handle.get_webview_window("quick") {
        if let Some(icon) = app_handle.default_window_icon().cloned() {
            let _ = quick_window.set_icon(icon);
        }
        let _ = quick_window.set_resizable(true);
        let _ = quick_window.set_size(tauri::LogicalSize::new(popup_width, popup_height));
        let _ = quick_window.set_position(target_position.clone());
        let _ = quick_window.unminimize();
        let _ = quick_window.show();
        let _ = quick_window.set_focus();
        return;
    }

    let builder = WebviewWindowBuilder::new(app_handle, "quick", WebviewUrl::App("index.html".into()))
        .title("Quick")
        .inner_size(popup_width, popup_height)
        .min_inner_size(popup_min_width, 72.0)
        .resizable(true)
        .decorations(false)
        .always_on_top(true)
        .position(target_x as f64, target_y as f64)
        .skip_taskbar(true);

    match builder.build() {
        Ok(window) => {
            if let Some(icon) = app_handle.default_window_icon().cloned() {
                let _ = window.set_icon(icon);
            }
            let _ = window.set_focus();
        }
        Err(error) => {
            eprintln!("Failed to create quick window: {error}");
        }
    }
}

fn clamp_to_monitor_bounds(
    app_handle: &AppHandle,
    x: f64,
    y: f64,
    popup_width: f64,
    popup_height: f64,
) -> (i32, i32) {
    let monitor = app_handle
        .available_monitors()
        .ok()
        .and_then(|monitors| {
            monitors.into_iter().find(|monitor| {
                let position = monitor.position();
                let size = monitor.size();
                let min_x = position.x as f64;
                let min_y = position.y as f64;
                let max_x = min_x + size.width as f64;
                let max_y = min_y + size.height as f64;

                x >= min_x && x <= max_x && y >= min_y && y <= max_y
            })
        })
        .or_else(|| app_handle.primary_monitor().ok().flatten());

    let (clamped_x, clamped_y) = if let Some(monitor) = monitor {
        let position = monitor.position();
        let size = monitor.size();
        let min_x = position.x as f64;
        let min_y = position.y as f64;
        let max_x = (min_x + size.width as f64 - popup_width).max(min_x);
        let max_y =
            (min_y + size.height as f64 - popup_height - QUICK_WINDOW_BOTTOM_INSET)
                .max(min_y);

        (x.clamp(min_x, max_x), y.clamp(min_y, max_y))
    } else {
        (x.max(0.0), y.max(0.0))
    };

    (clamped_x.round() as i32, clamped_y.round() as i32)
}

fn current_epoch_ms() -> u64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis() as u64,
        Err(_) => 0,
    }
}
