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

export async function getAppState(): Promise<AppStateSnapshot> {
    const payload = await invoke("get_app_state");
    return parsePayload(appStateSnapshotSchema, payload, "get_app_state");
}

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

export async function runAgentStream(request: RunAgentRequest): Promise<void> {
    const validatedRequest = parsePayload(
        runAgentRequestSchema,
        request,
        "run_agent_stream request",
    );

    return invoke("run_agent_stream", { request: validatedRequest });
}

export async function saveApiKey(apiKey: string): Promise<void> {
    const validatedApiKey = parsePayload(
        apiKeySchema,
        apiKey,
        "save_api_key request",
    );

    return invoke("save_api_key", { apiKey: validatedApiKey });
}

export async function hasApiKey(): Promise<boolean> {
    const payload = await invoke("has_api_key");
    return parsePayload(z.boolean(), payload, "has_api_key");
}

export async function clearApiKey(): Promise<void> {
    return invoke("clear_api_key");
}

export async function getApiKeyPreview(): Promise<string> {
    const payload = await invoke("get_api_key_preview");
    return parsePayload(z.string(), payload, "get_api_key_preview");
}

export async function getLatestClipboardCapture(): Promise<ClipboardCapturedEvent | null> {
    const payload = await invoke("get_latest_clipboard_capture");

    return parsePayload(
        clipboardCapturedEventSchema.nullable(),
        payload,
        "get_latest_clipboard_capture",
    );
}

export async function openMainWindow(): Promise<void> {
    return invoke("open_main_window");
}

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

export async function onClipboardCaptured(
    handler: (payload: ClipboardCapturedEvent) => void,
): Promise<UnlistenFn> {
    return listen<unknown>(CLIPBOARD_CAPTURED_EVENT, (event) => {
        if (!event.payload) {
            return;
        }

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

export async function onAiStreamChunk(
    handler: (chunk: string) => void,
): Promise<UnlistenFn> {
    return listen<unknown>(AI_STREAM_CHUNK_EVENT, (event) => {
        const parsedPayload = aiStreamChunkSchema.safeParse(event.payload);

        if (!parsedPayload.success || !parsedPayload.data) {
            return;
        }

        handler(parsedPayload.data);
    });
}
