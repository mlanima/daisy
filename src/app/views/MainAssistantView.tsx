import { useCallback } from "react";
import { AssistantPage } from "../../features/assistant";
import { useSnapshot, usePromptFlow, useUiFeedback } from "../../store/appStore";
import { useAssistantActions } from "../../features/assistant/useAssistantActions";

/** Renders the full assistant workspace in the main window. */
export function MainAssistantView() {
    const snapshot = useSnapshot();
    const { promptText, responseText, isSending, setPromptText } = usePromptFlow();
    const { lastErrorDetails, clearErrorDetails } = useUiFeedback();
    const { sendCurrentPrompt, selectAgent, updateAgents } = useAssistantActions({
        isQuickWindow: false,
    });

    if (!snapshot) {
        return null;
    }

    const handleSend = useCallback(() => {
        void sendCurrentPrompt();
    }, [sendCurrentPrompt]);

    return (
        <AssistantPage
            agents={snapshot.agents}
            selectedAgentId={snapshot.selectedAgentId}
            promptText={promptText}
            responseText={responseText}
            isSending={isSending}
            errorDetails={lastErrorDetails}
            onSelectAgent={selectAgent}
            onPromptChange={setPromptText}
            onSend={handleSend}
            onUpdateAgents={updateAgents}
            onClearErrorDetails={clearErrorDetails}
        />
    );
}
