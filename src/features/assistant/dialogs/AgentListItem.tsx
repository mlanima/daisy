import type { Agent } from "../../../shared/types/appState";
import { Button } from "../../../shared/components";
import { AccordionItem } from "../accordion/AccordionItem";
import { AgentNameInput } from "../forms/AgentNameInput";
import { AgentSystemPromptInput } from "../forms/AgentSystemPromptInput";

interface AgentListItemProps {
    agent: Agent;
    isOpen: boolean;
    canDelete: boolean;
    onToggle: (agentId: string) => void;
    onUpdateName: (agentId: string, name: string) => void;
    onUpdatePrompt: (agentId: string, systemPrompt: string) => void;
    onDelete: (agentId: string) => void;
}

function toShortPromptPreview(systemPrompt: string): string {
    const condensed = systemPrompt.replace(/\s+/g, " ").trim();
    if (!condensed) {
        return "No system prompt yet.";
    }
    return condensed.length > 72 ? `${condensed.slice(0, 72)}...` : condensed;
}

/** Agent list item for accordion display in Agent Studio. */
export function AgentListItem({
    agent,
    isOpen,
    canDelete,
    onToggle,
    onUpdateName,
    onUpdatePrompt,
    onDelete,
}: Readonly<AgentListItemProps>) {
    const displayName = agent.name.trim() || "Untitled assistant";
    const promptPreview = toShortPromptPreview(agent.systemPrompt);

    return (
        <AccordionItem
            id={agent.id}
            isOpen={isOpen}
            onToggle={onToggle}
            title={displayName}
            subtitle={promptPreview}
        >
            <div className="flex flex-col gap-2">
                <AgentNameInput
                    agentId={agent.id}
                    value={agent.name}
                    onChange={(name) => onUpdateName(agent.id, name)}
                />

                <AgentSystemPromptInput
                    agentId={agent.id}
                    value={agent.systemPrompt}
                    onChange={(prompt) => onUpdatePrompt(agent.id, prompt)}
                />

                <div className="flex justify-end pt-1">
                    <Button
                        variant="ghost"
                        danger
                        disabled={!canDelete}
                        onClick={() => onDelete(agent.id)}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </AccordionItem>
    );
}
