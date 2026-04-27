import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type {
    AiRunResponse,
    AppStateSnapshot,
    ClipboardCapturedEvent,
    RunAgentRequest,
} from "../../types/appState";
import {
    aiRunResponseSchema,
    aiStreamChunkSchema,
    apiKeySchema,
    appStateSnapshotSchema,
    clipboardCapturedEventSchema,
    quickWindowResizeResultSchema,
    runAgentRequestSchema,
} from "../../schemas/appStateSchema";

const CLIPBOARD_CAPTURED_EVENT = "clipboard-captured";
const BROWSER_SNAPSHOT_STORAGE_KEY = "daisy.browser.snapshot.v1";
const BROWSER_API_KEY_STORAGE_KEY = "daisy.browser.apiKey.v1";

export interface QuickWindowResizeResult {
    width: number;
    height: number;
    isHeightClamped: boolean;
}

/**
 * Validates unknown external payloads and throws a contextual error message
 * when the runtime shape differs from the expected schema.
 * @param schema Zod schema that describes the expected runtime shape.
 * @param payload Unknown payload received from backend/event boundary.
 * @param context Human-readable context used in thrown error messages.
 * @returns Parsed payload that conforms to the provided schema.
 */
function parsePayload<T>(
    schema: z.ZodType<T>,
    payload: unknown,
    context: string,
): T {
    const result = schema.safeParse(payload);

    if (result.success) {
        return result.data;
    }

    throw new Error(`Invalid payload for ${context}: ${result.error.message}`);
}

function isTauriRuntimeAvailable(): boolean {
    if (globalThis.window === undefined) {
        return false;
    }

    const internals = (
        globalThis.window as { __TAURI_INTERNALS__?: { invoke?: unknown } }
    ).__TAURI_INTERNALS__;

    return typeof internals?.invoke === "function";
}

function createDefaultSnapshot(): AppStateSnapshot {
    return {
        agents: [
            {
                id: "translate-ua",
                name: "Translate",
                description: "Translate any text to Ukrainian",
                systemPrompt:
                    "Translate the user's text to Ukrainian. Keep names and formatting intact.",
            },
            {
                id: "grammar-de",
                name: "Grammar",
                description: "Correct German grammar and explain edits",
                systemPrompt:
                    "Correct grammar mistakes in German text and briefly explain each correction.",
            },
            {
                id: "explain",
                name: "Explain",
                description: "Explain text for a language learner",
                systemPrompt:
                    "Explain the user's text for a language learner using simple wording and examples.",
            },
        ],
        selectedAgentId: "translate-ua",
        settings: {
            autoSendPrompt: false,
            darkMode: true,
            apiBaseUrl: "https://api.openai.com/v1/chat/completions",
            windowSize: "medium",
            recentAgentIds: [],
            model: {
                model: "gpt-4o-mini",
                temperature: 0.2,
                maxTokens: 800,
            },
        },
    };
}

function getBrowserSnapshot(): AppStateSnapshot {
    if (typeof localStorage === "undefined") {
        return createDefaultSnapshot();
    }

    const rawValue = localStorage.getItem(BROWSER_SNAPSHOT_STORAGE_KEY);

    if (!rawValue) {
        return createDefaultSnapshot();
    }

    try {
        const parsed = JSON.parse(rawValue);
        return parsePayload(
            appStateSnapshotSchema,
            parsed,
            "browser snapshot storage",
        );
    } catch {
        return createDefaultSnapshot();
    }
}

function saveBrowserSnapshot(snapshot: AppStateSnapshot): AppStateSnapshot {
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(
            BROWSER_SNAPSHOT_STORAGE_KEY,
            JSON.stringify(snapshot),
        );
    }

    return snapshot;
}

function getBrowserApiKey(): string | null {
    if (typeof localStorage === "undefined") {
        return null;
    }

    return localStorage.getItem(BROWSER_API_KEY_STORAGE_KEY);
}

function saveBrowserApiKey(apiKey: string): void {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(BROWSER_API_KEY_STORAGE_KEY, apiKey);
}

function clearBrowserApiKey(): void {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.removeItem(BROWSER_API_KEY_STORAGE_KEY);
}

function getBrowserApiKeyPreviewValue(): string {
    const apiKey = getBrowserApiKey();

    if (!apiKey) {
        return "";
    }

    if (apiKey.length <= 8) {
        return "*".repeat(apiKey.length);
    }

    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

function getBrowserCommandFallback(
    command: string,
    args?: Record<string, unknown>,
): unknown {
    switch (command) {
        case "get_app_state":
            return getBrowserSnapshot();
        case "save_app_state": {
            const snapshot = parsePayload(
                appStateSnapshotSchema,
                args?.snapshot,
                "save_app_state request",
            );

            return saveBrowserSnapshot(snapshot);
        }
        case "has_api_key":
            return Boolean(getBrowserApiKey());
        case "save_api_key": {
            const apiKey = parsePayload(
                apiKeySchema,
                args?.apiKey,
                "save_api_key request",
            );
            saveBrowserApiKey(apiKey);
            return null;
        }
        case "clear_api_key":
            clearBrowserApiKey();
            return null;
        case "get_api_key_preview":
            return getBrowserApiKeyPreviewValue();
        case "get_latest_clipboard_capture":
            return null;
        case "open_main_window":
        case "suppress_quick_auto_hide":
        case "run_agent_stream":
            return null;
        case "resize_quick_window":
            return { width: 0, height: 0, isHeightClamped: false };
        case "run_agent":
            throw new Error(
                "Running agents requires the Tauri backend. Start the app with `pnpm tauri dev`.",
            );
        default:
            throw new Error(
                `Unsupported command outside Tauri runtime: ${command}`,
            );
    }
}

async function invokeCommand<T>(
    command: string,
    args?: Record<string, unknown>,
): Promise<T> {
    if (!isTauriRuntimeAvailable()) {
        return getBrowserCommandFallback(command, args) as T;
    }

    return invoke(command, args) as Promise<T>;
}

async function listenEvent<T>(
    eventName: string,
    handler: Parameters<typeof listen<T>>[1],
): Promise<UnlistenFn> {
    if (!isTauriRuntimeAvailable()) {
        return () => {};
    }

    return listen<T>(eventName, handler);
}

/** Loads full application state snapshot from backend persistence. */
export async function getAppState(): Promise<AppStateSnapshot> {
    const payload = await invokeCommand("get_app_state");
    return parsePayload(appStateSnapshotSchema, payload, "get_app_state");
}

/** Persists the provided snapshot and returns the canonical saved state. */
export async function saveAppState(
    snapshot: AppStateSnapshot,
): Promise<AppStateSnapshot> {
    const validatedSnapshot = parsePayload(
        appStateSnapshotSchema,
        snapshot,
        "save_app_state request",
    );
    const payload = await invokeCommand("save_app_state", {
        snapshot: validatedSnapshot,
    });

    return parsePayload(appStateSnapshotSchema, payload, "save_app_state");
}

/** Executes a single non-streaming assistant run command. */
export async function runAgent(
    request: RunAgentRequest,
): Promise<AiRunResponse> {
    const validatedRequest = parsePayload(
        runAgentRequestSchema,
        request,
        "run_agent request",
    );
    const payload = await invokeCommand("run_agent", {
        request: validatedRequest,
    });

    return parsePayload(aiRunResponseSchema, payload, "run_agent");
}

/** Starts streaming assistant output for a validated request payload. */
export async function runAgentStream(request: RunAgentRequest): Promise<void> {
    const validatedRequest = parsePayload(
        runAgentRequestSchema,
        request,
        "run_agent_stream request",
    );

    return invokeCommand("run_agent_stream", { request: validatedRequest });
}

/** Stores API key using backend secure-store command. */
export async function saveApiKey(apiKey: string): Promise<void> {
    const validatedApiKey = parsePayload(
        apiKeySchema,
        apiKey,
        "save_api_key request",
    );

    return invokeCommand("save_api_key", { apiKey: validatedApiKey });
}

/** Checks whether an API key is currently configured. */
export async function hasApiKey(): Promise<boolean> {
    const payload = await invokeCommand("has_api_key");
    return parsePayload(z.boolean(), payload, "has_api_key");
}

/** Removes any stored API key values. */
export async function clearApiKey(): Promise<void> {
    return invokeCommand("clear_api_key");
}

/** Fetches masked API key preview value for settings UI. */
export async function getApiKeyPreview(): Promise<string> {
    const payload = await invokeCommand("get_api_key_preview");
    return parsePayload(z.string(), payload, "get_api_key_preview");
}

/** Gets the most recent clipboard capture event, if any. */
export async function getLatestClipboardCapture(): Promise<ClipboardCapturedEvent | null> {
    const payload = await invokeCommand("get_latest_clipboard_capture");

    return parsePayload(
        clipboardCapturedEventSchema.nullable(),
        payload,
        "get_latest_clipboard_capture",
    );
}

/** Requests the backend to focus or reveal the main application window. */
export async function openMainWindow(): Promise<void> {
    return invokeCommand("open_main_window");
}

/** Temporarily suppresses backend quick-window auto-hide on focus loss. */
export async function suppressQuickAutoHide(durationMs: number): Promise<void> {
    return invokeCommand("suppress_quick_auto_hide", {
        durationMs: Math.max(0, Math.floor(durationMs)),
    });
}

/** Requests backend resize for quick window and validates resulting dimensions. */
export async function resizeQuickWindow(
    width: number,
    height: number,
): Promise<QuickWindowResizeResult> {
    const payload = await invokeCommand("resize_quick_window", {
        width,
        height,
    });

    return parsePayload(
        quickWindowResizeResultSchema,
        payload,
        "resize_quick_window",
    );
}

/**
 * Registers clipboard capture listener with runtime payload validation.
 * @returns unlisten function for cleanup.
 */
export async function onClipboardCaptured(
    handler: (payload: ClipboardCapturedEvent) => void,
): Promise<UnlistenFn> {
    return listenEvent<unknown>(CLIPBOARD_CAPTURED_EVENT, (event) => {
        if (!event.payload) {
            return;
        }

        // Ignore malformed payloads to keep listener resilient in production.
        const parsedPayload = clipboardCapturedEventSchema.safeParse(
            event.payload,
        );

        if (!parsedPayload.success) {
            console.error(
                "Invalid clipboard event payload",
                parsedPayload.error,
            );
            return;
        }

        handler(parsedPayload.data);
    });
}

const AI_STREAM_CHUNK_EVENT = "ai-stream-chunk";

/**
 * Registers AI stream chunk listener and forwards valid chunk payloads only.
 * @returns unlisten function for cleanup.
 */
export async function onAiStreamChunk(
    handler: (chunk: string) => void,
): Promise<UnlistenFn> {
    return listenEvent<unknown>(AI_STREAM_CHUNK_EVENT, (event) => {
        const parsedPayload = aiStreamChunkSchema.safeParse(event.payload);

        // Stream events are best-effort; skip invalid chunks silently.
        if (!parsedPayload.success || !parsedPayload.data) {
            return;
        }

        handler(parsedPayload.data);
    });
}
