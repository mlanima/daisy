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
            className="quick-overflow-menu"
            role="menu"
            aria-label="More agents"
        >
            {hiddenAgents.map((agent) => (
                <Button
                    key={agent.id}
                    variant="unstyled"
                    role="menuitem"
                    className={`quick-overflow-item ${selectedAgentId === agent.id ? "active" : ""}`}
                    onClick={() => onSelectAgent(agent.id)}
                >
                    {agent.name}
                </Button>
            ))}
        </div>
    );
}
