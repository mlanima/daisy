import { Button } from "../../../shared/components";
import type { QuickAssistantPageProps } from "../types";
import { useQuickAssistantShell } from "./useQuickAssistantShell";
import { QuickAgentTabs } from "./components/QuickAgentTabs";
import { QuickOverflowMenu } from "./components/QuickOverflowMenu";

/** Compact quick-window assistant UI with agent tabs and single prompt area. */
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
            className={`quick-shell ${hasResponse ? "has-output" : ""} flex h-auto max-h-none flex-col gap-1.5 overflow-visible`}
            ref={shellRef}
        >
            <div className="flex items-center justify-between gap-1.5 rounded-lg border bg-card px-1.5 py-1">
                <QuickAgentTabs
                    visibleAgents={visibleAgents}
                    hiddenAgents={hiddenAgents}
                    selectedAgentId={selectedAgentId}
                    isOverflowOpen={isOverflowOpen}
                    onSelectAgent={onSelectAgent}
                    onToggleOverflow={toggleOverflow}
                />

                <div className="inline-flex shrink-0 gap-1">
                    <Button
                        variant="ghost"
                        className="h-8 px-2.5"
                        onClick={onOpenFullApp}
                    >
                        Open
                    </Button>
                    <Button
                        variant="primary"
                        className="h-8 px-2.5"
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
                className="quick-input w-full resize-none overflow-y-hidden rounded-lg border border-input bg-card px-2 py-1.5 leading-relaxed text-card-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={promptText}
                onChange={(event) => onPromptChange(event.target.value)}
                rows={1}
            />

            {responseText.trim() ? (
                <pre className="quick-output m-0 min-h-0 flex-[0_0_auto] overflow-visible whitespace-pre-wrap wrap-break-word rounded-lg border border-input bg-card px-2 py-1.5 font-mono leading-relaxed text-card-foreground">
                    {responseText}
                </pre>
            ) : null}
        </main>
    );
}
