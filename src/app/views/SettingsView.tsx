import { SettingsPage } from "../../features/settings";
import { useSnapshot, useNavigation, useApiKeyState } from "../../store/appStore";
import { useSettingsActions } from "../../features/settings/useSettingsActions";

/** Renders the settings screen bound to store-backed actions. */
export function SettingsView() {
    const snapshot = useSnapshot();
    const { setView } = useNavigation();
    const { apiKeyPresent } = useApiKeyState();
    const { updateSettings, saveApiKey, clearApiKey } = useSettingsActions();

    if (!snapshot) {
        return null;
    }

    return (
        <SettingsPage
            settings={snapshot.settings}
            apiKeyPresent={apiKeyPresent}
            onBack={() => setView("assistant")}
            onUpdateSettings={updateSettings}
            onSaveApiKey={saveApiKey}
            onClearApiKey={clearApiKey}
        />
    );
}
