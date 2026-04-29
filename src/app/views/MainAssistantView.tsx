import { useCallback } from "react";
import { AssistantPage } from "../../features/assistant";
import {
    useSnapshot,
    usePromptFlow,
    useUiFeedback,
    useApiKeyState,
} from "../../store/appStore";
import { useAssistantActions } from "../../features/assistant/useAssistantActions";

/** Renders the full assistant workspace in the main window. */
export function MainAssistantView() {
    const snapshot = useSnapshot();
    const { promptText, responseText, isSending, setPromptText } =
        usePromptFlow();
    const { apiKeyPresent } = useApiKeyState();
    const { lastErrorDetails, clearErrorDetails } = useUiFeedback();
    const { sendCurrentPrompt, selectAgent, updateAgents } =
        useAssistantActions({
            isQuickWindow: false,
        });

    const handleSend = useCallback(() => {
        void sendCurrentPrompt();
    }, [sendCurrentPrompt]);

    if (!snapshot) {
        return null;
    }

    return (
        <AssistantPage
            agents={snapshot.agents}
            selectedAgentId={snapshot.selectedAgentId}
            promptText={promptText}
            responseText={responseText}
            isSending={isSending}
            apiKeyPresent={apiKeyPresent}
            errorDetails={lastErrorDetails}
            onSelectAgent={selectAgent}
            onPromptChange={setPromptText}
            onSend={handleSend}
            onUpdateAgents={updateAgents}
            onClearErrorDetails={clearErrorDetails}
        />
    );
}
