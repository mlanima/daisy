import { useRef } from "react";
import type { AppStateSnapshot } from "../../shared/types/appState";
import type { StatusTone } from "../../shared/types/feedback";
import {
    defaultAssistantFlowDependencies,
    type AssistantFlowDependencies,
} from "./assistantFlowDependencies";
import { useAssistantAgentPersistence } from "./useAssistantAgentPersistence";
import { useAssistantClipboardFlow } from "./useAssistantClipboardFlow";
import { useAssistantPromptFlow } from "./useAssistantPromptFlow";

interface UseAssistantFlowParams {
    isQuickWindow: boolean;
    snapshot: AppStateSnapshot | null;
    applySnapshotLocally: (snapshot: AppStateSnapshot) => void;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
    setStatus: (tone: StatusTone, message: string) => void;
    clearErrorDetails: () => void;
    reportError: (error: unknown, prefix?: string) => void;
    dependencies?: AssistantFlowDependencies;
}

export function useAssistantFlow({
    isQuickWindow,
    snapshot,
    applySnapshotLocally,
    persistSnapshot,
    setStatus,
    clearErrorDetails,
    reportError,
    dependencies,
}: UseAssistantFlowParams) {
    const snapshotRef = useRef<AppStateSnapshot | null>(snapshot);
    snapshotRef.current = snapshot;
    const activeDependencies = dependencies ?? defaultAssistantFlowDependencies;

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
        dependencies: activeDependencies,
    });

    useAssistantClipboardFlow({
        isQuickWindow,
        snapshotRef,
        refreshQuickCapture,
        applyCapturedText,
        sendCurrentPrompt,
        reportError,
        dependencies: activeDependencies,
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
