import type { AppSettings } from "../../shared/types/appState";

export interface SettingsPageProps {
    settings: AppSettings;
    apiKeyPresent: boolean;
    onBack: () => void;
    onUpdateSettings: (settings: AppSettings) => void;
    onSaveApiKey: (apiKey: string) => Promise<void>;
    onClearApiKey: () => Promise<void>;
}
