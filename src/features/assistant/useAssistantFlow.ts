import { useEffect, useRef } from "react";
import type { AppStateSnapshot } from "../../shared/types/appState";
import { useAssistantAgentPersistence } from "./useAssistantAgentPersistence";
import { useAssistantClipboardFlow } from "./useAssistantClipboardFlow";
import { useAssistantPromptFlow } from "./useAssistantPromptFlow";

type StatusTone = "idle" | "success" | "error";

interface UseAssistantFlowParams {
    isQuickWindow: boolean;
    snapshot: AppStateSnapshot | null;
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
    setStatus: (tone: StatusTone, message: string) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
}

interface RefCell<T> {
    current: T;
}

export function useAssistantFlow({
    isQuickWindow,
    snapshot,
    applySnapshotLocally,
    persistSnapshot,
    setStatus,
    clearErrorDetails,
    reportError,
}: UseAssistantFlowParams) {
    const snapshotRef = useRef<AppStateSnapshot | null>(
        snapshot,
    ) as RefCell<AppStateSnapshot | null>;

    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot]);

    const {
        promptText,
        sourceText,
        responseText,
        isSending,
        setPromptText,
        refreshQuickCapture,
        sendCurrentPrompt,
        applyCapturedText,
    } = useAssistantPromptFlow({
        snapshotRef,
        applySnapshotLocally,
        setStatus,
        clearErrorDetails,
        reportError,
    });

    useAssistantClipboardFlow({
        isQuickWindow,
        snapshotRef,
        refreshQuickCapture,
        applyCapturedText,
        sendCurrentPrompt,
        reportError,
    });

    const { onSelectAgent, onUpdateAgents } = useAssistantAgentPersistence({
        snapshotRef,
        promptText,
        sourceText,
        setPromptText,
        persistSnapshot,
    });

    return {
        promptText,
        responseText,
        isSending,
        setPromptText,
        refreshQuickCapture,
        sendCurrentPrompt,
        onSelectAgent,
        onUpdateAgents,
    };
}
