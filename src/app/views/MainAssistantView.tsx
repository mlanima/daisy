import { AssistantPage } from "../../features/assistant";
import { useAppControllerContext } from "../AppControllerContext";

export function MainAssistantView() {
    const {
        snapshot,
        promptText,
        responseText,
        isSending,
        lastErrorDetails,
        setPromptText,
        clearErrorDetails,
        sendCurrentPrompt,
        onSelectAgent,
        onUpdateAgents,
    } = useAppControllerContext();

    if (!snapshot) {
        return null;
    }

    const handleSendPrompt = () => {
        sendCurrentPrompt().catch(() => {
            // sendCurrentPrompt already handles and surfaces errors in state.
        });
    };

    return (
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
    );
}
