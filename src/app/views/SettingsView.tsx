import { SettingsPage } from "../../features/settings";
import { useAppControllerStore } from "../appControllerStore";

export function SettingsView() {
    const controller = useAppControllerStore((state) => state.controller);

    if (!controller) {
        return null;
    }

    const {
        snapshot,
        setView,
        apiKeyPresent,
        onUpdateSettings,
        onSaveApiKey,
        onClearApiKey,
    } = controller;

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
