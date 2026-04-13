import {
    clearApiKey,
    getApiKeyPreview,
    saveApiKey,
} from "../../shared/services/tauri/tauriClient";

/** Fetches masked API key preview text from secure storage/state. */
export async function fetchApiKeyPreview(): Promise<string> {
    return getApiKeyPreview();
}

/** Persists API key via the backend secure-store command. */
export async function saveSecretApiKey(apiKey: string): Promise<void> {
    await saveApiKey(apiKey);
}

/** Removes API key from secure storage and fallback state. */
export async function clearSecretApiKey(): Promise<void> {
    await clearApiKey();
}
