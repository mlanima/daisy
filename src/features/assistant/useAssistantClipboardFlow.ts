import { useEffect, type RefObject } from "react";
import type { AppStateSnapshot } from "../../shared/types/appState";
import type { AssistantFlowDependencies } from "./assistantFlowDependencies";

interface SendPromptOverrides {
    promptOverride?: string;
    sourceText?: string;
    agentId?: string;
}

interface UseAssistantClipboardFlowParams {
    isQuickWindow: boolean;
    snapshotRef: RefObject<AppStateSnapshot | null>;
    refreshQuickCapture: () => Promise<void>;
    applyCapturedText: (text: string) => void;
    sendCurrentPrompt: (overrides?: SendPromptOverrides) => Promise<void>;
    reportError: (error: unknown, prefix?: string) => void;
    dependencies: Pick<
        AssistantFlowDependencies,
        "subscribeClipboardCaptured" | "resolveSelectedAgent"
    >;
}

/**
 * Subscribes to clipboard capture events and optionally auto-sends prompts.
 */
export function useAssistantClipboardFlow({
    isQuickWindow,
    snapshotRef,
    refreshQuickCapture,
    applyCapturedText,
    sendCurrentPrompt,
    reportError,
    dependencies,
}: UseAssistantClipboardFlowParams) {
    useEffect(() => {
        let closed = false;
        let unlistenClipboard: (() => void) | null = null;

        const handleClipboardCaptured = async (text: string) => {
            try {
                await refreshQuickCapture();
            } catch (error) {
                if (!closed) {
                    reportError(error, "Clipboard refresh failed");
                }
            }

            if (closed || !isQuickWindow) {
                return;
            }

            const activeSnapshot = snapshotRef.current;
            const activeAgent =
                dependencies.resolveSelectedAgent(activeSnapshot);

            if (!activeSnapshot || !activeAgent) {
                return;
            }

            applyCapturedText(text);

            if (activeSnapshot.settings.autoSendPrompt) {
                void sendCurrentPrompt({
                    agentId: activeAgent.id,
                    promptOverride: text,
                    sourceText: text,
                });
            }
        };

        /** Initializes clipboard subscription and optional quick-window refresh. */
        const initClipboardListener = async () => {
            try {
                if (isQuickWindow) {
                    await refreshQuickCapture();

                    if (closed) {
                        return;
                    }
                }

                unlistenClipboard =
                    await dependencies.subscribeClipboardCaptured((payload) => {
                        if (closed || !isQuickWindow || !payload.text.trim()) {
                            return;
                        }

                        void handleClipboardCaptured(payload.text);
                    });
            } catch (error) {
                if (!closed) {
                    reportError(error, "Clipboard listener failed");
                }
            }
        };

        void initClipboardListener();

        return () => {
            closed = true;
            if (unlistenClipboard) {
                unlistenClipboard();
            }
        };
    }, [
        applyCapturedText,
        isQuickWindow,
        refreshQuickCapture,
        reportError,
        sendCurrentPrompt,
        snapshotRef,
        dependencies,
    ]);
}
