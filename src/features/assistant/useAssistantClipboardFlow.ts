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

                        const activeSnapshot = snapshotRef.current;
                        const activeAgent =
                            dependencies.resolveSelectedAgent(activeSnapshot);

                        if (!activeSnapshot || !activeAgent) {
                            return;
                        }

                        applyCapturedText(payload.text);

                        if (activeSnapshot.settings.autoSendPrompt) {
                            void sendCurrentPrompt({
                                agentId: activeAgent.id,
                                promptOverride: payload.text,
                                sourceText: payload.text,
                            });
                        }
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
