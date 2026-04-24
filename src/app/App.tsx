import { useEffect } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button, StatusBanner } from "../shared/components";
import { useAppControllerStore } from "./appControllerStore";
import { useAppController } from "./useAppController";
import { MainWindowTitleBar } from "./components/MainWindowTitleBar";
import { MainAssistantView } from "./views/MainAssistantView";
import { QuickAssistantView } from "./views/QuickAssistantView";
import { SettingsView } from "./views/SettingsView";
import "./styles/app.css";

/**
 * Renders the top-level shell once the app controller is available.
 */
function AppContent() {
    const controller = useAppControllerStore((state) => state.controller);

    if (!controller) {
        return (
            <main className="grid min-h-[68vh] place-content-center gap-2 text-center">
                <h1 className="text-xl font-semibold tracking-tight">
                    Launching Assistant...
                </h1>
            </main>
        );
    }

    const {
        view,
        setView,
        isQuickWindow,
        selectedAgent,
        snapshot,
        isBootstrapping,
        status,
    } = controller;

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

                <main className="custom-scrollbar relative z-10 flex h-full w-full flex-col gap-5 overflow-y-auto overflow-x-hidden p-3">
                {view === "assistant" ? (
                    <header className="rounded-3xl border border-border/75 bg-card/80 p-5 shadow-[0_24px_64px_-36px_hsl(var(--foreground))] backdrop-blur-xl">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-3">
                                <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                                    Desktop AI Workflow
                                </span>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-3">
                                        <span
                                            aria-hidden="true"
                                            className="app-brand-logo"
                                        />
                                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                            AIDS Assistant
                                        </h1>
                                    </div>
                                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                        Capture text with Ctrl+C, Ctrl+C and
                                        route it through focused agent workflows
                                        with a clean, low-friction desktop
                                        experience.
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                className="h-14 w-14 p-0 text-muted-foreground border-transparent! bg-transparent! hover:border-transparent! hover:bg-transparent! hover:text-foreground hover:scale-110"
                                aria-label="Open settings"
                                onClick={() => setView("settings")}
                            >
                                <SettingsIcon className="h-8 w-8" />
                            </Button>
                        </div>
                    </header>
                ) : null}

                <StatusBanner tone={status.tone} message={status.message} />

                {view === "assistant" ? (
                    <MainAssistantView />
                ) : (
                    <SettingsView />
                )}
                </main>
            </div>
        </div>
    );
}

/**
 * Bootstraps the app controller and exposes it through the zustand store.
 */
function App() {
    const controller = useAppController();
    const setController = useAppControllerStore((state) => state.setController);

    useEffect(() => {
        setController(controller);
    }, [controller, setController]);

    return <AppContent />;
}

export default App;
