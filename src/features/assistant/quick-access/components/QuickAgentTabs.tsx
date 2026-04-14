import type { Agent } from "../../../../shared/types/appState";
import { Button } from "../../../../shared/components";

interface QuickAgentTabsProps {
    visibleAgents: Agent[];
    hiddenAgents: Agent[];
    selectedAgentId: string | null;
    isOverflowOpen: boolean;
    onSelectAgent: (agentId: string) => void;
    onToggleOverflow: () => void;
}

/** Renders visible quick-agent tabs and an overflow toggle when needed. */
export function QuickAgentTabs({
    visibleAgents,
    hiddenAgents,
    selectedAgentId,
    isOverflowOpen,
    onSelectAgent,
    onToggleOverflow,
}: Readonly<QuickAgentTabsProps>) {
    return (
        <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
            {visibleAgents.map((agent, index) => {
                const isLastVisible = index === visibleAgents.length - 1;
                const isActive = selectedAgentId === agent.id;

                return (
                    <Button
                        key={agent.id}
                        variant="unstyled"
                        className={[
                            "shrink-0 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-left text-inherit transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900",
                            isLastVisible
                                ? "min-w-0 flex-1 truncate"
                                : "whitespace-nowrap",
                            isActive
                                ? "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
                                : "text-slate-700 dark:text-slate-200",
                        ].join(" ")}
                        onClick={() => onSelectAgent(agent.id)}
                        title={agent.name}
                    >
                        {agent.name}
                    </Button>
                );
            })}

            {hiddenAgents.length > 0 ? (
                <Button
                    variant="unstyled"
                    className={[
                        "rounded-md border border-slate-300 bg-white px-2 py-0.5 text-inherit transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900",
                        isOverflowOpen
                            ? "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
                            : "text-slate-700 dark:text-slate-200",
                    ].join(" ")}
                    onClick={onToggleOverflow}
                    aria-label="Show more agents"
                >
                    ...
                </Button>
            ) : null}
        </div>
    );
}
