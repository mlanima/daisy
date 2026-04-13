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

export function QuickAgentTabs({
    visibleAgents,
    hiddenAgents,
    selectedAgentId,
    isOverflowOpen,
    onSelectAgent,
    onToggleOverflow,
}: Readonly<QuickAgentTabsProps>) {
    return (
        <div className="quick-agent-row">
            {visibleAgents.map((agent, index) => {
                const isLastVisible = index === visibleAgents.length - 1;

                return (
                    <Button
                        key={agent.id}
                        variant="unstyled"
                        className={`quick-agent-pill ${isLastVisible ? "last-visible" : ""} ${selectedAgentId === agent.id ? "active" : ""}`}
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
                    className={`quick-agent-pill quick-overflow-toggle ${isOverflowOpen ? "active" : ""}`}
                    onClick={onToggleOverflow}
                    aria-label="Show more agents"
                >
                    ...
                </Button>
            ) : null}
        </div>
    );
}
