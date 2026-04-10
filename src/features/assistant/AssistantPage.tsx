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
    readonly onOpenSettings: () => void;
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
    onOpenSettings,
    onClearErrorDetails,
}: AssistantPageProps) {
    const activeAgent =
        agents.find((agent) => agent.id === selectedAgentId) ??
        agents[0] ??
        null;

    return (
        <section className="workspace">
            <aside className="left-panel">
                <header className="panel-header">
                    <h2>Agents</h2>
                    <button
                        type="button"
                        className="ghost"
                        onClick={onOpenSettings}
                    >
                        Manage
                    </button>
                </header>

                <ul className="agent-list">
                    {agents.map((agent) => (
                        <li key={agent.id}>
                            <button
                                type="button"
                                className={`agent-row ${agent.id === selectedAgentId ? "active" : ""}`}
                                onClick={() => onSelectAgent(agent.id)}
                            >
                                <span className="agent-name">{agent.name}</span>
                                <span className="agent-description">
                                    {agent.description}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

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

                <div className="panel-grid">
                    <section className="card prompt-card">
                        <header>
                            <h3>Prompt</h3>
                            {activeAgent ? (
                                <p>{activeAgent.description}</p>
                            ) : null}
                        </header>
                        <textarea
                            value={promptText}
                            placeholder="Selected text will appear here after double Ctrl+C."
                            onChange={(event) =>
                                onPromptChange(event.target.value)
                            }
                        />
                    </section>

                    <section className="card response-card">
                        <header>
                            <h3>Response</h3>
                            <p>Generated output from your selected AI model.</p>
                        </header>
                        <pre>{responseText || "No response yet."}</pre>

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
                </div>
            </div>
        </section>
    );
}
