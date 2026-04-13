import { useCallback } from "react";
import type { AppStateSnapshot } from "../../shared/types/appState";
import type { StatusTone } from "../../shared/types/feedback";
import type { SettingsFlowDependencies } from "./settingsFlowDependencies";

interface UseSettingsApiKeyFlowParams {
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    loadSnapshot: () => Promise<AppStateSnapshot>;
    setStatus: (tone: StatusTone, message: string) => void;
    setApiKeyPresent: (value: boolean) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
    dependencies: SettingsFlowDependencies;
}

/**
 * Persists API key changes and refreshes in-memory snapshot/state indicators.
 */
export function useSettingsApiKeyFlow({
    applySnapshotLocally,
    loadSnapshot,
    setStatus,
    setApiKeyPresent,
    clearErrorDetails,
    reportError,
    dependencies,
}: UseSettingsApiKeyFlowParams) {
    /** Saves API key then refreshes snapshot-derived settings state. */
    const onSaveApiKey = useCallback(
        async (apiKey: string) => {
            try {
                await dependencies.saveSecretApiKey(apiKey);
                const updatedSnapshot = await loadSnapshot();

                applySnapshotLocally(updatedSnapshot);
                setApiKeyPresent(true);
                setStatus("success", "API key saved securely.");
                clearErrorDetails();
            } catch (error) {
                reportError(error);
            }
        },
        [
            applySnapshotLocally,
            clearErrorDetails,
            dependencies,
            loadSnapshot,
            reportError,
            setApiKeyPresent,
            setStatus,
        ],
    );

    /** Clears API key and updates snapshot/status state accordingly. */
    const onClearApiKey = useCallback(async () => {
        try {
            await dependencies.clearSecretApiKey();
            const updatedSnapshot = await loadSnapshot();

            applySnapshotLocally(updatedSnapshot);
            setApiKeyPresent(false);
            setStatus("success", "API key cleared.");
            clearErrorDetails();
        } catch (error) {
            reportError(error);
        }
    }, [
        applySnapshotLocally,
        clearErrorDetails,
        dependencies,
        loadSnapshot,
        reportError,
        setApiKeyPresent,
        setStatus,
    ]);

    return {
        onSaveApiKey,
        onClearApiKey,
    };
}
