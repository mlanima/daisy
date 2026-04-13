import { useEffect } from "react";
import { Button, StatusBanner } from "../shared/components";
import { useAppControllerStore } from "./appControllerStore";
import { useAppController } from "./useAppController";
import { MainAssistantView } from "./views/MainAssistantView";
import { QuickAssistantView } from "./views/QuickAssistantView";
import { SettingsView } from "./views/SettingsView";
import "./styles/app.css";

function AppContent() {
    const controller = useAppControllerStore((state) => state.controller);

    if (!controller) {
        return (
            <main className="boot-screen">
                <h1>Launching Assistant...</h1>
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
        return <QuickAssistantView />;
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
                    <Button
                        variant="tab"
                        active={view === "assistant"}
                        onClick={() => setView("assistant")}
                    >
                        Assistant
                    </Button>
                    <Button
                        variant="tab"
                        active={view === "settings"}
                        onClick={() => setView("settings")}
                    >
                        Settings
                    </Button>
                </nav>
            </header>

            <StatusBanner tone={status.tone} message={status.message} />

            {view === "assistant" ? <MainAssistantView /> : <SettingsView />}
        </main>
    );
}

function App() {
    const controller = useAppController();
    const setController = useAppControllerStore((state) => state.setController);

    useEffect(() => {
        setController(controller);
    }, [controller, setController]);

    return <AppContent />;
}

export default App;
