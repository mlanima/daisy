import { useRef, useState } from "react";
import type { Agent } from "../../../shared/types/appState";
import { AgentDropdownTrigger } from "../components/AgentDropdownTrigger";
import { AgentDropdownMenu } from "../components/AgentDropdownMenu";

interface AgentSelectorProps {
    agents: Agent[];
    selectedAgentId: string | null;
    onSelectAgent: (agentId: string) => void;
    boundaryRef?: React.RefObject<HTMLElement | null>;
}

/** Dropdown selector for choosing the active agent. */
export function AgentSelector({
    agents,
    selectedAgentId,
    onSelectAgent,
    boundaryRef,
}: Readonly<AgentSelectorProps>) {
    const anchorRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const activeAgent = agents.find((a) => a.id === selectedAgentId);
    const label = activeAgent?.name?.trim() || "Select agent";

    return (
        <div className="grid w-fit gap-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Agent
            </p>
            <div ref={anchorRef} className="w-fit">
                <AgentDropdownTrigger
                    label={label}
                    isOpen={isOpen}
                    onToggle={() => setIsOpen((prev) => !prev)}
                    ariaLabel="Choose agent"
                    className="h-11 min-w-44 max-w-[30ch] bg-background px-3"
                />
                <AgentDropdownMenu
                    agents={agents}
                    anchorRef={anchorRef}
                    boundaryRef={boundaryRef}
                    selectedAgentId={selectedAgentId}
                    isOpen={isOpen}
                    onSelectAgent={(agentId) => {
                        onSelectAgent(agentId);
                        setIsOpen(false);
                    }}
                />
            </div>
        </div>
    );
}
