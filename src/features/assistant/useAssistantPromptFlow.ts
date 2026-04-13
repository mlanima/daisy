import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStateSnapshot } from "../../shared/types/appState";
import { fetchQuickCaptureData, streamAgentResponse } from "./assistantService";

type StatusTone = "idle" | "success" | "error";

interface SendPromptOverrides {
    promptOverride?: string;
    sourceText?: string;
    agentId?: string;
}

interface RefCell<T> {
    current: T;
}

interface UseAssistantPromptFlowParams {
    snapshotRef: RefCell<AppStateSnapshot | null>;
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    setStatus: (tone: StatusTone, message: string) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
}

export function useAssistantPromptFlow({
    snapshotRef,
    applySnapshotLocally,
    setStatus,
    clearErrorDetails,
    reportError,
}: UseAssistantPromptFlowParams) {
    const [promptText, setPromptText] = useState("");
    const [sourceText, setSourceText] = useState("");
    const [responseText, setResponseText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const promptRef = useRef("");
    const sourceRef = useRef("");
    const isSendingRef = useRef(false);

    useEffect(() => {
        promptRef.current = promptText;
    }, [promptText]);

    useEffect(() => {
        sourceRef.current = sourceText;
    }, [sourceText]);

    useEffect(() => {
        isSendingRef.current = isSending;
    }, [isSending]);

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
            await fetchQuickCaptureData();

        applySnapshotLocally(latestSnapshot);

        if (!latestCapture?.text.trim()) {
            clearCapturedText();
            return;
        }

        applyCapturedText(latestCapture.text);
    }, [applyCapturedText, applySnapshotLocally, clearCapturedText]);

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
                await streamAgentResponse(
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
        [clearErrorDetails, reportError, setStatus, snapshotRef],
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
