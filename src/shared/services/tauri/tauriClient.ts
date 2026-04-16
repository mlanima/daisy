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

/** Loads full application state snapshot from backend persistence. */
export async function getAppState(): Promise<AppStateSnapshot> {
    const payload = await invoke("get_app_state");
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
    const payload = await invoke("save_app_state", {
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
    const payload = await invoke("run_agent", { request: validatedRequest });

    return parsePayload(aiRunResponseSchema, payload, "run_agent");
}

/** Starts streaming assistant output for a validated request payload. */
export async function runAgentStream(request: RunAgentRequest): Promise<void> {
    const validatedRequest = parsePayload(
        runAgentRequestSchema,
        request,
        "run_agent_stream request",
    );

    return invoke("run_agent_stream", { request: validatedRequest });
}

/** Stores API key using backend secure-store command. */
export async function saveApiKey(apiKey: string): Promise<void> {
    const validatedApiKey = parsePayload(
        apiKeySchema,
        apiKey,
        "save_api_key request",
    );

    return invoke("save_api_key", { apiKey: validatedApiKey });
}

/** Checks whether an API key is currently configured. */
export async function hasApiKey(): Promise<boolean> {
    const payload = await invoke("has_api_key");
    return parsePayload(z.boolean(), payload, "has_api_key");
}

/** Removes any stored API key values. */
export async function clearApiKey(): Promise<void> {
    return invoke("clear_api_key");
}

/** Fetches masked API key preview value for settings UI. */
export async function getApiKeyPreview(): Promise<string> {
    const payload = await invoke("get_api_key_preview");
    return parsePayload(z.string(), payload, "get_api_key_preview");
}

/** Gets the most recent clipboard capture event, if any. */
export async function getLatestClipboardCapture(): Promise<ClipboardCapturedEvent | null> {
    const payload = await invoke("get_latest_clipboard_capture");

    return parsePayload(
        clipboardCapturedEventSchema.nullable(),
        payload,
        "get_latest_clipboard_capture",
    );
}

/** Requests the backend to focus or reveal the main application window. */
export async function openMainWindow(): Promise<void> {
    return invoke("open_main_window");
}

/** Temporarily suppresses backend quick-window auto-hide on focus loss. */
export async function suppressQuickAutoHide(durationMs: number): Promise<void> {
    return invoke("suppress_quick_auto_hide", {
        durationMs: Math.max(0, Math.floor(durationMs)),
    });
}

/** Requests backend resize for quick window and validates resulting dimensions. */
export async function resizeQuickWindow(
    width: number,
    height: number,
): Promise<QuickWindowResizeResult> {
    const payload = await invoke("resize_quick_window", {
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
    return listen<unknown>(CLIPBOARD_CAPTURED_EVENT, (event) => {
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
    return listen<unknown>(AI_STREAM_CHUNK_EVENT, (event) => {
        const parsedPayload = aiStreamChunkSchema.safeParse(event.payload);

        // Stream events are best-effort; skip invalid chunks silently.
        if (!parsedPayload.success || !parsedPayload.data) {
            return;
        }

        handler(parsedPayload.data);
    });
}
