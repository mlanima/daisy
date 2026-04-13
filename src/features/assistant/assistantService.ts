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

/** Loads quick-window capture text and current snapshot in one request batch. */
export async function fetchQuickCaptureData(): Promise<QuickCaptureData> {
    const [latestCapture, snapshot] = await Promise.all([
        getLatestClipboardCapture(),
        getAppState(),
    ]);

    return { latestCapture, snapshot };
}

/** Subscribes to clipboard capture events emitted by the backend layer. */
export async function subscribeClipboardCaptured(
    handler: (payload: ClipboardCapturedEvent) => void,
): Promise<UnlistenFn> {
    return onClipboardCaptured(handler);
}

/** Streams assistant output chunks for a request until completion. */
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

/** Opens the full-size assistant window from quick mode. */
export async function openMainAssistantWindow(): Promise<void> {
    await openMainWindow();
}

/** Requests the backend to resize the quick assistant window. */
export async function resizeQuickAssistantWindow(
    width: number,
    height: number,
): Promise<QuickWindowResizeResult> {
    return resizeQuickWindow(width, height);
}

/**
 * Binds quick-window focus/blur behaviors and returns an unbind callback.
 * @param onFocus Callback invoked when quick window regains focus.
 * @returns Cleanup function that removes focus/blur listeners.
 */
export function bindQuickWindowLifecycle(onFocus: () => void): () => void {
    const webviewWindow = getCurrentWebviewWindow();

    /** Forwards focus to caller so quick window can refresh capture content. */
    const handleFocus = () => {
        onFocus();
    };

    /** Hides quick window whenever focus is lost. */
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
