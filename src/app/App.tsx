import { useEffect } from "react";
import { Button, StatusBanner } from "../shared/components";
import { useAppControllerStore } from "./appControllerStore";
import { useAppController } from "./useAppController";
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
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <header className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm">
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            AIDS Assistant
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Capture text with Ctrl+C, Ctrl+C and run focused AI
                            workflows quickly.
                        </p>
                    </div>

                    <nav
                        className="inline-flex rounded-lg bg-muted p-1"
                        aria-label="Views"
                    >
                        <Button
                            variant="tab"
                            active={view === "assistant"}
                            className="px-3.5"
                            onClick={() => setView("assistant")}
                        >
                            Assistant
                        </Button>
                        <Button
                            variant="tab"
                            active={view === "settings"}
                            className="px-3.5"
                            onClick={() => setView("settings")}
                        >
                            Settings
                        </Button>
                    </nav>
                </div>
            </header>

            <StatusBanner tone={status.tone} message={status.message} />

            {view === "assistant" ? <MainAssistantView /> : <SettingsView />}
        </main>
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
