import { Settings as SettingsIcon } from "lucide-react";
import type { Agent } from "../../../shared/types/appState";
import { Button } from "../../../shared/components";
import { AgentListItem } from "./AgentListItem";

interface AgentStudioProps {
    isOpen: boolean;
    isExpanded: boolean;
    agents: Agent[];
    openAgentId: string | null;
    onClose: () => void;
    onToggleAgent: (agentId: string) => void;
    onUpdateName: (agentId: string, name: string) => void;
    onUpdatePrompt: (agentId: string, systemPrompt: string) => void;
    onDeleteAgent: (agentId: string) => void;
    onCreateAgent: () => void;
}

/** Side panel for managing (edit, delete, create) agents. */
export function AgentStudio({
    isOpen,
    isExpanded,
    agents,
    openAgentId,
    onClose,
    onToggleAgent,
    onUpdateName,
    onUpdatePrompt,
    onDeleteAgent,
    onCreateAgent,
}: Readonly<AgentStudioProps>) {
    const canDelete = agents.length > 1;

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={`fixed inset-x-0 bottom-0 top-10 z-40 flex justify-end overflow-hidden transition-opacity duration-200 ${
                isExpanded ? "bg-black/35 opacity-100" : "bg-black/0 opacity-0"
            } backdrop-blur-sm`}
        >
            <Button
                variant="unstyled"
                className="absolute inset-0"
                aria-label="Close agent studio"
                onClick={onClose}
            />

            <aside
                className={`custom-scrollbar relative z-10 flex h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto border-l border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out ${
                    isExpanded ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            Agent Studio
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Create, edit, and organize your assistants.
                        </p>
                    </div>

                    <Button
                        variant="unstyled"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                        aria-label="Close agent studio"
                        onClick={onClose}
                    >
                        <SettingsIcon className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-background/70 p-3">
                    <p className="text-sm text-muted-foreground">
                        {agents.length} total agents
                    </p>
                    <Button
                        variant="primary"
                        onClick={onCreateAgent}
                    >
                        New Agent
                    </Button>
                </div>

                <ul className="flex min-h-0 flex-col gap-2">
                    {agents.map((agent) => (
                        <AgentListItem
                            key={agent.id}
                            agent={agent}
                            isOpen={openAgentId === agent.id}
                            canDelete={canDelete}
                            onToggle={onToggleAgent}
                            onUpdateName={onUpdateName}
                            onUpdatePrompt={onUpdatePrompt}
                            onDelete={onDeleteAgent}
                        />
                    ))}
                </ul>
            </aside>
        </div>
    );
}
