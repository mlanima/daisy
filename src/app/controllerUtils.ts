import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { AppStateSnapshot } from "../shared/types/appState";
import {
    getAppState,
    hasApiKey,
    saveAppState,
} from "../shared/services/tauri/tauriClient";

export interface WorkspaceBootstrapResult {
    snapshot: AppStateSnapshot;
    apiKeyPresent: boolean;
}

export async function bootstrapWorkspace(): Promise<WorkspaceBootstrapResult> {
    const [snapshot, apiKeyPresent] = await Promise.all([
        getAppState(),
        hasApiKey(),
    ]);

    return {
        snapshot,
        apiKeyPresent,
    };
}

export async function persistWorkspaceSnapshot(
    snapshot: AppStateSnapshot,
): Promise<AppStateSnapshot> {
    return saveAppState(snapshot);
}

export async function loadWorkspaceSnapshot(): Promise<AppStateSnapshot> {
    return getAppState();
}

export function isQuickWindowMode(): boolean {
    try {
        return getCurrentWebviewWindow().label === "quick";
    } catch {
        return false;
    }
}

export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const firstLine = error.message.split("\n")[0]?.trim();
        if (firstLine) {
            return firstLine;
        }
    }

    if (typeof error === "string") {
        const firstLine = error.split("\n")[0]?.trim();
        if (firstLine) {
            return firstLine;
        }
    }

    if (typeof error === "object" && error !== null) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === "string") {
            const firstLine = maybeMessage.split("\n")[0]?.trim();
            if (firstLine) {
                return firstLine;
            }
        }
    }

    return "Unexpected error.";
}

export function extractErrorDetails(error: unknown): string {
    if (error instanceof Error) {
        return error.stack || error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    if (typeof error === "object" && error !== null) {
        try {
            return JSON.stringify(error, null, 2);
        } catch {
            return "Failed to serialize error details.";
        }
    }

    if (
        typeof error === "number" ||
        typeof error === "boolean" ||
        typeof error === "bigint"
    ) {
        return `${error}`;
    }

    if (typeof error === "symbol") {
        return error.description ? `Symbol(${error.description})` : "Symbol()";
    }

    if (error === undefined) {
        return "undefined";
    }

    return "Unknown error details.";
}
