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
    const isSendingRef = useRef(false);
    promptRef.current = promptText;
    sourceRef.current = sourceText;
    isSendingRef.current = isSending;

    const applyCapturedText = useCallback((text: string) => {
        setSourceText(text);
        setPromptText(text);
        setResponseText("");
    }, []);

    const clearCapturedText = useCallback(() => {
        setSourceText("");
        setPromptText("");
        setResponseText("");
    }, []);

    const refreshQuickCapture = useCallback(async () => {
        const { latestCapture, snapshot: latestSnapshot } =
            await dependencies.fetchQuickCaptureData();

        applySnapshotLocally(latestSnapshot);

        if (!latestCapture?.text.trim()) {
            clearCapturedText();
            return;
        }

        applyCapturedText(latestCapture.text);
    }, [
        applyCapturedText,
        applySnapshotLocally,
        clearCapturedText,
        dependencies,
    ]);

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
