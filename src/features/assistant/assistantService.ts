import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type {
    AppStateSnapshot,
    ClipboardCapturedEvent,
    RunAgentRequest,
} from "../../shared/types/appState";
import {
    getAppState,
    getLatestClipboardCapture,
    onAiStreamChunk,
    onClipboardCaptured,
    openMainWindow,
    resizeQuickWindow,
    runAgentStream,
} from "../../shared/services/tauri/tauriClient";
import type { QuickWindowResizeResult } from "../../shared/services/tauri/tauriClient";

export interface QuickCaptureData {
    latestCapture: ClipboardCapturedEvent | null;
    snapshot: AppStateSnapshot;
}

export async function fetchQuickCaptureData(): Promise<QuickCaptureData> {
    const [latestCapture, snapshot] = await Promise.all([
        getLatestClipboardCapture(),
        getAppState(),
    ]);

    return { latestCapture, snapshot };
}

export async function subscribeClipboardCaptured(
    handler: (payload: ClipboardCapturedEvent) => void,
): Promise<UnlistenFn> {
    return onClipboardCaptured(handler);
}

export async function streamAgentResponse(
    request: RunAgentRequest,
    onChunk: (chunk: string) => void,
): Promise<void> {
    const unlistenStreamChunks = await onAiStreamChunk(onChunk);

    try {
        await runAgentStream(request);
    } finally {
        unlistenStreamChunks();
    }
}

export async function openMainAssistantWindow(): Promise<void> {
    await openMainWindow();
}

export async function resizeQuickAssistantWindow(
    width: number,
    height: number,
): Promise<QuickWindowResizeResult> {
    return resizeQuickWindow(width, height);
}

export function bindQuickWindowLifecycle(onFocus: () => void): () => void {
    const webviewWindow = getCurrentWebviewWindow();

    const handleFocus = () => {
        onFocus();
    };

    const handleBlur = () => {
        void webviewWindow.hide();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("blur", handleBlur);
    };
}
