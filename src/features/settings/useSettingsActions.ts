import { useCallback } from "react";
import type {
    AppSettings,
    AppStateSnapshot,
} from "../../shared/types/appState";
import type { SettingsFlowDependencies } from "./settingsFlowDependencies";
import { defaultSettingsFlowDependencies } from "./settingsFlowDependencies";
import { useAppStore, useUiFeedback } from "../../store/appStore";

interface SettingsActionsParams {
    dependencies?: SettingsFlowDependencies;
}

/**
 * Flattened hook that handles all settings-related actions:
 * - Updating display and model settings
 * - Saving and clearing API keys
 * - Managing workspace persistence
 */
export function useSettingsActions(
    params: Readonly<SettingsActionsParams> = {},
) {
    const { dependencies: customDependencies } = params;
    const activeDependencies =
        customDependencies ?? defaultSettingsFlowDependencies;

    const { snapshot, setSnapshot, setApiKeyPresent } = useAppStore(
        (state) => ({
            snapshot: state.snapshot,
            setSnapshot: state.setSnapshot,
            setApiKeyPresent: state.setApiKeyPresent,
        }),
    );

    const { setStatus, setError, clearErrorDetails } = useUiFeedback();

    /** Updates settings and persists to backend. */
    const updateSettings = useCallback(
        (settings: AppSettings) => {
            if (!snapshot) {
                return;
            }

            const nextSnapshot: AppStateSnapshot = {
                ...snapshot,
                settings,
            };

            setSnapshot(nextSnapshot);

            try {
                void activeDependencies.persistSnapshot(nextSnapshot);
                setStatus("success", "Settings updated.");
                clearErrorDetails();
            } catch (error) {
                setError(error, "Failed to update settings");
            }
        },
        [
            activeDependencies,
            clearErrorDetails,
            setError,
            setSnapshot,
            setStatus,
            snapshot,
        ],
    );

    /** Saves API key and refreshes snapshot state. */
    const saveApiKey = useCallback(
        async (apiKey: string) => {
            try {
                await activeDependencies.saveSecretApiKey(apiKey);
                const updatedSnapshot = await activeDependencies.loadSnapshot();

                setSnapshot(updatedSnapshot);
                setApiKeyPresent(true);
                setStatus("success", "API key saved securely.");
                clearErrorDetails();
            } catch (error) {
                setError(error, "Failed to save API key");
            }
        },
        [
            activeDependencies,
            clearErrorDetails,
            setApiKeyPresent,
            setError,
            setSnapshot,
            setStatus,
        ],
    );

    /** Clears API key and updates snapshot state. */
    const clearApiKey = useCallback(async () => {
        try {
            await activeDependencies.clearSecretApiKey();
            const updatedSnapshot = await activeDependencies.loadSnapshot();

            setSnapshot(updatedSnapshot);
            setApiKeyPresent(false);
            setStatus("success", "API key cleared.");
            clearErrorDetails();
        } catch (error) {
            setError(error, "Failed to clear API key");
        }
    }, [
        activeDependencies,
        clearErrorDetails,
        setApiKeyPresent,
        setError,
        setSnapshot,
        setStatus,
    ]);

    return {
        updateSettings,
        saveApiKey,
        clearApiKey,
    };
}
