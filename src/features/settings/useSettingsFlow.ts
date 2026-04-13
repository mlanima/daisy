import type { AppStateSnapshot } from "../../shared/types/appState";
import { useSettingsApiKeyFlow } from "./useSettingsApiKeyFlow";
import { useSettingsUpdateFlow } from "./useSettingsUpdateFlow";

type StatusTone = "idle" | "success" | "error";

interface UseSettingsFlowParams {
    getSnapshot: () => AppStateSnapshot | null;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    loadSnapshot: () => Promise<AppStateSnapshot>;
    setStatus: (tone: StatusTone, message: string) => void;
    setApiKeyPresent: (value: boolean) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
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
}: UseSettingsFlowParams) {
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
    });

    return {
        onUpdateSettings,
        onSaveApiKey,
        onClearApiKey,
    };
}
