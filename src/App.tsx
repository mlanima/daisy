import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "./App.css";
import type { Agent, AppStateSnapshot, UiView } from "./domain/types";
import { AssistantPage } from "./features/assistant/AssistantPage";
import { QuickAssistantPage } from "./features/assistant/QuickAssistantPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import {
    clearApiKey,
    getAppState,
    hasApiKey,
    getLatestClipboardCapture,
    openMainWindow,
    onClipboardCaptured,
    runAgentStream,
    onAiStreamChunk,
    saveApiKey,
    saveAppState,
} from "./infrastructure/tauriClient";

type StatusTone = "idle" | "success" | "error";

interface UiStatus {
    tone: StatusTone;
    message: string;
}

function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const firstLine = error.message.split("\n")[0]?.trim();
        if (firstLine) {
            return firstLine;
        }
    }

    if (typeof error === "string") {
        const firstLine = error.split("\n")[0]?.trim();
        if (firstLine) {
            return firstLine;
        }
    }

    if (typeof error === "object" && error !== null) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === "string") {
            const firstLine = maybeMessage.split("\n")[0]?.trim();
            if (firstLine) {
                return firstLine;
            }
        }
    }

    return "Unexpected error.";
}

function extractErrorDetails(error: unknown): string {
    if (error instanceof Error) {
        return error.stack || error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    if (typeof error === "object" && error !== null) {
        try {
            return JSON.stringify(error, null, 2);
        } catch {
            return "Failed to serialize error details.";
        }
    }

    return String(error);
}

function resolveSelectedAgent(snapshot: AppStateSnapshot | null): Agent | null {
    if (!snapshot || snapshot.agents.length === 0) {
        return null;
    }

    return (
        snapshot.agents.find(
            (agent) => agent.id === snapshot.selectedAgentId,
        ) ?? snapshot.agents[0]
    );
}

function updateRecentAgentIds(
    currentRecentAgentIds: string[],
    agentId: string,
): string[] {
    return [
        agentId,
        ...currentRecentAgentIds.filter((id) => id !== agentId),
    ].slice(0, 2);
}

function App() {
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

    const isQuickWindow = useMemo(() => {
        try {
            return getCurrentWebviewWindow().label === "quick";
        } catch {
            return false;
        }
    }, []);

    const refreshQuickCapture = useCallback(async () => {
        const [latestCapture, latestSnapshot] = await Promise.all([
            getLatestClipboardCapture(),
            getAppState(),
        ]);

        setSnapshot(latestSnapshot);
        snapshotRef.current = latestSnapshot;

        if (!latestCapture?.text.trim()) {
            setSourceText("");
            setPromptText("");
            setResponseText("");
            return;
        }

        setSourceText(latestCapture.text);
        setPromptText(latestCapture.text);
        setResponseText("");
    }, []);

    const selectedAgent = useMemo(
        () => resolveSelectedAgent(snapshot),
        [snapshot],
    );

    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot]);

    useEffect(() => {
        isSendingRef.current = isSending;
    }, [isSending]);

    useEffect(() => {
        promptRef.current = promptText;
    }, [promptText]);

    useEffect(() => {
        sourceRef.current = sourceText;
    }, [sourceText]);

    useEffect(() => {
        let mounted = true;

        const bootstrap = async () => {
            try {
                const [loadedSnapshot, keyPresent] = await Promise.all([
                    getAppState(),
                    hasApiKey(),
                ]);

                if (!mounted) {
                    return;
                }

                setSnapshot(loadedSnapshot);
                setApiKeyPresent(keyPresent);
            } catch (error) {
                if (mounted) {
                    setStatus({
                        tone: "error",
                        message: extractErrorMessage(error),
                    });
                    setLastErrorDetails(extractErrorDetails(error));
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
    }, []);

    const persistSnapshot = async (
        nextSnapshot: AppStateSnapshot,
        successMessage?: string,
    ) => {
        setSnapshot(nextSnapshot);
        snapshotRef.current = nextSnapshot;

        try {
            const saved = await saveAppState(nextSnapshot);
            setSnapshot(saved);
            snapshotRef.current = saved;

            if (successMessage) {
                setStatus({ tone: "success", message: successMessage });
            }
            setLastErrorDetails("");
        } catch (error) {
            setStatus({
                tone: "error",
                message: extractErrorMessage(error),
            });
            setLastErrorDetails(extractErrorDetails(error));
        }
    };

    const sendCurrentPrompt = async (overrides?: {
        promptOverride?: string;
        sourceText?: string;
        agentId?: string;
    }) => {
        const activeSnapshot = snapshotRef.current;

        if (!activeSnapshot) {
            return;
        }

        const agentId = overrides?.agentId ?? activeSnapshot.selectedAgentId;
        const promptToSend = (
            overrides?.promptOverride ?? promptRef.current
        ).trim();

        if (!agentId) {
            setStatus({ tone: "error", message: "Select an agent first." });
            return;
        }

        if (!promptToSend) {
            setStatus({ tone: "error", message: "Prompt cannot be empty." });
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

        let chunkListenerUnlisten: (() => void) | null = null;

        try {
            chunkListenerUnlisten = await onAiStreamChunk((chunk) => {
                setResponseText((prev) => prev + chunk);
            });

            await runAgentStream({
                agentId,
                sourceText: overrides?.sourceText ?? sourceRef.current,
                promptOverride: promptToSend,
            });

            setStatus({
                tone: "success",
                message: `Response generated.`,
            });
            setLastErrorDetails("");
        } catch (error) {
            setStatus({ tone: "error", message: extractErrorMessage(error) });
            setLastErrorDetails(extractErrorDetails(error));
        } finally {
            if (chunkListenerUnlisten) {
                chunkListenerUnlisten();
            }
            isSendingRef.current = false;
            setIsSending(false);
        }
    };

    useEffect(() => {
        let closed = false;
        let unlisten: (() => void) | null = null;

        const init = async () => {
            try {
                if (isQuickWindow) {
                    await refreshQuickCapture();

                    if (closed) {
                        return;
                    }
                }

                unlisten = await onClipboardCaptured((payload) => {
                    if (closed) {
                        return;
                    }

                    if (!isQuickWindow) {
                        return;
                    }

                    if (!payload.text.trim()) {
                        return;
                    }

                    const activeSnapshot = snapshotRef.current;
                    const activeAgent = resolveSelectedAgent(activeSnapshot);

                    if (!activeSnapshot || !activeAgent) {
                        return;
                    }

                    setSourceText(payload.text);
                    setPromptText(payload.text);
                    setResponseText("");

                    const shouldAutoSend =
                        activeSnapshot.settings.autoSendPrompt;

                    if (shouldAutoSend) {
                        void sendCurrentPrompt({
                            agentId: activeAgent.id,
                            promptOverride: payload.text,
                            sourceText: payload.text,
                        });
                    }
                });
            } catch (error) {
                if (!closed) {
                    setStatus({
                        tone: "error",
                        message: `Clipboard listener failed: ${extractErrorMessage(error)}`,
                    });
                    setLastErrorDetails(extractErrorDetails(error));
                }
            }
        };

        void init();

        return () => {
            closed = true;
            if (unlisten) {
                unlisten();
            }
        };
    }, [isQuickWindow]);

    useEffect(() => {
        if (!snapshot || snapshot.agents.length === 0) {
            return;
        }

        if (snapshot.selectedAgentId) {
            const exists = snapshot.agents.some(
                (agent) => agent.id === snapshot.selectedAgentId,
            );

            if (exists) {
                return;
            }
        }

        const next = {
            ...snapshot,
            selectedAgentId: snapshot.agents[0].id,
        };

        void persistSnapshot(next);
    }, [snapshot]);

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

    const onSelectAgent = (agentId: string) => {
        const activeSnapshot = snapshotRef.current;

        if (!activeSnapshot) {
            return;
        }

        const next = {
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

        const nextAgent = next.agents.find((agent) => agent.id === agentId);

        if (nextAgent && !promptRef.current.trim()) {
            setPromptText(sourceRef.current);
        }

        void persistSnapshot(next);
    };

    const onUpdateAgents = (
        agents: Agent[],
        selectedAgentId: string | null,
    ) => {
        const activeSnapshot = snapshotRef.current;

        if (!activeSnapshot) {
            return;
        }

        const fallbackSelected = selectedAgentId ?? agents[0]?.id ?? null;
        const validAgentIds = new Set(agents.map((agent) => agent.id));
        const sanitizedRecentAgentIds = activeSnapshot.settings.recentAgentIds
            .filter((id) => validAgentIds.has(id))
            .slice(0, 2);

        void persistSnapshot({
            ...activeSnapshot,
            agents,
            selectedAgentId: fallbackSelected,
            settings: {
                ...activeSnapshot.settings,
                recentAgentIds: sanitizedRecentAgentIds,
            },
        });
    };

    const onUpdateSettings = (settings: AppStateSnapshot["settings"]) => {
        const activeSnapshot = snapshotRef.current;

        if (!activeSnapshot) {
            return;
        }

        void persistSnapshot({ ...activeSnapshot, settings });
    };

    const onSaveApiKey = async (apiKey: string) => {
        try {
            await saveApiKey(apiKey);
            const updated = await getAppState();
            setSnapshot(updated);
            snapshotRef.current = updated;
            setApiKeyPresent(true);
            setStatus({ tone: "success", message: "API key saved securely." });
            setLastErrorDetails("");
        } catch (error) {
            setStatus({ tone: "error", message: extractErrorMessage(error) });
            setLastErrorDetails(extractErrorDetails(error));
        }
    };

    const onClearApiKey = async () => {
        try {
            await clearApiKey();
            const updated = await getAppState();
            setSnapshot(updated);
            snapshotRef.current = updated;
            setApiKeyPresent(false);
            setStatus({ tone: "success", message: "API key cleared." });
            setLastErrorDetails("");
        } catch (error) {
            setStatus({ tone: "error", message: extractErrorMessage(error) });
            setLastErrorDetails(extractErrorDetails(error));
        }
    };

    const onOpenFullApp = async () => {
        try {
            await openMainWindow();
        } catch (error) {
            setStatus({ tone: "error", message: extractErrorMessage(error) });
            setLastErrorDetails(extractErrorDetails(error));
        }
    };

    if (isBootstrapping) {
        return (
            <main className="boot-screen">
                <h1>Launching Assistant...</h1>
            </main>
        );
    }

    if (!snapshot || !selectedAgent) {
        return (
            <main className="boot-screen">
                <h1>Failed to initialize app state.</h1>
                <p>{status.message || "Please restart the application."}</p>
            </main>
        );
    }

    if (isQuickWindow) {
        return (
            <QuickAssistantPage
                agents={snapshot.agents}
                selectedAgentId={snapshot.selectedAgentId}
                recentAgentIds={snapshot.settings.recentAgentIds}
                promptText={promptText}
                responseText={responseText}
                isSending={isSending}
                windowSize={snapshot.settings.windowSize}
                onSelectAgent={onSelectAgent}
                onPromptChange={setPromptText}
                onRefreshCapture={refreshQuickCapture}
                onSend={() => {
                    void sendCurrentPrompt();
                }}
                onOpenFullApp={() => {
                    void onOpenFullApp();
                }}
            />
        );
    }

    return (
        <main className="app-shell">
            <header className="app-header">
                <div>
                    <h1>AIDS Desktop Assistant</h1>
                    <p>
                        Capture selected text with Ctrl+C, Ctrl+C and process it
                        instantly.
                    </p>
                </div>

                <nav className="view-tabs" aria-label="Views">
                    <button
                        type="button"
                        className={view === "assistant" ? "tab active" : "tab"}
                        onClick={() => setView("assistant")}
                    >
                        Assistant
                    </button>
                    <button
                        type="button"
                        className={view === "settings" ? "tab active" : "tab"}
                        onClick={() => setView("settings")}
                    >
                        Settings
                    </button>
                </nav>
            </header>

            {status.message ? (
                <div className={`status-banner ${status.tone}`}>
                    {status.message}
                </div>
            ) : null}

            {view === "assistant" ? (
                <AssistantPage
                    agents={snapshot.agents}
                    selectedAgentId={snapshot.selectedAgentId}
                    promptText={promptText}
                    responseText={responseText}
                    isSending={isSending}
                    errorDetails={lastErrorDetails}
                    onSelectAgent={onSelectAgent}
                    onPromptChange={setPromptText}
                    onSend={() => {
                        void sendCurrentPrompt();
                    }}
                    onUpdateAgents={onUpdateAgents}
                    onClearErrorDetails={() => setLastErrorDetails("")}
                />
            ) : (
                <SettingsPage
                    settings={snapshot.settings}
                    apiKeyPresent={apiKeyPresent}
                    onBack={() => setView("assistant")}
                    onUpdateSettings={onUpdateSettings}
                    onSaveApiKey={onSaveApiKey}
                    onClearApiKey={onClearApiKey}
                />
            )}
        </main>
    );
}

export default App;
