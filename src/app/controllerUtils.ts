import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { AppStateSnapshot } from "../shared/types/appState";
import {
    getAppState,
    hasApiKey,
    saveAppState,
} from "../shared/services/tauri/tauriClient";

/** Result returned during initial workspace bootstrap. */
export interface WorkspaceBootstrapResult {
    snapshot: AppStateSnapshot;
    apiKeyPresent: boolean;
}

/** Boundary interface for reading/writing workspace state. */
export interface WorkspaceStateGateway {
    /** Reads the current persisted snapshot from storage. */
    getSnapshot(): Promise<AppStateSnapshot>;
    /** Persists a full workspace snapshot. */
    saveSnapshot(snapshot: AppStateSnapshot): Promise<AppStateSnapshot>;
    /** Checks whether an API key is available. */
    hasApiKey(): Promise<boolean>;
}

/** Application service for workspace bootstrap and snapshot lifecycle. */
export interface WorkspaceStateService {
    /** Loads the initial snapshot and API key status for app startup. */
    bootstrap(): Promise<WorkspaceBootstrapResult>;
    /** Loads the latest snapshot from persistence. */
    loadSnapshot(): Promise<AppStateSnapshot>;
    /** Persists a snapshot and returns canonical saved state. */
    persistSnapshot(snapshot: AppStateSnapshot): Promise<AppStateSnapshot>;
    /** Repairs invalid selected-agent references if present. */
    repairSelectedAgent(snapshot: AppStateSnapshot): AppStateSnapshot | null;
}

/** Tauri-backed gateway implementation for workspace state operations. */
class TauriWorkspaceStateGateway implements WorkspaceStateGateway {
    /** @inheritdoc */
    async getSnapshot(): Promise<AppStateSnapshot> {
        return getAppState();
    }

    /** @inheritdoc */
    async saveSnapshot(snapshot: AppStateSnapshot): Promise<AppStateSnapshot> {
        return saveAppState(snapshot);
    }

    /** @inheritdoc */
    async hasApiKey(): Promise<boolean> {
        return hasApiKey();
    }
}

/** Default workspace state service using a pluggable gateway. */
class DefaultWorkspaceStateService implements WorkspaceStateService {
    /** @param gateway Infrastructure adapter for persistence calls. */
    constructor(private readonly gateway: WorkspaceStateGateway) {}

    /** @inheritdoc */
    async bootstrap(): Promise<WorkspaceBootstrapResult> {
        const [snapshot, apiKeyPresent] = await Promise.all([
            this.gateway.getSnapshot(),
            this.gateway.hasApiKey(),
        ]);

        return {
            snapshot,
            apiKeyPresent,
        };
    }

    /** @inheritdoc */
    async loadSnapshot(): Promise<AppStateSnapshot> {
        return this.gateway.getSnapshot();
    }

    /** @inheritdoc */
    async persistSnapshot(
        snapshot: AppStateSnapshot,
    ): Promise<AppStateSnapshot> {
        return this.gateway.saveSnapshot(snapshot);
    }

    /** @inheritdoc */
    repairSelectedAgent(snapshot: AppStateSnapshot): AppStateSnapshot | null {
        if (snapshot.agents.length === 0) {
            return snapshot.selectedAgentId === null
                ? null
                : {
                      ...snapshot,
                      selectedAgentId: null,
                  };
        }

        if (
            snapshot.selectedAgentId &&
            snapshot.agents.some(
                (agent) => agent.id === snapshot.selectedAgentId,
            )
        ) {
            return null;
        }

        return {
            ...snapshot,
            selectedAgentId: snapshot.agents[0].id,
        };
    }
}

/** Creates a workspace state service with optional custom gateway. */
export function createWorkspaceStateService(
    gateway: WorkspaceStateGateway = new TauriWorkspaceStateGateway(),
): WorkspaceStateService {
    return new DefaultWorkspaceStateService(gateway);
}

const defaultWorkspaceStateService = createWorkspaceStateService();

/** Bootstraps workspace using the default state service instance. */
export async function bootstrapWorkspace(): Promise<WorkspaceBootstrapResult> {
    return defaultWorkspaceStateService.bootstrap();
}

/** Persists workspace snapshot using the default state service instance. */
export async function persistWorkspaceSnapshot(
    snapshot: AppStateSnapshot,
): Promise<AppStateSnapshot> {
    return defaultWorkspaceStateService.persistSnapshot(snapshot);
}

/** Loads workspace snapshot using the default state service instance. */
export async function loadWorkspaceSnapshot(): Promise<AppStateSnapshot> {
    return defaultWorkspaceStateService.loadSnapshot();
}

/** Detects whether the current webview label indicates quick-window mode. */
export function isQuickWindowMode(): boolean {
    try {
        return getCurrentWebviewWindow().label === "quick";
    } catch {
        return false;
    }
}

/** Converts unknown errors into UI-safe summary and details strings. */
export interface ErrorPresenter {
    /** Builds a concise error message suitable for status banners. */
    getMessage(error: unknown): string;
    /** Builds detailed diagnostic text suitable for error detail panels. */
    getDetails(error: unknown): string;
}

/** Default error presenter used across frontend feature flows. */
class DefaultErrorPresenter implements ErrorPresenter {
    /** @inheritdoc */
    getMessage(error: unknown): string {
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

    /** @inheritdoc */
    getDetails(error: unknown): string {
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
            return error.description
                ? `Symbol(${error.description})`
                : "Symbol()";
        }

        if (error === undefined) {
            return "undefined";
        }

        return "Unknown error details.";
    }
}

/** Creates the default error presenter implementation. */
export function createErrorPresenter(): ErrorPresenter {
    return new DefaultErrorPresenter();
}

const defaultErrorPresenter = createErrorPresenter();

/** Shortcut for extracting message using the default presenter. */
export function extractErrorMessage(error: unknown): string {
    return defaultErrorPresenter.getMessage(error);
}

/** Shortcut for extracting details using the default presenter. */
export function extractErrorDetails(error: unknown): string {
    return defaultErrorPresenter.getDetails(error);
}
