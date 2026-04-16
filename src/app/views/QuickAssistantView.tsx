import { QuickAssistantPage } from "../../features/assistant";
import { useAppControllerStore } from "../appControllerStore";

/** Renders the compact quick-assistant surface used in popup mode. */
export function QuickAssistantView() {
    const controller = useAppControllerStore((state) => state.controller);

    if (!controller) {
        return (
            <main className="grid min-h-18 place-content-center px-3 py-2 text-center text-sm text-muted-foreground">
                Loading quick assistant...
            </main>
        );
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
        return (
            <main className="grid min-h-18 place-content-center px-3 py-2 text-center text-sm text-muted-foreground">
                Restoring quick assistant...
            </main>
        );
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
