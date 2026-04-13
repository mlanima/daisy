import type { Agent } from "../../shared/types/appState";
import { Button, Card } from "../../shared/components";
import type { AssistantPageProps } from "./types";
import { useAssistantAgentManagement } from "./useAssistantAgentManagement";

interface AssistantAccordionItemProps {
    agent: Agent;
    isOpen: boolean;
    canDelete: boolean;
    onToggle: (agentId: string) => void;
    onUpdateName: (agentId: string, name: string) => void;
    onUpdatePrompt: (agentId: string, systemPrompt: string) => void;
    onDelete: (agentId: string) => void;
}

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
            <details className="agent-accordion" open={isOpen}>
                <summary
                    className="agent-accordion-summary"
                    onClick={(event) => {
                        event.preventDefault();
                        onToggle(agent.id);
                    }}
                >
                    <span className="agent-name">{displayName}</span>
                </summary>

                <div className="agent-accordion-content">
                    <div className="agent-manage-grid">
                        <label htmlFor={`assistant-name-${agent.id}`}>
                            Name
                        </label>
                        <input
                            id={`assistant-name-${agent.id}`}
                            value={agent.name}
                            onChange={(event) =>
                                onUpdateName(agent.id, event.target.value)
                            }
                        />

                        <label htmlFor={`assistant-prompt-${agent.id}`}>
                            System prompt
                        </label>
                        <textarea
                            id={`assistant-prompt-${agent.id}`}
                            value={agent.systemPrompt}
                            onChange={(event) =>
                                onUpdatePrompt(agent.id, event.target.value)
                            }
                        />

                        <div className="agent-manage-actions">
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

export function AssistantPage({
    agents,
    selectedAgentId,
    promptText,
    responseText,
    isSending,
    errorDetails,
    onSelectAgent,
    onPromptChange,
    onSend,
    onUpdateAgents,
    onClearErrorDetails,
}: Readonly<AssistantPageProps>) {
    const {
        activeAgent,
        hasResponse,
        isAssistantsOpen,
        openAssistantId,
        updateAgent,
        removeAgent,
        addAgent,
        toggleAssistantsPanel,
        toggleAgentAccordion,
    } = useAssistantAgentManagement({
        agents,
        selectedAgentId,
        responseText,
        onUpdateAgents,
    });

    return (
        <section className="workspace assistant-workspace">
            <div className="main-panel">
                <header className="top-bar">
                    <div className="top-bar-group">
                        <label htmlFor="agent-select">Agent</label>
                        <select
                            id="agent-select"
                            value={selectedAgentId ?? ""}
                            onChange={(event) =>
                                onSelectAgent(event.target.value)
                            }
                        >
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        variant="primary"
                        disabled={
                            isSending || !activeAgent || !promptText.trim()
                        }
                        onClick={onSend}
                    >
                        {isSending ? "Sending..." : "Send"}
                    </Button>
                </header>

                <div
                    className={`panel-grid ${hasResponse ? "has-response" : ""}`}
                >
                    <Card className="prompt-card">
                        <header>
                            <h3>Prompt</h3>
                        </header>
                        <textarea
                            value={promptText}
                            placeholder="Selected text will appear here after double Ctrl+C."
                            onChange={(event) =>
                                onPromptChange(event.target.value)
                            }
                        />
                    </Card>

                    {hasResponse ? (
                        <Card className="response-card response-popup">
                            <header>
                                <h3>Response</h3>
                                <p>
                                    Generated output from your selected AI
                                    model.
                                </p>
                            </header>
                            <pre>{responseText}</pre>

                            {errorDetails ? (
                                <div className="error-log-block">
                                    <div className="inline-row">
                                        <h4>Last error details</h4>
                                        <Button
                                            variant="ghost"
                                            onClick={onClearErrorDetails}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    <pre>{errorDetails}</pre>
                                </div>
                            ) : null}
                        </Card>
                    ) : null}
                </div>
            </div>

            <aside className="left-panel assistants-panel">
                <details
                    className="assistants-fold"
                    open={isAssistantsOpen}
                    onToggle={(event) =>
                        toggleAssistantsPanel(event.currentTarget.open)
                    }
                >
                    <summary className="assistants-summary">
                        <h2>Assistants</h2>
                    </summary>

                    <div className="assistants-fold-content">
                        <div className="panel-header">
                            <p>Manage your assistants</p>
                            <Button variant="primary" onClick={addAgent}>
                                Add Assistant
                            </Button>
                        </div>

                        <ul className="agent-list accordion-list">
                            {agents.map((agent) => (
                                <AssistantAccordionItem
                                    key={agent.id}
                                    agent={agent}
                                    isOpen={openAssistantId === agent.id}
                                    canDelete={agents.length > 1}
                                    onToggle={toggleAgentAccordion}
                                    onUpdateName={(agentId, name) =>
                                        updateAgent(agentId, (current) => ({
                                            ...current,
                                            name,
                                        }))
                                    }
                                    onUpdatePrompt={(agentId, systemPrompt) =>
                                        updateAgent(agentId, (current) => ({
                                            ...current,
                                            systemPrompt,
                                        }))
                                    }
                                    onDelete={removeAgent}
                                />
                            ))}
                        </ul>
                    </div>
                </details>
            </aside>
        </section>
    );
}
