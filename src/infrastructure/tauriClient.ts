import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import type {
    AiRunResponse,
    AppStateSnapshot,
    ClipboardCapturedEvent,
    RunAgentRequest,
} from "../domain/types";

const CLIPBOARD_CAPTURED_EVENT = "clipboard-captured";

export interface QuickWindowResizeResult {
    width: number;
    height: number;
    isHeightClamped: boolean;
}

export async function getAppState(): Promise<AppStateSnapshot> {
    return invoke<AppStateSnapshot>("get_app_state");
}

export async function saveAppState(
    snapshot: AppStateSnapshot,
): Promise<AppStateSnapshot> {
    return invoke<AppStateSnapshot>("save_app_state", { snapshot });
}

export async function runAgent(
    request: RunAgentRequest,
): Promise<AiRunResponse> {
    return invoke<AiRunResponse>("run_agent", { request });
}

export async function runAgentStream(request: RunAgentRequest): Promise<void> {
    return invoke("run_agent_stream", { request });
}

export async function saveApiKey(apiKey: string): Promise<void> {
    return invoke("save_api_key", { apiKey });
}

export async function hasApiKey(): Promise<boolean> {
    return invoke<boolean>("has_api_key");
}

export async function clearApiKey(): Promise<void> {
    return invoke("clear_api_key");
}

export async function getApiKeyPreview(): Promise<string> {
    return invoke<string>("get_api_key_preview");
}

export async function getLatestClipboardCapture(): Promise<ClipboardCapturedEvent | null> {
    return invoke<ClipboardCapturedEvent | null>(
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
    return invoke<QuickWindowResizeResult>("resize_quick_window", {
        width,
        height,
    });
}

export async function onClipboardCaptured(
    handler: (payload: ClipboardCapturedEvent) => void,
): Promise<UnlistenFn> {
    return listen<ClipboardCapturedEvent>(CLIPBOARD_CAPTURED_EVENT, (event) => {
        if (!event.payload) {
            return;
        }

        handler(event.payload);
    });
}

const AI_STREAM_CHUNK_EVENT = "ai-stream-chunk";

export async function onAiStreamChunk(
    handler: (chunk: string) => void,
): Promise<UnlistenFn> {
    return listen<string>(AI_STREAM_CHUNK_EVENT, (event) => {
        if (event.payload) {
            handler(event.payload);
        }
    });
}
