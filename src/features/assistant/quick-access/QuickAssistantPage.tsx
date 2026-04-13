import { Button } from "../../../shared/components";
import type { QuickAssistantPageProps } from "../types";
import { useQuickAssistantShell } from "./useQuickAssistantShell";
import { QuickAgentTabs } from "./components/QuickAgentTabs";
import { QuickOverflowMenu } from "./components/QuickOverflowMenu";

export function QuickAssistantPage({
    agents,
    selectedAgentId,
    recentAgentIds,
    promptText,
    responseText,
    isSending,
    windowSize,
    onSelectAgent,
    onPromptChange,
    onRefreshCapture,
    onSend,
    onOpenFullApp,
}: Readonly<QuickAssistantPageProps>) {
    const {
        promptRef,
        shellRef,
        hasResponse,
        isOverflowOpen,
        visibleAgents,
        hiddenAgents,
        toggleOverflow,
        selectHiddenAgent,
    } = useQuickAssistantShell({
        agents,
        selectedAgentId,
        recentAgentIds,
        promptText,
        responseText,
        isSending,
        windowSize,
        onSelectAgent,
        onRefreshCapture,
    });

    return (
        <main
            className={`quick-shell ${hasResponse ? "has-output" : ""}`}
            ref={shellRef}
        >
            <div className="quick-topbar">
                <QuickAgentTabs
                    visibleAgents={visibleAgents}
                    hiddenAgents={hiddenAgents}
                    selectedAgentId={selectedAgentId}
                    isOverflowOpen={isOverflowOpen}
                    onSelectAgent={onSelectAgent}
                    onToggleOverflow={toggleOverflow}
                />

                <div className="quick-top-actions">
                    <Button variant="ghost" onClick={onOpenFullApp}>
                        Open
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onSend}
                        disabled={isSending || !promptText.trim()}
                    >
                        {isSending ? "..." : "Send"}
                    </Button>
                </div>
            </div>

            <QuickOverflowMenu
                hiddenAgents={hiddenAgents}
                selectedAgentId={selectedAgentId}
                isOpen={isOverflowOpen}
                onSelectAgent={selectHiddenAgent}
            />

            <textarea
                ref={promptRef}
                className="quick-input"
                value={promptText}
                onChange={(event) => onPromptChange(event.target.value)}
                rows={1}
            />

            {responseText.trim() ? (
                <pre className="quick-output">{responseText}</pre>
            ) : null}
        </main>
    );
}
