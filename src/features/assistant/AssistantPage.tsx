import type { Agent } from "../../shared/types/appState";
import { useState } from "react";
import { Button, Card } from "../../shared/components";
import type { AssistantPageProps } from "./types";
import { useAssistantAgentManagement } from "./useAssistantAgentManagement";

const controlClass =
    "w-full rounded-xl border border-input/85 bg-background/70 px-3 py-2.5 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 disabled:cursor-not-allowed disabled:opacity-50";

function toShortPromptPreview(systemPrompt: string): string {
    const condensed = systemPrompt.replace(/\s+/g, " ").trim();

    if (!condensed) {
        return "No system prompt yet.";
    }

    return condensed.length > 72 ? `${condensed.slice(0, 72)}...` : condensed;
}

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
    const promptPreview = toShortPromptPreview(agent.systemPrompt);

    return (
        <li>
            <details
                className="group rounded-2xl border border-border/75 bg-background/60 open:border-primary/65"
                open={isOpen}
            >
                <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 [::-webkit-details-marker]:hidden"
                    onClick={(event) => {
                        event.preventDefault();
                        onToggle(agent.id);
                    }}
                >
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                            {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {promptPreview}
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground transition group-open:rotate-90">
                        ▸
                    </span>
                </summary>

                <div className="grid max-h-0 -translate-y-0.5 gap-3 overflow-hidden px-3 opacity-0 transition-all duration-200 group-open:max-h-176 group-open:translate-y-0 group-open:pb-3 group-open:opacity-100">
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
                            placeholder="Untitled assistant"
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
                            placeholder="Define how this assistant should respond..."
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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newAgentName, setNewAgentName] = useState("");
    const [newAgentPrompt, setNewAgentPrompt] = useState("");

    const {
        activeAgent,
        hasResponse,
        openAssistantId,
        updateAgent,
        removeAgent,
        addAgent,
        toggleAgentAccordion,
    } = useAssistantAgentManagement({
        agents,
        onUpdateAgents,
        selectedAgentId,
        responseText: responseText,
    });

    const canDelete = agents.length > 1;
    const canCreate = true;
    const activePromptPreview = toShortPromptPreview(
        activeAgent?.systemPrompt ?? "",
    );
    const canSubmitNewAgent =
        newAgentName.trim().length > 0 || newAgentPrompt.trim().length > 0;

    const handleToggleAgent = (agentId: string) => {
        toggleAgentAccordion(agentId);
    };

    const handleUpdateName = (agentId: string, name: string) => {
        updateAgent(agentId, (agent) => ({ ...agent, name }));
    };

    const handleUpdatePrompt = (agentId: string, systemPrompt: string) => {
        updateAgent(agentId, (agent) => ({ ...agent, systemPrompt }));
    };

    const handleDeleteAgent = (agentId: string) => {
        removeAgent(agentId);
    };

    const handleOpenCreateDialog = () => {
        setNewAgentName("");
        setNewAgentPrompt("");
        setIsCreateDialogOpen(true);
    };

    const handleCloseCreateDialog = () => {
        setIsCreateDialogOpen(false);
        setNewAgentName("");
        setNewAgentPrompt("");
    };

    const handleCreateAgent = () => {
        const created = addAgent(newAgentName, newAgentPrompt);

        if (!created) {
            return;
        }

        handleCloseCreateDialog();
    };

    return (
        <div className="grid gap-4">
            <section className="grid min-h-0 gap-4">
                <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                {activeAgent?.name || "Assistant"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {activePromptPreview}
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <span
                                className={`h-2 w-2 rounded-full ${isSending ? "bg-amber-400" : "bg-emerald-500"}`}
                            />
                            {isSending ? "Running" : "Ready"}
                        </div>
                    </div>

                    <form
                        className="mt-1 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSend();
                        }}
                    >
                        <label
                            htmlFor="assistant-agent-select"
                            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
                        >
                            Agent
                        </label>
                        <select
                            id="assistant-agent-select"
                            className={controlClass}
                            value={selectedAgentId ?? activeAgent?.id ?? ""}
                            onChange={(event) =>
                                onSelectAgent(event.target.value)
                            }
                        >
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name || "Untitled"}
                                </option>
                            ))}
                        </select>

                        <label
                            htmlFor="assistant-prompt-input"
                            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
                        >
                            Prompt
                        </label>
                        <textarea
                            id="assistant-prompt-input"
                            className={`${controlClass} min-h-36 resize-y leading-relaxed`}
                            value={promptText}
                            onChange={(event) =>
                                onPromptChange(event.target.value)
                            }
                            placeholder="Describe what you want this assistant to do..."
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSending || !promptText.trim()}
                            >
                                {isSending ? "Sending..." : "Send Prompt"}
                            </Button>
                            {errorDetails ? (
                                <Button
                                    variant="ghost"
                                    danger
                                    onClick={onClearErrorDetails}
                                >
                                    Dismiss Error
                                </Button>
                            ) : null}
                        </div>
                    </form>

                    {errorDetails ? (
                        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
                            {errorDetails}
                        </div>
                    ) : null}
                </Card>

                <Card className="min-h-55">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Latest Response
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {responseText.trim().length} chars
                        </span>
                    </div>

                    {hasResponse ? (
                        <pre className="custom-scrollbar m-0 min-h-35 max-h-[52vh] overflow-auto overscroll-contain rounded-xl border border-border/70 bg-background/65 p-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word">
                            {responseText}
                        </pre>
                    ) : (
                        <div className="grid min-h-35 place-content-center rounded-xl border border-dashed border-border/70 bg-background/45 p-4 text-center text-sm text-muted-foreground">
                            Send a prompt to see the assistant output here.
                        </div>
                    )}
                </Card>
            </section>

            <aside className="flex flex-col gap-4">
                <Card>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Agent Studio
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Create, edit, and delete assistant profiles.
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            disabled={!canCreate}
                            onClick={handleOpenCreateDialog}
                        >
                            New Agent
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

            {isCreateDialogOpen ? (
                <div className="fixed inset-0 z-50 grid place-content-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm">
                    <Button
                        variant="unstyled"
                        className="absolute inset-0 z-0"
                        aria-label="Close new agent dialog"
                        onClick={handleCloseCreateDialog}
                    />

                    <div className="relative z-10 flex w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-6 shadow-2xl backdrop-blur animate-[shell-enter_180ms_cubic-bezier(0.2,0.8,0.2,1)]">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            New Agent
                        </h2>

                        <form
                            className="flex flex-col gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleCreateAgent();
                            }}
                        >
                            <label
                                htmlFor="new-agent-name"
                                className="text-sm font-medium"
                            >
                                Name
                            </label>
                            <input
                                id="new-agent-name"
                                className={controlClass}
                                value={newAgentName}
                                placeholder="Untitled assistant"
                                onChange={(event) =>
                                    setNewAgentName(event.target.value)
                                }
                                autoFocus
                            />

                            <label
                                htmlFor="new-agent-system-prompt"
                                className="text-sm font-medium"
                            >
                                System Prompt
                            </label>
                            <textarea
                                id="new-agent-system-prompt"
                                className={`${controlClass} min-h-30 resize-y`}
                                value={newAgentPrompt}
                                placeholder="Define how this assistant should respond..."
                                onChange={(event) =>
                                    setNewAgentPrompt(event.target.value)
                                }
                            />

                            <div className="mt-1 flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={handleCloseCreateDialog}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={!canSubmitNewAgent}
                                >
                                    Create
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
