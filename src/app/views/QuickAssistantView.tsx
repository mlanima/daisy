import { QuickAssistantPage } from "../../features/assistant";
import { useAppControllerStore } from "../appControllerStore";

export function QuickAssistantView() {
    const controller = useAppControllerStore((state) => state.controller);

    if (!controller) {
        return null;
    }

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
    } = controller;

    if (!snapshot) {
        return null;
    }

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
            onSend={() => {
                void sendCurrentPrompt();
            }}
            onOpenFullApp={() => {
                void onOpenFullApp();
            }}
        />
    );
}
