use crate::models::{AppStateSnapshot, ClipboardCapturedEvent};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

const STATE_FILE_NAME: &str = "assistant-state.json";

pub struct StateStore {
    file_path: PathBuf,
    snapshot: Mutex<AppStateSnapshot>,
    latest_clipboard_capture: Mutex<Option<ClipboardCapturedEvent>>,
}

impl StateStore {
    pub fn new(app: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let mut app_data_dir = app.path().app_data_dir()?;
        fs::create_dir_all(&app_data_dir)?;
        app_data_dir.push(STATE_FILE_NAME);

        let snapshot = Self::load_snapshot(&app_data_dir);

        Ok(Self {
            file_path: app_data_dir,
            snapshot: Mutex::new(snapshot),
            latest_clipboard_capture: Mutex::new(None),
        })
    }

    fn load_snapshot(path: &Path) -> AppStateSnapshot {
        let file_content = match fs::read_to_string(path) {
            Ok(value) => value,
            Err(_) => return AppStateSnapshot::default(),
        };

        serde_json::from_str::<AppStateSnapshot>(&file_content).unwrap_or_default()
    }

    pub fn get(&self) -> Result<AppStateSnapshot, String> {
        self.snapshot
            .lock()
            .map(|snapshot| snapshot.clone())
            .map_err(|error| format!("Failed to lock app state: {error}"))
    }

    pub fn save(&self, new_snapshot: AppStateSnapshot) -> Result<AppStateSnapshot, String> {
        let mut snapshot = self
            .snapshot
            .lock()
            .map_err(|error| format!("Failed to lock app state: {error}"))?;

        let serialized = serde_json::to_string_pretty(&new_snapshot)
            .map_err(|error| format!("Failed to serialize app state: {error}"))?;

        fs::write(&self.file_path, serialized)
            .map_err(|error| format!("Failed to persist app state: {error}"))?;

        *snapshot = new_snapshot.clone();

        Ok(new_snapshot)
    }

    pub fn set_latest_clipboard_capture(
        &self,
        capture: ClipboardCapturedEvent,
    ) -> Result<(), String> {
        self.latest_clipboard_capture
            .lock()
            .map_err(|error| format!("Failed to lock clipboard cache: {error}"))
            .map(|mut cached| {
                *cached = Some(capture);
            })
    }

    pub fn get_latest_clipboard_capture(
        &self,
    ) -> Result<Option<ClipboardCapturedEvent>, String> {
        self.latest_clipboard_capture
            .lock()
            .map(|cached| cached.clone())
            .map_err(|error| format!("Failed to lock clipboard cache: {error}"))
    }
}
