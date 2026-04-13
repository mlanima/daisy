import { AssistantPage, QuickAssistantPage } from "../features/assistant";
import { SettingsPage } from "../features/settings";
import { Button, StatusBanner } from "../shared/components";
import { useAppController } from "./useAppController.ts";
import "./styles/app.css";

function App() {
    const {
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
    } = useAppController();

    const handleSendPrompt = () => {
        sendCurrentPrompt().catch(() => {
            // sendCurrentPrompt already handles and surfaces errors in state.
        });
    };

    const handleOpenFullApp = () => {
        onOpenFullApp().catch(() => {
            // onOpenFullApp already handles and surfaces errors in state.
        });
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
                onSend={handleSendPrompt}
                onOpenFullApp={handleOpenFullApp}
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
                    onSend={handleSendPrompt}
                    onUpdateAgents={onUpdateAgents}
                    onClearErrorDetails={clearErrorDetails}
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
