import { clearSecretApiKey, saveSecretApiKey } from "./settingsService";

export interface SettingsFlowDependencies {
    saveSecretApiKey: (apiKey: string) => Promise<void>;
    clearSecretApiKey: () => Promise<void>;
}

export const defaultSettingsFlowDependencies: SettingsFlowDependencies = {
    saveSecretApiKey,
    clearSecretApiKey,
};
