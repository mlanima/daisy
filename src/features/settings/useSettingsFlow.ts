import type { AppStateSnapshot } from "../../shared/types/appState";
import type { StatusTone } from "../../shared/types/feedback";
import {
    defaultSettingsFlowDependencies,
    type SettingsFlowDependencies,
} from "./settingsFlowDependencies";
import { useSettingsApiKeyFlow } from "./useSettingsApiKeyFlow";
import { useSettingsUpdateFlow } from "./useSettingsUpdateFlow";

interface UseSettingsFlowParams {
    getSnapshot: () => AppStateSnapshot | null;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    loadSnapshot: () => Promise<AppStateSnapshot>;
    setStatus: (tone: StatusTone, message: string) => void;
    setApiKeyPresent: (value: boolean) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
    dependencies?: SettingsFlowDependencies;
}

export function useSettingsFlow({
    getSnapshot,
    persistSnapshot,
    applySnapshotLocally,
    loadSnapshot,
    setStatus,
    setApiKeyPresent,
    clearErrorDetails,
    reportError,
    dependencies,
}: UseSettingsFlowParams) {
    const activeDependencies = dependencies ?? defaultSettingsFlowDependencies;

    const { onUpdateSettings } = useSettingsUpdateFlow({
        getSnapshot,
        persistSnapshot,
    });

    const { onSaveApiKey, onClearApiKey } = useSettingsApiKeyFlow({
        applySnapshotLocally,
        loadSnapshot,
        setStatus,
        setApiKeyPresent,
        clearErrorDetails,
        reportError,
        dependencies: activeDependencies,
    });

    return {
        onUpdateSettings,
        onSaveApiKey,
        onClearApiKey,
    };
}
