import { QuickAssistantPage } from "../../features/assistant";
import { useAppControllerContext } from "../AppControllerContext";

export function QuickAssistantView() {
    const {
        snapshot,
        promptText,
        responseText,
        isSending,
        refreshQuickCapture,
        setPromptText,
        sendCurrentPrompt,
        onSelectAgent,
        onOpenFullApp,
    } = useAppControllerContext();

    if (!snapshot) {
        return null;
    }

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
