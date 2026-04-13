import {
    clearApiKey,
    getApiKeyPreview,
    saveApiKey,
} from "../../shared/services/tauri/tauriClient";

export async function fetchApiKeyPreview(): Promise<string> {
    return getApiKeyPreview();
}

export async function saveSecretApiKey(apiKey: string): Promise<void> {
    await saveApiKey(apiKey);
}

export async function clearSecretApiKey(): Promise<void> {
    await clearApiKey();
}
