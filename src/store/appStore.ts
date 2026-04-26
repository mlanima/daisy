import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { AppStateSnapshot } from "../shared/types/appState";
import type { UiStatus, StatusTone } from "../shared/types/feedback";

/** Error formatter for UI display. */
export interface ErrorPresenter {
    getMessage(error: unknown): string;
    getDetails(error: unknown): string;
}

/** Detects whether the current webview is in quick-window mode. */
function detectQuickWindow(): boolean {
    try {
        return getCurrentWebviewWindow().label === "quick";
    } catch {
        return false;
    }
}

/** Complete application state managed by the store. */
interface AppStoreState {
    // Bootstrap & Window Info
    isBootstrapping: boolean;
    isQuickWindow: boolean;

    // Navigation
    view: "assistant" | "settings";

    // Workspace & Settings
    snapshot: AppStateSnapshot | null;
    apiKeyPresent: boolean;

    // Assistant Prompt Flow
    promptText: string;
    sourceText: string;
    responseText: string;
    isSending: boolean;

    // UI Feedback
    status: UiStatus;
    lastErrorDetails: string;
}

/** Store actions. */
interface AppStoreActions {
    // Bootstrap & Initialization
    initializeApp: (snapshot: AppStateSnapshot, apiKeyPresent: boolean) => void;
    completeBootstrap: () => void;

    // Navigation
    setView: (view: "assistant" | "settings") => void;

    // Snapshot & Settings Management
    setSnapshot: (snapshot: AppStateSnapshot) => void;
    setApiKeyPresent: (present: boolean) => void;

    // Prompt & Response Flow
    setPromptText: (text: string) => void;
    setSourceText: (text: string) => void;
    setResponseText: (text: string) => void;
    setIsSending: (sending: boolean) => void;
    applyCapturedText: (text: string) => void;
    clearResponse: () => void;

    // Status & Error Feedback
    setStatus: (tone: StatusTone, message: string) => void;
    setError: (error: unknown, prefix?: string) => void;
    clearErrorDetails: () => void;
    clearStatus: () => void;
}

type AppStore = AppStoreState & AppStoreActions;

/** Creates the error presenter for the store. */
function createErrorPresenter(): ErrorPresenter {
    return {
        getMessage(error: unknown): string {
            if (error instanceof Error) {
                return error.message;
            }
            if (!error) {
                return "An unexpected error occurred";
            }
            if (typeof error === "string") {
                return error;
            }
            try {
                return JSON.stringify(error);
            } catch {
                return "An unexpected error occurred";
            }
        },
        getDetails(error: unknown): string {
            if (error instanceof Error) {
                return error.stack || "";
            }
            return "";
        },
    };
}

const errorPresenter = createErrorPresenter();

/** Unified Zustand store for the entire app. */
export const useAppStore = create<AppStore>((set: any) => ({
    // Initial state
    isBootstrapping: true,
    isQuickWindow: detectQuickWindow(),
    view: "assistant" as const,
    snapshot: null,
    apiKeyPresent: false,
    promptText: "",
    sourceText: "",
    responseText: "",
    isSending: false,
    status: { tone: "idle", message: "" } as UiStatus,
    lastErrorDetails: "",

    // Bootstrap
    initializeApp: (snapshot: AppStateSnapshot, apiKeyPresent: boolean) => {
        set({
            snapshot,
            apiKeyPresent,
        });
    },
    completeBootstrap: () => {
        set({ isBootstrapping: false });
    },

    // Navigation
    setView: (view: "assistant" | "settings") => {
        set({ view });
    },

    // Snapshot Management
    setSnapshot: (snapshot: AppStateSnapshot) => {
        set({ snapshot });
    },
    setApiKeyPresent: (present: boolean) => {
        set({ apiKeyPresent: present });
    },

    // Prompt & Response Flow
    setPromptText: (text: string) => {
        set({ promptText: text });
    },
    setSourceText: (text: string) => {
        set({ sourceText: text });
    },
    setResponseText: (text: string) => {
        set({ responseText: text });
    },
    setIsSending: (sending: boolean) => {
        set({ isSending: sending });
    },
    applyCapturedText: (text: string) => {
        set({
            sourceText: text,
            promptText: text,
            responseText: "",
        });
    },
    clearResponse: () => {
        set({ responseText: "" });
    },

    // Status & Error Feedback
    setStatus: (tone: StatusTone, message: string) => {
        set({ status: { tone, message } });
    },
    setError: (error: unknown, prefix?: string) => {
        const message = errorPresenter.getMessage(error);
        set({
            status: {
                tone: "error" as const,
                message: prefix ? `${prefix}: ${message}` : message,
            },
            lastErrorDetails: errorPresenter.getDetails(error),
        });
    },
    clearErrorDetails: () => {
        set({ lastErrorDetails: "" });
    },
    clearStatus: () => {
        set({ status: { tone: "idle", message: "" } });
    },
}));

/** Hook to subscribe to all state changes. */
export function useAppState() {
    return useAppStore();
}

/** Hook to get the current snapshot, triggering re-render on changes. */
export function useSnapshot() {
    return useAppStore((state) => state.snapshot);
}

/** Hook to get prompt-related state. */
export function usePromptFlow() {
    return useAppStore(
        useShallow((state) => ({
            promptText: state.promptText,
            sourceText: state.sourceText,
            responseText: state.responseText,
            isSending: state.isSending,
            setPromptText: state.setPromptText,
            setSourceText: state.setSourceText,
            setResponseText: state.setResponseText,
            setIsSending: state.setIsSending,
            applyCapturedText: state.applyCapturedText,
            clearResponse: state.clearResponse,
        })),
    );
}

/** Hook to get assistant agent info. */
export function useSelectedAgent() {
    const snapshot = useAppStore((state) => state.snapshot);
    if (!snapshot) {
        return null;
    }

    return (
        snapshot?.agents.find(
            (agent) => agent.id === snapshot.selectedAgentId,
        ) ?? null
    );
}

/** Hook to get all agents. */
export function useAgents() {
    return useAppStore((state) => state.snapshot?.agents ?? []);
}

/** Hook to get UI feedback state. */
export function useUiFeedback() {
    return useAppStore(
        useShallow((state) => ({
            status: state.status,
            lastErrorDetails: state.lastErrorDetails,
            setStatus: state.setStatus,
            setError: state.setError,
            clearErrorDetails: state.clearErrorDetails,
            clearStatus: state.clearStatus,
        })),
    );
}

/** Hook for bootstrap state. */
export function useBootstrapState() {
    return useAppStore(
        useShallow((state) => ({
            isBootstrapping: state.isBootstrapping,
            completeBootstrap: state.completeBootstrap,
        })),
    );
}

/** Hook for navigation. */
export function useNavigation() {
    return useAppStore(
        useShallow((state) => ({
            view: state.view,
            setView: state.setView,
        })),
    );
}

/** Hook for API key state. */
export function useApiKeyState() {
    return useAppStore(
        useShallow((state) => ({
            apiKeyPresent: state.apiKeyPresent,
            setApiKeyPresent: state.setApiKeyPresent,
        })),
    );
}

/** Hook for quick window mode. */
export function useIsQuickWindow() {
    return useAppStore((state) => state.isQuickWindow);
}
