import { useCallback } from "react";
import { QuickAssistantPage } from "../../features/assistant";
import { useSnapshot, usePromptFlow } from "../../store/appStore";
import { useAssistantActions } from "../../features/assistant/useAssistantActions";
import { openMainAssistantWindow } from "../../features/assistant/assistantService";
import { useUiFeedback } from "../../store/appStore";

/** Renders the compact quick-assistant surface used in popup mode. */
export function QuickAssistantView() {
    const snapshot = useSnapshot();
    const { promptText, responseText, isSending, setPromptText } = usePromptFlow();
    const { setError } = useUiFeedback();
    const { refreshQuickCapture, sendCurrentPrompt, selectAgent } = useAssistantActions({
        isQuickWindow: true,
    });

    if (!snapshot) {
        return (
            <main className="grid min-h-18 place-content-center px-3 py-2 text-center text-sm text-muted-foreground">
                Restoring quick assistant...
            </main>
        );
    }

    const handleSend = useCallback(() => {
        void sendCurrentPrompt();
    }, [sendCurrentPrompt]);

    const handleOpenFullApp = useCallback(async () => {
        try {
            await openMainAssistantWindow();
        } catch (error) {
            setError(error, "Failed to open main window");
        }
    }, [setError]);

    return (
        <QuickAssistantPage
            agents={snapshot.agents}
            selectedAgentId={snapshot.selectedAgentId}
            recentAgentIds={snapshot.settings.recentAgentIds}
            promptText={promptText}
            responseText={responseText}
            isSending={isSending}
            windowSize={snapshot.settings.windowSize}
            onSelectAgent={selectAgent}
            onPromptChange={setPromptText}
            onRefreshCapture={refreshQuickCapture}
            onSend={handleSend}
            onOpenFullApp={handleOpenFullApp}
        />
    );
}
