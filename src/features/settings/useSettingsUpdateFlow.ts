import { useCallback } from "react";
import type {
    AppSettings,
    AppStateSnapshot,
} from "../../shared/types/appState";

interface UseSettingsUpdateFlowParams {
    getSnapshot: () => AppStateSnapshot | null;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
}

/** Applies settings edits into the active snapshot and persists them. */
export function useSettingsUpdateFlow({
    getSnapshot,
    persistSnapshot,
}: UseSettingsUpdateFlowParams) {
    /** Applies settings to active snapshot and persists immediately. */
    const onUpdateSettings = useCallback(
        (settings: AppSettings) => {
            const activeSnapshot = getSnapshot();

            if (!activeSnapshot) {
                return;
            }

            void persistSnapshot({ ...activeSnapshot, settings });
        },
        [getSnapshot, persistSnapshot],
    );

    return { onUpdateSettings };
}
