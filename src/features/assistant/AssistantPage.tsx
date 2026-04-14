import type { Agent } from "../../shared/types/appState";
import { Button, Card } from "../../shared/components";
import type { AssistantPageProps } from "./types";
import { useAssistantAgentManagement } from "./useAssistantAgentManagement";

const controlClass =
    "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface AssistantAccordionItemProps {
    agent: Agent;
    isOpen: boolean;
    canDelete: boolean;
    onToggle: (agentId: string) => void;
    onUpdateName: (agentId: string, name: string) => void;
    onUpdatePrompt: (agentId: string, systemPrompt: string) => void;
    onDelete: (agentId: string) => void;
}

/** Collapsible editor row for a single assistant definition. */
function AssistantAccordionItem({
    agent,
    isOpen,
    canDelete,
    onToggle,
    onUpdateName,
    onUpdatePrompt,
    onDelete,
}: Readonly<AssistantAccordionItemProps>) {
    const displayName = agent.name.trim() || "Untitled assistant";

    return (
        <li>
            <details
                className="group rounded-lg border bg-card open:border-primary"
                open={isOpen}
            >
                <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [::-webkit-details-marker]:hidden"
                    onClick={(event) => {
                        event.preventDefault();
                        onToggle(agent.id);
                    }}
                >
                    <span className="text-sm font-semibold text-card-foreground">
                        {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground transition group-open:rotate-90">
                        ▸
                    </span>
                </summary>

                <div className="grid max-h-0 -translate-y-0.5 gap-3 overflow-hidden px-3 opacity-0 transition-all duration-200 group-open:max-h-175 group-open:translate-y-0 group-open:pb-3 group-open:opacity-100">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor={`assistant-name-${agent.id}`}
                            className="text-xs font-medium text-muted-foreground"
                        >
                            Name
                        </label>
                        <input
                            id={`assistant-name-${agent.id}`}
                            className={controlClass}
                            value={agent.name}
                            onChange={(event) =>
                                onUpdateName(agent.id, event.target.value)
                            }
                        />

                        <label
                            htmlFor={`assistant-prompt-${agent.id}`}
                            className="text-xs font-medium text-muted-foreground"
                        >
                            System Prompt
                        </label>
                        <textarea
                            id={`assistant-prompt-${agent.id}`}
                            className={`${controlClass} min-h-30 resize-y`}
                            value={agent.systemPrompt}
                            onChange={(event) =>
                                onUpdatePrompt(agent.id, event.target.value)
                            }
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
                </div>
            </details>
        </li>
    );
}

/**
 * Renders the main assistant management and interaction view.
 */
export function AssistantPage({
	agents,
	selectedAgent,
	responseText,
	onUpdateAgents,
}: Readonly<AssistantPageProps>) {
	const {
		openAssistantId,
		canDelete,
		canCreate,
		handleToggleAgent,
		handleUpdateName,
		handleUpdatePrompt,
		handleDeleteAgent,
		handleCreateAgent,
	} = useAssistantAgentManagement({
		agents,
		onUpdateAgents,
		selectedAgentId: selectedAgent?.id ?? null,
		responseText: responseText,
	});

	return (
		<div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
			<aside className="flex flex-col gap-4">
				<Card>
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Assistants</h2>
						<Button
							variant="ghost"
							disabled={!canCreate}
							onClick={handleCreateAgent}
						>
							New
						</Button>
					</div>
					<ul className="flex flex-col gap-2">
						{agents.map((agent) => (
							<AssistantAccordionItem
								key={agent.id}
								agent={agent}
								isOpen={openAssistantId === agent.id}
								canDelete={canDelete}
								onToggle={handleToggleAgent}
								onUpdateName={handleUpdateName}
								onUpdatePrompt={handleUpdatePrompt}
								onDelete={handleDeleteAgent}
							/>
						))}
					</ul>
				</Card>
			</aside>
			<Card className="flex-1">
				<h2 className="text-lg font-semibold">Conversation</h2>
				<p className="text-sm text-muted-foreground">
					This is where the conversation with the selected assistant
					will go.
				</p>
			</Card>
		</div>
	);
}
