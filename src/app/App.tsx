import { useEffect } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "../shared/components";
import { useAppStore, useSnapshot, useNavigation, useBootstrapState } from "../store/appStore";
import { MainWindowTitleBar } from "./components/MainWindowTitleBar";
import { MainAssistantView } from "./views/MainAssistantView";
import { QuickAssistantView } from "./views/QuickAssistantView";
import { SettingsView } from "./views/SettingsView";
import { bootstrapWorkspace, persistWorkspaceSnapshot } from "./services/workspaceService";
import "./styles/app.css";

/**
 * Initializes app state by bootstrapping workspace and setting up DOM attributes.
 */
function useAppInitialization() {
    const { isBootstrapping, completeBootstrap } = useBootstrapState();
    const { initializeApp, setSnapshot, setError, clearStatus } = useAppStore((state) => ({
        initializeApp: state.initializeApp,
        setSnapshot: state.setSnapshot,
        setError: state.setError,
        clearStatus: state.clearStatus,
    }));

    const snapshot = useSnapshot();

    // Initialize app on mount
    useEffect(() => {
        if (!isBootstrapping) {
            return;
        }

        let mounted = true;

        const bootstrap = async () => {
            try {
                const { snapshot: initialSnapshot, apiKeyPresent } =
                    await bootstrapWorkspace();

                if (!mounted) {
                    return;
                }

                initializeApp(initialSnapshot, apiKeyPresent);
                clearStatus();
            } catch (error) {
                if (mounted) {
                    setError(error, "Failed to bootstrap app");
                }
            } finally {
                if (mounted) {
                    completeBootstrap();
                }
            }
        };

        void bootstrap();

        return () => {
            mounted = false;
        };
    }, [isBootstrapping, initializeApp, setError, clearStatus, completeBootstrap]);

    // Repair selected agent reference if needed
    useEffect(() => {
        if (!snapshot) {
            return;
        }

        if (snapshot.agents.length === 0) {
            if (snapshot.selectedAgentId === null) {
                return;
            }

            const fixed = { ...snapshot, selectedAgentId: null };
            setSnapshot(fixed);
            void persistWorkspaceSnapshot(fixed);
            return;
        }

        const isValid = snapshot.agents.some(
            (agent) => agent.id === snapshot.selectedAgentId,
        );

        if (isValid) {
            return;
        }

        const fixed = {
            ...snapshot,
            selectedAgentId: snapshot.agents[0]?.id ?? null,
        };

        setSnapshot(fixed);
        void persistWorkspaceSnapshot(fixed);
    }, [snapshot, setSnapshot]);

    // Apply UI shell styling
    useEffect(() => {
        if (!snapshot) {
            return;
        }

        document.documentElement.dataset.theme = snapshot.settings.darkMode
            ? "dark"
            : "light";

        document.documentElement.dataset.windowSize =
            snapshot.settings.windowSize;
    }, [snapshot]);
}

/**
 * Renders the main app content once initialized.
 */
function AppContent() {
    const { isBootstrapping } = useBootstrapState();
    const { view, setView } = useNavigation();
    const snapshot = useSnapshot();
    const isQuickWindow = useAppStore((state) => state.isQuickWindow);
    const { status } = useAppStore((state) => ({
        status: state.status,
    }));

    // Derive selected agent from snapshot
    const selectedAgent =
        snapshot?.agents.find(
            (agent) => agent.id === snapshot.selectedAgentId,
        ) ?? null;

    if (isBootstrapping) {
        return (
            <main className="grid min-h-[68vh] place-content-center gap-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight">
                    Launching Assistant...
                </h1>
            </main>
        );
    }

    if (!snapshot || !selectedAgent) {
        return (
            <main className="grid min-h-[68vh] place-content-center gap-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight text-rose-600 dark:text-rose-300">
                    Failed to initialize app state.
                </h1>
                <p className="text-sm">
                    {status.message || "Please restart the application."}
                </p>
            </main>
        );
    }

    if (isQuickWindow) {
        return <QuickAssistantView />;
    }

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
            <MainWindowTitleBar />

            <div className="relative min-h-0 w-full flex-1 overflow-x-hidden">
                <div className="pointer-events-none absolute inset-x-0 -top-18 z-0 mx-auto h-64 max-w-5xl rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-8 top-10 z-0 h-44 w-44 rounded-full bg-emerald-400/20 blur-2xl" />

                <main className="custom-scrollbar relative z-10 flex h-full w-full flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
                    {view === "assistant" ? (
                        <header className="rounded-xl border border-border/75 bg-card/80 p-3 shadow-sm backdrop-blur-xl">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span
                                        aria-hidden="true"
                                        className="app-brand-logo"
                                    />
                                    <div className="min-w-0">
                                        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                                            AIDS Assistant
                                        </h1>
                                        <p className="truncate text-sm text-muted-foreground">
                                            Prompt in, response out.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="unstyled"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                                    aria-label="Open settings"
                                    onClick={() => setView("settings")}
                                >
                                    <SettingsIcon className="h-5 w-5" />
                                </Button>
                            </div>
                        </header>
                    ) : null}
                    <div
                        className={view === "assistant" ? "min-h-0 flex-1" : ""}
                    >
                        {view === "assistant" ? (
                            <MainAssistantView />
                        ) : (
                            <SettingsView />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

/**
 * Main app component that initializes and renders the UI.
 */
function App() {
    useAppInitialization();
    return <AppContent />;
}

export default App;
