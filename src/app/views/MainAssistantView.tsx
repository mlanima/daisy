import { AssistantPage } from "../../features/assistant";
import { useAppControllerStore } from "../appControllerStore";

/** Renders the full assistant workspace in the main window. */
export function MainAssistantView() {
    const controller = useAppControllerStore((state) => state.controller);

    if (!controller) {
        return null;
    }

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
    } = controller;

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
            errorDetails={lastErrorDetails}
            onSelectAgent={onSelectAgent}
            onPromptChange={setPromptText}
            onSend={() => {
                void sendCurrentPrompt();
            }}
            onUpdateAgents={onUpdateAgents}
            onClearErrorDetails={clearErrorDetails}
        />
    );
}
