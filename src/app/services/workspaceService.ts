import type { AppStateSnapshot } from "../../shared/types/appState";
import {
    getAppState,
    hasApiKey,
    saveAppState,
} from "../../shared/services/tauri/tauriClient";

/** Result returned during initial workspace bootstrap. */
export interface WorkspaceBootstrapResult {
    snapshot: AppStateSnapshot;
    apiKeyPresent: boolean;
}

/**
 * Bootstraps the app: loads initial snapshot and checks for API key.
 */
export async function bootstrapWorkspace(): Promise<WorkspaceBootstrapResult> {
    const [snapshot, apiKeyPresent] = await Promise.all([
        getAppState(),
        hasApiKey(),
    ]);

    return { snapshot, apiKeyPresent };
}

/**
 * Loads the latest snapshot from persistence.
 */
export async function loadWorkspaceSnapshot(): Promise<AppStateSnapshot> {
    return getAppState();
}

/**
 * Persists a snapshot and returns canonical saved state.
 */
export async function persistWorkspaceSnapshot(
    snapshot: AppStateSnapshot,
): Promise<AppStateSnapshot> {
    return saveAppState(snapshot);
}
