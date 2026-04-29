import { useCallback, useRef, useState, type RefObject } from "react";
import type { AppStateSnapshot } from "../../shared/types/appState";
import type { StatusTone } from "../../shared/types/feedback";
import type { AssistantFlowDependencies } from "./assistantFlowDependencies";

interface SendPromptOverrides {
    promptOverride?: string;
    sourceText?: string;
    agentId?: string;
}

interface UseAssistantPromptFlowParams {
    snapshotRef: RefObject<AppStateSnapshot | null>;
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    setStatus: (tone: StatusTone, message: string) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
    dependencies: Pick<
        AssistantFlowDependencies,
        "fetchQuickCaptureData" | "streamAgentResponse"
    >;
}

/**
 * Handles prompt drafting and streaming response lifecycle for assistant runs.
 */
export function useAssistantPromptFlow({
    snapshotRef,
    applySnapshotLocally,
    setStatus,
    clearErrorDetails,
    reportError,
    dependencies,
}: UseAssistantPromptFlowParams) {
    const [promptText, setPromptText] = useState("");
    const [sourceText, setSourceText] = useState("");
    const [responseText, setResponseText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const promptRef = useRef("");
    const sourceRef = useRef("");
    const responseRef = useRef("");
    const isSendingRef = useRef(false);
    // Refs provide latest values inside stable async callbacks.
    promptRef.current = promptText;
    sourceRef.current = sourceText;
    responseRef.current = responseText;
    isSendingRef.current = isSending;

    /** Applies captured clipboard text to source and prompt inputs. */
    const applyCapturedText = useCallback((text: string) => {
        setSourceText(text);
        setPromptText(text);
        setResponseText("");
    }, []);

    /** Refreshes quick capture and updates snapshot + prompt content. */
    const refreshQuickCapture = useCallback(async () => {
        const { latestCapture, snapshot: latestSnapshot } =
            await dependencies.fetchQuickCaptureData();

        applySnapshotLocally(latestSnapshot);

        const latestCaptureText = latestCapture?.text.trim() ?? "";

        // Preserve the current prompt/answer when no capture is available.
        if (!latestCaptureText) {
            return;
        }

        const currentPromptText = promptRef.current.trim();
        const currentSourceText = sourceRef.current.trim();
        const hasExistingResponse = responseRef.current.trim().length > 0;
        const isSameAsCurrentCapture =
            latestCaptureText === currentPromptText ||
            latestCaptureText === currentSourceText;

        // Ignore focus-refresh replays of the same capture to avoid wiping output.
        if (hasExistingResponse && isSameAsCurrentCapture) {
            return;
        }
        applyCapturedText(latestCaptureText);
    }, [applyCapturedText, applySnapshotLocally, dependencies]);

    /** Sends current prompt and streams response chunks into UI state. */
    const sendCurrentPrompt = useCallback(
        async (overrides?: SendPromptOverrides) => {
            const activeSnapshot = snapshotRef.current;

            if (!activeSnapshot) {
                return;
            }

            const agentId =
                overrides?.agentId ?? activeSnapshot.selectedAgentId;
            const promptToSend = (
                overrides?.promptOverride ?? promptRef.current
            ).trim();

            if (!agentId) {
                setStatus("error", "Select an agent first.");
                return;
            }

            if (!promptToSend) {
                setStatus("error", "Prompt cannot be empty.");
                return;
            }

            if (isSendingRef.current) {
                // Prevent concurrent runs from racing response state.
                return;
            }

            isSendingRef.current = true;
            setIsSending(true);
            setStatus("idle", "");
            clearErrorDetails();
            setResponseText("");

            try {
                await dependencies.streamAgentResponse(
                    {
                        agentId,
                        sourceText: overrides?.sourceText ?? sourceRef.current,
                        promptOverride: promptToSend,
                    },
                    (chunk) => {
                        setResponseText((previousText) => previousText + chunk);
                    },
                );

                setStatus("success", "Response generated.");
                clearErrorDetails();
            } catch (error) {
                reportError(error);
            } finally {
                isSendingRef.current = false;
                setIsSending(false);
            }
        },
        [clearErrorDetails, dependencies, reportError, setStatus, snapshotRef],
    );

    return {
        promptText,
        sourceText,
        responseText,
        isSending,
        setPromptText,
        refreshQuickCapture,
        sendCurrentPrompt,
        applyCapturedText,
    };
}
