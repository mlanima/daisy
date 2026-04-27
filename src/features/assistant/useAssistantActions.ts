import { useCallback, useEffect, useRef } from "react";
import type { Agent, RunAgentRequest } from "../../shared/types/appState";
import { updateRecentAgentIds } from "./agentUtils";
import { fetchQuickCaptureData } from "./assistantService";
import {
    defaultAssistantFlowDependencies,
    type AssistantFlowDependencies,
} from "./assistantFlowDependencies";
import { useAppStore, usePromptFlow } from "../../store/appStore";
import { useShallow } from "zustand/react/shallow";

interface AssistantActionsParams {
    isQuickWindow: boolean;
    dependencies?: AssistantFlowDependencies;
}

/**
 * Flattened hook that handles all assistant-related actions:
 * - Sending prompts with streaming responses
 * - Managing clipboard capture and auto-send
 * - Selecting and updating agents
 * - Persisting changes to store
 */
export function useAssistantActions({
    isQuickWindow,
    dependencies,
}: Readonly<AssistantActionsParams>) {
    const activeDependencies = dependencies ?? defaultAssistantFlowDependencies;

    // Store state & actions
    const { snapshot, setSnapshot, setStatus, setError, clearErrorDetails } =
        useAppStore(
            useShallow((state) => ({
                snapshot: state.snapshot,
                setSnapshot: state.setSnapshot,
                setStatus: state.setStatus,
                setError: state.setError,
                clearErrorDetails: state.clearErrorDetails,
            })),
        );

    const { promptText, setPromptText, applyCapturedText, setResponseText } =
        usePromptFlow();

    const { isSending, setIsSending, responseText } = useAppStore(
        useShallow((state) => ({
            isSending: state.isSending,
            setIsSending: state.setIsSending,
            responseText: state.responseText,
        })),
    );

    const snapshotRef = useRef(snapshot);
    const promptRef = useRef(promptText);
    const sourceRef = useRef("");
    const responseRef = useRef(responseText);
    const isSendingRef = useRef(isSending);

    // Keep refs in sync with state
    snapshotRef.current = snapshot;
    promptRef.current = promptText;
    responseRef.current = responseText;
    isSendingRef.current = isSending;

    /** Refreshes quick capture and applies to state. */
    const refreshQuickCapture = useCallback(async () => {
        try {
            const { latestCapture, snapshot: latestSnapshot } =
                await fetchQuickCaptureData();

            setSnapshot(latestSnapshot);

            const latestCaptureText = latestCapture?.text.trim() ?? "";

            if (!latestCaptureText) {
                return;
            }

            const currentPromptText = promptRef.current.trim();
            const currentSourceText = sourceRef.current.trim();
            const hasExistingResponse = responseRef.current.trim().length > 0;
            const isSameAsCurrentCapture =
                latestCaptureText === currentPromptText ||
                latestCaptureText === currentSourceText;

            if (hasExistingResponse && isSameAsCurrentCapture) {
                return;
            }

            applyCapturedText(latestCaptureText);
        } catch (error) {
            setError(error, "Failed to refresh clipboard");
        }
    }, [applyCapturedText, setError, setSnapshot]);

    /** Sends current prompt and streams response. */
    const sendCurrentPrompt = useCallback(
        async (overrides?: {
            promptOverride?: string;
            sourceText?: string;
            agentId?: string;
        }) => {
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
                const request: RunAgentRequest = {
                    agentId,
                    sourceText: overrides?.sourceText ?? sourceRef.current,
                    promptOverride: promptToSend,
                };

                await activeDependencies.streamAgentResponse(
                    request,
                    (chunk) => {
                        responseRef.current += chunk;
                        setResponseText(responseRef.current);
                    },
                );

                setStatus("success", "Response generated.");
                clearErrorDetails();
            } catch (error) {
                setError(error);
            } finally {
                isSendingRef.current = false;
                setIsSending(false);
            }
        },
        [
            clearErrorDetails,
            isQuickWindow,
            setError,
            setIsSending,
            setResponseText,
            setStatus,
        ],
    );

    /** Selects an agent and persists to store. */
    const selectAgent = useCallback(
        (agentId: string) => {
            if (!snapshot) {
                return;
            }

            const nextSnapshot = {
                ...snapshot,
                selectedAgentId: agentId,
                settings: {
                    ...snapshot.settings,
                    recentAgentIds: updateRecentAgentIds(
                        snapshot.settings.recentAgentIds,
                        agentId,
                    ),
                },
            };

            const nextAgent = nextSnapshot.agents.find(
                (agent) => agent.id === agentId,
            );

            if (nextAgent && !promptText.trim()) {
                setPromptText(sourceRef.current);
            }

            setSnapshot(nextSnapshot);

            // Persist to backend
            activeDependencies.persistSnapshot(nextSnapshot).catch((error) => {
                setError(error, "Failed to select agent");
            });
        },
        [
            activeDependencies,
            promptText,
            setError,
            setPromptText,
            setSnapshot,
            snapshot,
        ],
    );

    /** Updates agent list and persists changes. */
    const updateAgents = useCallback(
        (agents: Agent[], selectedAgentId: string | null) => {
            if (!snapshot) {
                return;
            }

            const fallbackSelectedId = selectedAgentId ?? agents[0]?.id ?? null;
            const validAgentIds = new Set(agents.map((agent) => agent.id));
            const sanitizedRecentAgentIds = snapshot.settings.recentAgentIds
                .filter((id) => validAgentIds.has(id))
                .slice(0, 2);

            const nextSnapshot = {
                ...snapshot,
                agents,
                selectedAgentId: fallbackSelectedId,
                settings: {
                    ...snapshot.settings,
                    recentAgentIds: sanitizedRecentAgentIds,
                },
            };

            setSnapshot(nextSnapshot);

            // Persist to backend
            activeDependencies.persistSnapshot(nextSnapshot).catch((error) => {
                setError(error, "Failed to update agents");
            });
        },
        [activeDependencies, setError, setSnapshot, snapshot],
    );

    /** Subscribe to clipboard capture events (quick window). */
    useEffect(() => {
        if (!isQuickWindow) {
            return;
        }

        let closed = false;
        let unlistenClipboard: (() => void) | null = null;

        const handleClipboardCaptured = async (text: string) => {
            try {
                await refreshQuickCapture();
            } catch (error) {
                if (!closed) {
                    setError(error, "Clipboard refresh failed");
                }
            }

            if (closed || !isQuickWindow || !text.trim()) {
                return;
            }

            const activeSnapshot = snapshotRef.current;
            const activeAgent = activeSnapshot?.agents.find(
                (agent) => agent.id === activeSnapshot.selectedAgentId,
            );

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

        const initClipboardListener = async () => {
            try {
                if (isQuickWindow) {
                    await refreshQuickCapture();

                    if (closed) {
                        return;
                    }
                }

                unlistenClipboard =
                    await activeDependencies.subscribeClipboardCaptured(
                        (payload) => {
                            if (
                                closed ||
                                !isQuickWindow ||
                                !payload.text.trim()
                            ) {
                                return;
                            }

                            void handleClipboardCaptured(payload.text);
                        },
                    );
            } catch (error) {
                if (!closed) {
                    setError(error, "Clipboard listener failed");
                }
            }
        };

        void initClipboardListener();

        return () => {
            closed = true;
            unlistenClipboard?.();
        };
    }, [
        isQuickWindow,
        activeDependencies,
        applyCapturedText,
        refreshQuickCapture,
        sendCurrentPrompt,
        setError,
    ]);

    return {
        refreshQuickCapture,
        sendCurrentPrompt,
        selectAgent,
        updateAgents,
    };
}
