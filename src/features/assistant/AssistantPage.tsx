import type { Agent } from "../../shared/types/appState";
import { useEffect, useRef, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button, Card } from "../../shared/components";
import type { AssistantPageProps } from "./types";
import { useAssistantAgentManagement } from "./useAssistantAgentManagement";
import { AgentDropdownTrigger } from "./components/AgentDropdownTrigger";
import { AgentDropdownMenu } from "./components/AgentDropdownMenu";

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
    const agentDropdownAnchorRef = useRef<HTMLDivElement | null>(null);
    const assistantBoundaryRef = useRef<HTMLElement | null>(null);
    const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [studioPhase, setStudioPhase] = useState<
        "closed" | "opening" | "open" | "closing"
    >("closed");
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
    const isStudioVisible = studioPhase !== "closed";
    const isStudioExpanded = studioPhase === "open";

    useEffect(() => {
        if (studioPhase !== "opening") {
            return;
        }

        const frame = globalThis.requestAnimationFrame(() => {
            setStudioPhase("open");
        });

        return () => {
            globalThis.cancelAnimationFrame(frame);
        };
    }, [studioPhase]);

    useEffect(() => {
        if (studioPhase !== "closing") {
            return;
        }

        const timeout = globalThis.setTimeout(() => {
            setStudioPhase("closed");
        }, 220);

        return () => {
            globalThis.clearTimeout(timeout);
        };
    }, [studioPhase]);

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

    const openStudio = () => {
        setStudioPhase((current) => {
            if (current === "closed") {
                return "opening";
            }

            return current;
        });
    };

    const closeStudio = () => {
        setStudioPhase((current) => {
            if (current === "closed" || current === "closing") {
                return current;
            }

            return "closing";
        });
    };

    const handleSelectAgent = (agentId: string) => {
        onSelectAgent(agentId);
        setIsAgentDropdownOpen(false);
    };

    return (
        <div className="grid h-full min-h-0 gap-3">
            <section
                ref={assistantBoundaryRef}
                className="grid min-h-0 gap-3 lg:grid-rows-[auto_minmax(0,1fr)]"
            >
                <Card className="gap-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-semibold tracking-tight">
                                {activeAgent?.name || "Assistant"}
                            </h2>
                            <p className="truncate text-sm text-muted-foreground">
                                {activePromptPreview}
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                            <span
                                className={`h-2 w-2 rounded-full ${isSending ? "bg-amber-400" : "bg-emerald-500"}`}
                            />
                            {isSending ? "Running" : "Ready"}
                        </div>
                    </div>

                    <form
                        className="grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSend();
                        }}
                    >
                        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-background/45 p-2.5">
                            <div className="grid w-fit gap-1.5">
                                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                    Agent
                                </p>
                                <div ref={agentDropdownAnchorRef} className="w-fit">
                                    <AgentDropdownTrigger
                                        label={
                                            activeAgent?.name?.trim() ||
                                            "Select agent"
                                        }
                                        isOpen={isAgentDropdownOpen}
                                        onToggle={() =>
                                            setIsAgentDropdownOpen((open) =>
                                                !open,
                                            )
                                        }
                                        ariaLabel="Choose agent"
                                        className="h-11 min-w-44 max-w-[30ch] bg-background px-3"
                                    />
                                    <AgentDropdownMenu
                                        agents={agents}
                                        anchorRef={agentDropdownAnchorRef}
                                        boundaryRef={assistantBoundaryRef}
                                        selectedAgentId={
                                            selectedAgentId ?? activeAgent?.id
                                        }
                                        isOpen={isAgentDropdownOpen}
                                        onSelectAgent={handleSelectAgent}
                                    />
                                </div>
                            </div>

                            <div className="ml-auto inline-flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    className="h-11 rounded-lg px-4"
                                    onClick={openStudio}
                                >
                                    Manage Agents
                                </Button>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={isSending || !promptText.trim()}
                                    className="h-11 rounded-lg px-5"
                                >
                                    {isSending ? "Sending..." : "Send Prompt"}
                                </Button>
                            </div>
                        </div>

                        <label
                            htmlFor="assistant-prompt-input"
                            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
                        >
                            Prompt
                        </label>
                        <textarea
                            id="assistant-prompt-input"
                            className={`${controlClass} min-h-28 max-h-64 resize-y rounded-2xl border-border/75 bg-background/75 leading-relaxed`}
                            value={promptText}
                            onChange={(event) =>
                                onPromptChange(event.target.value)
                            }
                            placeholder="Describe what you want this assistant to do..."
                        />
                    </form>

                    {errorDetails ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="grow rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
                                {errorDetails}
                            </div>
                            <Button
                                variant="ghost"
                                danger
                                onClick={onClearErrorDetails}
                            >
                                Dismiss Error
                            </Button>
                        </div>
                    ) : null}
                </Card>

                <Card className="min-h-0 flex-1 gap-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Latest Response
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {responseText.trim().length} chars
                        </span>
                    </div>

                    {hasResponse ? (
                        <pre className="custom-scrollbar m-0 h-full min-h-0 overflow-auto overscroll-contain rounded-xl border border-border/70 bg-background/65 p-3.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word">
                            {responseText}
                        </pre>
                    ) : (
                        <div className="grid h-full min-h-0 place-content-center rounded-xl border border-dashed border-border/70 bg-background/45 p-4 text-center text-sm text-muted-foreground">
                            Send a prompt to see the assistant output here.
                        </div>
                    )}
                </Card>
            </section>

            {isStudioVisible ? (
                <div
                    className={`fixed inset-x-0 bottom-0 top-10 z-40 flex justify-end overflow-hidden transition-opacity duration-200 ${
                        isStudioExpanded ? "bg-black/35 opacity-100" : "bg-black/0 opacity-0"
                    } backdrop-blur-sm`}
                >
                    <Button
                        variant="unstyled"
                        className="absolute inset-0"
                        aria-label="Close agent studio"
                        onClick={closeStudio}
                    />

                    <aside
                        className={`custom-scrollbar relative z-10 flex h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto border-l border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out ${
                            isStudioExpanded ? "translate-x-0" : "translate-x-full"
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
                                onClick={closeStudio}
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
                                disabled={!canCreate}
                                onClick={handleOpenCreateDialog}
                            >
                                New Agent
                            </Button>
                        </div>

                        <ul className="flex min-h-0 flex-col gap-2">
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
                    </aside>
                </div>
            ) : null}

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
