import { SettingsPage } from "../../features/settings";
import { useAppControllerContext } from "../AppControllerContext";

export function SettingsView() {
    const {
        snapshot,
        setView,
        apiKeyPresent,
        onUpdateSettings,
        onSaveApiKey,
        onClearApiKey,
    } = useAppControllerContext();

    if (!snapshot) {
        return null;
    }

    return (
        <SettingsPage
            settings={snapshot.settings}
            apiKeyPresent={apiKeyPresent}
            onBack={() => setView("assistant")}
            onUpdateSettings={onUpdateSettings}
            onSaveApiKey={onSaveApiKey}
            onClearApiKey={onClearApiKey}
        />
    );
}
