import { useRef } from "react";
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
    const dropdownAnchorRef = useRef<HTMLDivElement | null>(null);

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

    const orderedAgents = [...visibleAgents, ...hiddenAgents];
    const selectedAgent =
        orderedAgents.find((agent) => agent.id === selectedAgentId) ?? null;

    return (
        <main
            className={`quick-shell ${hasResponse ? "has-output" : ""} relative flex h-auto max-h-none flex-col gap-0 overflow-visible rounded-2xl border border-border/70 bg-card/96 shadow-[0_20px_48px_-30px_hsl(var(--foreground))] backdrop-blur-xl`}
            ref={shellRef}
        >
            <div className="flex items-center justify-between gap-2 border-b border-border/65 px-2.5 py-2">
                <div ref={dropdownAnchorRef} className="min-w-0">
                    <QuickAgentTabs
                        selectedAgent={selectedAgent}
                        isOverflowOpen={isOverflowOpen}
                        onToggleOverflow={toggleOverflow}
                    />
                    <QuickOverflowMenu
                        agents={orderedAgents}
                        anchorRef={dropdownAnchorRef}
                        selectedAgentId={selectedAgentId}
                        isOpen={isOverflowOpen}
                        onSelectAgent={selectHiddenAgent}
                    />
                </div>

                <div className="inline-flex shrink-0 gap-1">
                    <Button
                        variant="ghost"
                        className="h-8 border-transparent bg-transparent px-3"
                        onClick={onOpenFullApp}
                    >
                        Open
                    </Button>
                    <Button
                        variant="primary"
                        className="h-8 px-3"
                        onClick={onSend}
                        disabled={isSending || !promptText.trim()}
                    >
                        {isSending ? "..." : "Send"}
                    </Button>
                </div>
            </div>

            <div className="border-b border-border/60 px-1.5 py-1">
                <textarea
                    ref={promptRef}
                    className="quick-input w-full resize-none overflow-y-hidden rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 leading-relaxed text-card-foreground outline-none transition focus:border-primary/50 focus:bg-background/35 focus:ring-0"
                    value={promptText}
                    onChange={(event) => onPromptChange(event.target.value)}
                    rows={1}
                />
            </div>

            {responseText.trim() ? (
                <div className="px-1.5 py-1">
                    <pre className="quick-output m-0 min-h-0 flex-[0_0_auto] overflow-visible whitespace-pre-wrap wrap-break-word rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 font-mono leading-relaxed text-card-foreground">
                        {responseText}
                    </pre>
                </div>
            ) : null}
        </main>
    );
}
