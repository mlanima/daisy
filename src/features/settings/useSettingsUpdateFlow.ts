import { useCallback } from "react";
import type {
    AppSettings,
    AppStateSnapshot,
} from "../../shared/types/appState";

interface UseSettingsUpdateFlowParams {
    getSnapshot: () => AppStateSnapshot | null;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
}

export function useSettingsUpdateFlow({
    getSnapshot,
    persistSnapshot,
}: UseSettingsUpdateFlowParams) {
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
