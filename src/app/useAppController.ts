import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    Agent,
    AppSettings,
    AppStateSnapshot,
} from "../shared/types/appState";
import {
    fetchQuickCaptureData,
    openMainAssistantWindow,
    streamAgentResponse,
    subscribeClipboardCaptured,
} from "../features/assistant/assistantService";
import {
    resolveSelectedAgent,
    updateRecentAgentIds,
} from "../features/assistant/agentUtils";
import {
    clearSecretApiKey,
    saveSecretApiKey,
} from "../features/settings/settingsService";
import {
    bootstrapWorkspace,
    extractErrorDetails,
    extractErrorMessage,
    isQuickWindowMode,
    loadWorkspaceSnapshot,
    persistWorkspaceSnapshot,
} from "./controllerUtils";

interface PersistSnapshotOptions {
    successMessage?: string;
}

type UiView = "assistant" | "settings";

type StatusTone = "idle" | "success" | "error";

interface UiStatus {
    tone: StatusTone;
    message: string;
}

interface SendPromptOverrides {
    promptOverride?: string;
    sourceText?: string;
    agentId?: string;
}

interface RefCell<T> {
    current: T;
}

interface RefSyncParams {
    snapshot: AppStateSnapshot | null;
    isSending: boolean;
    promptText: string;
    sourceText: string;
    snapshotRef: RefCell<AppStateSnapshot | null>;
    isSendingRef: RefCell<boolean>;
    promptRef: RefCell<string>;
    sourceRef: RefCell<string>;
}

function useSyncControllerRefs({
    snapshot,
    isSending,
    promptText,
    sourceText,
    snapshotRef,
    isSendingRef,
    promptRef,
    sourceRef,
}: RefSyncParams) {
    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot, snapshotRef]);

    useEffect(() => {
        isSendingRef.current = isSending;
    }, [isSending, isSendingRef]);

    useEffect(() => {
        promptRef.current = promptText;
    }, [promptText, promptRef]);

    useEffect(() => {
        sourceRef.current = sourceText;
    }, [sourceText, sourceRef]);
}

function useUiShellState(
    snapshot: AppStateSnapshot | null,
    isQuickWindow: boolean,
) {
    useEffect(() => {
        if (!snapshot) {
            return;
        }

        document.documentElement.dataset.theme = snapshot.settings.darkMode
            ? "dark"
            : "light";
    }, [snapshot]);

    useEffect(() => {
        if (!snapshot) {
            return;
        }

        document.documentElement.dataset.windowSize =
            snapshot.settings.windowSize;
    }, [snapshot]);

    useEffect(() => {
        document.documentElement.dataset.windowMode = isQuickWindow
            ? "quick"
            : "main";
    }, [isQuickWindow]);

    useEffect(() => {
        if (!isQuickWindow) {
            return;
        }

        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isQuickWindow]);
}

export function useAppController() {
    const [view, setView] = useState<UiView>("assistant");
    const [snapshot, setSnapshot] = useState<AppStateSnapshot | null>(null);
    const [promptText, setPromptText] = useState("");
    const [sourceText, setSourceText] = useState("");
    const [responseText, setResponseText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [apiKeyPresent, setApiKeyPresent] = useState(false);
    const [lastErrorDetails, setLastErrorDetails] = useState("");
    const [status, setStatus] = useState<UiStatus>({
        tone: "idle",
        message: "",
    });

    const snapshotRef = useRef<AppStateSnapshot | null>(null);
    const isSendingRef = useRef(false);
    const promptRef = useRef("");
    const sourceRef = useRef("");

    const isQuickWindow = useMemo(() => isQuickWindowMode(), []);

    const selectedAgent = useMemo(
        () => resolveSelectedAgent(snapshot),
        [snapshot],
    );

    useSyncControllerRefs({
        snapshot,
        isSending,
        promptText,
        sourceText,
        snapshotRef,
        isSendingRef,
        promptRef,
        sourceRef,
    });

    useUiShellState(snapshot, isQuickWindow);

    const applySnapshotLocally = useCallback(
        (nextSnapshot: AppStateSnapshot) => {
            setSnapshot(nextSnapshot);
            snapshotRef.current = nextSnapshot;
        },
        [],
    );

    const setErrorState = useCallback((error: unknown, prefix?: string) => {
        const message = extractErrorMessage(error);
        setStatus({
            tone: "error",
            message: prefix ? `${prefix}: ${message}` : message,
        });
        setLastErrorDetails(extractErrorDetails(error));
    }, []);

    const persistSnapshot = useCallback(
        async (
            nextSnapshot: AppStateSnapshot,
            options?: PersistSnapshotOptions,
        ): Promise<void> => {
            applySnapshotLocally(nextSnapshot);

            try {
                const savedSnapshot =
                    await persistWorkspaceSnapshot(nextSnapshot);
                applySnapshotLocally(savedSnapshot);

                if (options?.successMessage) {
                    setStatus({
                        tone: "success",
                        message: options.successMessage,
                    });
                }

                setLastErrorDetails("");
            } catch (error) {
                setErrorState(error);
            }
        },
        [applySnapshotLocally, setErrorState],
    );

    const refreshQuickCapture = useCallback(async () => {
        const { latestCapture, snapshot: latestSnapshot } =
            await fetchQuickCaptureData();

        applySnapshotLocally(latestSnapshot);

        if (!latestCapture?.text.trim()) {
            setSourceText("");
            setPromptText("");
            setResponseText("");
            return;
        }

        setSourceText(latestCapture.text);
        setPromptText(latestCapture.text);
        setResponseText("");
    }, [applySnapshotLocally]);

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
                setStatus({ tone: "error", message: "Select an agent first." });
                return;
            }

            if (!promptToSend) {
                setStatus({
                    tone: "error",
                    message: "Prompt cannot be empty.",
                });
                return;
            }

            if (isSendingRef.current) {
                return;
            }

            isSendingRef.current = true;
            setIsSending(true);
            setStatus({ tone: "idle", message: "" });
            setLastErrorDetails("");
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

                setStatus({
                    tone: "success",
                    message: "Response generated.",
                });
                setLastErrorDetails("");
            } catch (error) {
                setErrorState(error);
            } finally {
                isSendingRef.current = false;
                setIsSending(false);
            }
        },
        [setErrorState],
    );

    useEffect(() => {
        let mounted = true;

        const bootstrap = async () => {
            try {
                const initialState = await bootstrapWorkspace();

                if (!mounted) {
                    return;
                }

                applySnapshotLocally(initialState.snapshot);
                setApiKeyPresent(initialState.apiKeyPresent);
            } catch (error) {
                if (mounted) {
                    setErrorState(error);
                }
            } finally {
                if (mounted) {
                    setIsBootstrapping(false);
                }
            }
        };

        void bootstrap();

        return () => {
            mounted = false;
        };
    }, [applySnapshotLocally, setErrorState]);

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

                unlistenClipboard = await subscribeClipboardCaptured(
                    (payload) => {
                        if (closed || !isQuickWindow || !payload.text.trim()) {
                            return;
                        }

                        const activeSnapshot = snapshotRef.current;
                        const activeAgent =
                            resolveSelectedAgent(activeSnapshot);

                        if (!activeSnapshot || !activeAgent) {
                            return;
                        }

                        setSourceText(payload.text);
                        setPromptText(payload.text);
                        setResponseText("");

                        if (activeSnapshot.settings.autoSendPrompt) {
                            void sendCurrentPrompt({
                                agentId: activeAgent.id,
                                promptOverride: payload.text,
                                sourceText: payload.text,
                            });
                        }
                    },
                );
            } catch (error) {
                if (!closed) {
                    setErrorState(error, "Clipboard listener failed");
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
    }, [isQuickWindow, refreshQuickCapture, sendCurrentPrompt, setErrorState]);

    useEffect(() => {
        if (!snapshot || snapshot.agents.length === 0) {
            return;
        }

        if (snapshot.selectedAgentId) {
            const selectionStillExists = snapshot.agents.some(
                (agent) => agent.id === snapshot.selectedAgentId,
            );

            if (selectionStillExists) {
                return;
            }
        }

        const nextSnapshot = {
            ...snapshot,
            selectedAgentId: snapshot.agents[0].id,
        };

        void persistSnapshot(nextSnapshot);
    }, [snapshot, persistSnapshot]);

    const onSelectAgent = useCallback(
        (agentId: string) => {
            const activeSnapshot = snapshotRef.current;

            if (!activeSnapshot) {
                return;
            }

            const nextSnapshot: AppStateSnapshot = {
                ...activeSnapshot,
                selectedAgentId: agentId,
                settings: {
                    ...activeSnapshot.settings,
                    recentAgentIds: updateRecentAgentIds(
                        activeSnapshot.settings.recentAgentIds,
                        agentId,
                    ),
                },
            };

            const nextAgent = nextSnapshot.agents.find(
                (agent) => agent.id === agentId,
            );

            if (nextAgent && !promptRef.current.trim()) {
                setPromptText(sourceRef.current);
            }

            void persistSnapshot(nextSnapshot);
        },
        [persistSnapshot],
    );

    const onUpdateAgents = useCallback(
        (agents: Agent[], selectedAgentId: string | null) => {
            const activeSnapshot = snapshotRef.current;

            if (!activeSnapshot) {
                return;
            }

            const fallbackSelectedId = selectedAgentId ?? agents[0]?.id ?? null;
            const validAgentIds = new Set(agents.map((agent) => agent.id));
            const sanitizedRecentAgentIds =
                activeSnapshot.settings.recentAgentIds
                    .filter((id) => validAgentIds.has(id))
                    .slice(0, 2);

            void persistSnapshot({
                ...activeSnapshot,
                agents,
                selectedAgentId: fallbackSelectedId,
                settings: {
                    ...activeSnapshot.settings,
                    recentAgentIds: sanitizedRecentAgentIds,
                },
            });
        },
        [persistSnapshot],
    );

    const onUpdateSettings = useCallback(
        (settings: AppSettings) => {
            const activeSnapshot = snapshotRef.current;

            if (!activeSnapshot) {
                return;
            }

            void persistSnapshot({ ...activeSnapshot, settings });
        },
        [persistSnapshot],
    );

    const onSaveApiKey = useCallback(
        async (apiKey: string) => {
            try {
                await saveSecretApiKey(apiKey);
                const updatedSnapshot = await loadWorkspaceSnapshot();

                applySnapshotLocally(updatedSnapshot);
                setApiKeyPresent(true);
                setStatus({
                    tone: "success",
                    message: "API key saved securely.",
                });
                setLastErrorDetails("");
            } catch (error) {
                setErrorState(error);
            }
        },
        [applySnapshotLocally, setErrorState],
    );

    const onClearApiKey = useCallback(async () => {
        try {
            await clearSecretApiKey();
            const updatedSnapshot = await loadWorkspaceSnapshot();

            applySnapshotLocally(updatedSnapshot);
            setApiKeyPresent(false);
            setStatus({ tone: "success", message: "API key cleared." });
            setLastErrorDetails("");
        } catch (error) {
            setErrorState(error);
        }
    }, [applySnapshotLocally, setErrorState]);

    const onOpenFullApp = useCallback(async () => {
        try {
            await openMainAssistantWindow();
        } catch (error) {
            setErrorState(error);
        }
    }, [setErrorState]);

    const clearErrorDetails = useCallback(() => {
        setLastErrorDetails("");
    }, []);

    return {
        view,
        setView,
        isQuickWindow,
        selectedAgent,
        snapshot,
        isBootstrapping,
        status,
        promptText,
        responseText,
        isSending,
        apiKeyPresent,
        lastErrorDetails,
        setPromptText,
        clearErrorDetails,
        refreshQuickCapture,
        sendCurrentPrompt,
        onSelectAgent,
        onUpdateAgents,
        onUpdateSettings,
        onSaveApiKey,
        onClearApiKey,
        onOpenFullApp,
    };
}
