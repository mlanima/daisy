import type { Agent } from "../../../../shared/types/appState";
import { Button } from "../../../../shared/components";

interface QuickOverflowMenuProps {
    hiddenAgents: Agent[];
    selectedAgentId: string | null;
    isOpen: boolean;
    onSelectAgent: (agentId: string) => void;
}

/** Popup menu for selecting agents that do not fit in visible quick tabs. */
export function QuickOverflowMenu({
    hiddenAgents,
    selectedAgentId,
    isOpen,
    onSelectAgent,
}: Readonly<QuickOverflowMenuProps>) {
    if (!isOpen || hiddenAgents.length === 0) {
        return null;
    }

    return (
        <div
            className="flex max-h-40 flex-col gap-1 overflow-auto rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
            role="menu"
            aria-label="More agents"
        >
            {hiddenAgents.map((agent) => (
                <Button
                    key={agent.id}
                    variant="unstyled"
                    role="menuitem"
                    className={[
                        "w-full rounded-md border border-transparent px-2 py-1 text-left text-inherit transition",
                        selectedAgentId === agent.id
                            ? "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
                            : "text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70",
                    ].join(" ")}
                    onClick={() => onSelectAgent(agent.id)}
                >
                    {agent.name}
                </Button>
            ))}
        </div>
    );
}
