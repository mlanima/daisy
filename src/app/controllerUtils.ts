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

export interface WorkspaceStateGateway {
    getSnapshot(): Promise<AppStateSnapshot>;
    saveSnapshot(snapshot: AppStateSnapshot): Promise<AppStateSnapshot>;
    hasApiKey(): Promise<boolean>;
}

export interface WorkspaceStateService {
    bootstrap(): Promise<WorkspaceBootstrapResult>;
    loadSnapshot(): Promise<AppStateSnapshot>;
    persistSnapshot(snapshot: AppStateSnapshot): Promise<AppStateSnapshot>;
    repairSelectedAgent(snapshot: AppStateSnapshot): AppStateSnapshot | null;
}

class TauriWorkspaceStateGateway implements WorkspaceStateGateway {
    async getSnapshot(): Promise<AppStateSnapshot> {
        return getAppState();
    }

    async saveSnapshot(snapshot: AppStateSnapshot): Promise<AppStateSnapshot> {
        return saveAppState(snapshot);
    }

    async hasApiKey(): Promise<boolean> {
        return hasApiKey();
    }
}

class DefaultWorkspaceStateService implements WorkspaceStateService {
    constructor(private readonly gateway: WorkspaceStateGateway) {}

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

    async loadSnapshot(): Promise<AppStateSnapshot> {
        return this.gateway.getSnapshot();
    }

    async persistSnapshot(
        snapshot: AppStateSnapshot,
    ): Promise<AppStateSnapshot> {
        return this.gateway.saveSnapshot(snapshot);
    }

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

export function createWorkspaceStateService(
    gateway: WorkspaceStateGateway = new TauriWorkspaceStateGateway(),
): WorkspaceStateService {
    return new DefaultWorkspaceStateService(gateway);
}

const defaultWorkspaceStateService = createWorkspaceStateService();

export async function bootstrapWorkspace(): Promise<WorkspaceBootstrapResult> {
    return defaultWorkspaceStateService.bootstrap();
}

export async function persistWorkspaceSnapshot(
    snapshot: AppStateSnapshot,
): Promise<AppStateSnapshot> {
    return defaultWorkspaceStateService.persistSnapshot(snapshot);
}

export async function loadWorkspaceSnapshot(): Promise<AppStateSnapshot> {
    return defaultWorkspaceStateService.loadSnapshot();
}

export function isQuickWindowMode(): boolean {
    try {
        return getCurrentWebviewWindow().label === "quick";
    } catch {
        return false;
    }
}

export interface ErrorPresenter {
    getMessage(error: unknown): string;
    getDetails(error: unknown): string;
}

class DefaultErrorPresenter implements ErrorPresenter {
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

export function createErrorPresenter(): ErrorPresenter {
    return new DefaultErrorPresenter();
}

const defaultErrorPresenter = createErrorPresenter();

export function extractErrorMessage(error: unknown): string {
    return defaultErrorPresenter.getMessage(error);
}

export function extractErrorDetails(error: unknown): string {
    return defaultErrorPresenter.getDetails(error);
}
