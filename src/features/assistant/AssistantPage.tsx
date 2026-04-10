import { useEffect, useState } from "react";
import { createDraftAgent } from "../../domain/defaults";
import type { Agent } from "../../domain/types";

interface AssistantPageProps {
    readonly agents: Agent[];
    readonly selectedAgentId: string | null;
    readonly promptText: string;
    readonly responseText: string;
    readonly isSending: boolean;
    readonly errorDetails: string;
    readonly onSelectAgent: (agentId: string) => void;
    readonly onPromptChange: (value: string) => void;
    readonly onSend: () => void;
    readonly onUpdateAgents: (
        agents: Agent[],
        selectedAgentId: string | null,
    ) => void;
    readonly onClearErrorDetails: () => void;
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
}: AssistantPageProps) {
    const [isAssistantsOpen, setIsAssistantsOpen] = useState(true);
    const [openAssistantId, setOpenAssistantId] = useState<string | null>(null);

    const activeAgent =
        agents.find((agent) => agent.id === selectedAgentId) ??
        agents[0] ??
        null;
    const hasResponse = responseText.trim().length > 0;

    const updateAgent = (agentId: string, updater: (agent: Agent) => Agent) => {
        const nextAgents = agents.map((agent) =>
            agent.id === agentId ? updater(agent) : agent,
        );

        onUpdateAgents(nextAgents, selectedAgentId);
    };

    const removeAgent = (agentId: string) => {
        if (agents.length <= 1) {
            return;
        }

        const nextAgents = agents.filter((agent) => agent.id !== agentId);
        const nextSelectedId =
            selectedAgentId === agentId
                ? (nextAgents[0]?.id ?? null)
                : selectedAgentId;

        onUpdateAgents(nextAgents, nextSelectedId);
    };

    const addAgent = () => {
        const newAgent = createDraftAgent();
        onUpdateAgents([...agents, newAgent], selectedAgentId ?? newAgent.id);

        setOpenAssistantId(newAgent.id);
    };

    useEffect(() => {
        if (
            openAssistantId &&
            !agents.some((agent) => agent.id === openAssistantId)
        ) {
            setOpenAssistantId(null);
        }
    }, [agents, openAssistantId]);

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

                    <button
                        type="button"
                        className="primary"
                        disabled={
                            isSending || !activeAgent || !promptText.trim()
                        }
                        onClick={onSend}
                    >
                        {isSending ? "Sending..." : "Send"}
                    </button>
                </header>

                <div
                    className={`panel-grid ${hasResponse ? "has-response" : ""}`}
                >
                    <section className="card prompt-card">
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
                    </section>

                    {hasResponse ? (
                        <section className="card response-card response-popup">
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
                                        <button
                                            type="button"
                                            className="ghost"
                                            onClick={onClearErrorDetails}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <pre>{errorDetails}</pre>
                                </div>
                            ) : null}
                        </section>
                    ) : null}
                </div>
            </div>

            <aside className="left-panel assistants-panel">
                <details
                    className="assistants-fold"
                    open={isAssistantsOpen}
                    onToggle={(event) => {
                        const nextOpen = event.currentTarget.open;

                        setIsAssistantsOpen(nextOpen);

                        if (!nextOpen) {
                            setOpenAssistantId(null);
                        }
                    }}
                >
                    <summary className="assistants-summary">
                        <h2>Assistants</h2>
                    </summary>

                    <div className="assistants-fold-content">
                        <div className="panel-header">
                            <p>Manage your assistants</p>
                            <button
                                type="button"
                                className="primary"
                                onClick={addAgent}
                            >
                                Add Assistant
                            </button>
                        </div>

                        <ul className="agent-list accordion-list">
                            {agents.map((agent) => {
                                const displayName =
                                    agent.name.trim() || "Untitled assistant";

                                return (
                                    <li key={agent.id}>
                                        <details
                                            className="agent-accordion"
                                            open={openAssistantId === agent.id}
                                        >
                                            <summary
                                                className="agent-accordion-summary"
                                                onClick={(event) => {
                                                    event.preventDefault();

                                                    setOpenAssistantId(
                                                        openAssistantId ===
                                                            agent.id
                                                            ? null
                                                            : agent.id,
                                                    );
                                                }}
                                            >
                                                <span className="agent-name">
                                                    {displayName}
                                                </span>
                                            </summary>

                                            <div className="agent-accordion-content">
                                                <div className="agent-manage-grid">
                                                    <label
                                                        htmlFor={`assistant-name-${agent.id}`}
                                                    >
                                                        Name
                                                    </label>
                                                    <input
                                                        id={`assistant-name-${agent.id}`}
                                                        value={agent.name}
                                                        onChange={(event) =>
                                                            updateAgent(
                                                                agent.id,
                                                                (current) => ({
                                                                    ...current,
                                                                    name: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                    />

                                                    <label
                                                        htmlFor={`assistant-prompt-${agent.id}`}
                                                    >
                                                        System prompt
                                                    </label>
                                                    <textarea
                                                        id={`assistant-prompt-${agent.id}`}
                                                        value={
                                                            agent.systemPrompt
                                                        }
                                                        onChange={(event) =>
                                                            updateAgent(
                                                                agent.id,
                                                                (current) => ({
                                                                    ...current,
                                                                    systemPrompt:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />

                                                    <div className="agent-manage-actions">
                                                        <button
                                                            type="button"
                                                            className="ghost danger"
                                                            disabled={
                                                                agents.length <=
                                                                1
                                                            }
                                                            onClick={() =>
                                                                removeAgent(
                                                                    agent.id,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </details>
            </aside>
        </section>
    );
}
