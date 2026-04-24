import { clearSecretApiKey, saveSecretApiKey } from "./settingsService";
import { persistWorkspaceSnapshot, loadWorkspaceSnapshot } from "../../app/services/workspaceService";
import type { AppStateSnapshot } from "../../shared/types/appState";

export interface SettingsFlowDependencies {
    saveSecretApiKey: (apiKey: string) => Promise<void>;
    clearSecretApiKey: () => Promise<void>;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<AppStateSnapshot>;
    loadSnapshot: () => Promise<AppStateSnapshot>;
}

export const defaultSettingsFlowDependencies: SettingsFlowDependencies = {
    saveSecretApiKey,
    clearSecretApiKey,
    persistSnapshot: persistWorkspaceSnapshot,
    loadSnapshot: loadWorkspaceSnapshot,
};
