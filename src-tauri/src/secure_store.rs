const KEYRING_SERVICE: &str = "com.mlanima.daisy";
const KEYRING_USER: &str = "assistant-api-key";

fn api_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|error| format!("Failed to access keyring: {error}"))
}

pub fn save_api_key(api_key: &str) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err("API key cannot be empty.".to_string());
    }

    let entry = api_entry()?;

    // Try to save to keyring, but don't fail if it doesn't work
    let _ = entry.set_password(api_key.trim());

    // We'll also store to state file as fallback (handled by the caller)
    Ok(())
}

pub fn read_api_key(fallback_state: Option<&str>) -> Result<String, String> {
    let entry = api_entry()?;

    // Try keyring first
    if let Ok(password) = entry.get_password() {
        if !password.trim().is_empty() {
            return Ok(password);
        }
    }

    // Fall back to stored state if keyring fails
    if let Some(key) = fallback_state {
        if !key.trim().is_empty() {
            return Ok(key.to_string());
        }
    }

    Err("API key is missing or unreadable: No entry found in secure storage or local storage.".to_string())
}

pub fn has_api_key(fallback_state: Option<&str>) -> Result<bool, String> {
    let entry = api_entry()?;
    let fallback_has_value = fallback_state.is_some_and(|key| !key.trim().is_empty());

    match entry.get_password() {
        Ok(value) => Ok(!value.trim().is_empty()),
        // If the keyring backend is unavailable or no entry exists, trust fallback state.
        Err(_) => Ok(fallback_has_value),
    }
}

pub fn clear_api_key() -> Result<(), String> {
    let entry = api_entry()?;

    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("Failed to clear API key: {error}")),
    }
    // State will also be cleared by the caller
}

pub fn read_api_key_preview(fallback_state: Option<&str>) -> Result<String, String> {
    let entry = api_entry()?;

    let password = match entry.get_password() {
        Ok(value) if !value.trim().is_empty() => Some(value),
        _ => fallback_state.map(|s| s.to_string()),
    };

    match password {
        Some(value) => {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                Ok("<empty>".to_string())
            } else if trimmed.len() <= 4 {
                Ok("***...".to_string())
            } else {
                let mut last4_chars = trimmed.chars().rev().take(4).collect::<Vec<_>>();
                last4_chars.reverse();
                let last4: String = last4_chars.into_iter().collect();
                Ok(format!("***...{}", last4))
            }
        }
        None => Ok("<not found>".to_string()),
    }
}
