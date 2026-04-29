import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "../../../shared/components";
import { AssistantLayout } from "../layouts";
import { ResponseDisplay, AgentInfo, StatusIndicator } from "../displays";
import { PromptForm, AgentSelector } from "../forms";
import { UsersRound } from "lucide-react";
import { CreateAgentDialog, AgentStudio } from "../dialogs";
import { useAccordionState } from "../accordion";
import { useAssistantAgentManagement } from "../useAssistantAgentManagement";
import type { AssistantPageProps } from "../types";

/**
 * Renders the main assistant management and interaction view.
 * Refactored to use smaller, reusable components.
 */
export function AssistantPage({
    agents,
    selectedAgentId,
    promptText,
    responseText,
    isSending,
    apiKeyPresent,
    errorDetails,
    onSelectAgent,
    onPromptChange,
    onSend,
    onUpdateAgents,
    onClearErrorDetails,
}: Readonly<AssistantPageProps>) {
    const assistantBoundaryRef = useRef<HTMLElement | null>(null);

    // UI state
    const { openId: openAgentId, toggle: toggleAgent } = useAccordionState();
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [studioPhase, setStudioPhase] = useState<
        "closed" | "opening" | "open" | "closing"
    >("closed");

    // Agent management hook
    const { activeAgent, updateAgent, removeAgent, addAgent } =
        useAssistantAgentManagement({
            agents,
            onUpdateAgents,
            selectedAgentId,
            responseText,
        });

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
            setIsStudioOpen(false);
            setStudioPhase("closed");
        }, 220);

        return () => {
            globalThis.clearTimeout(timeout);
        };
    }, [studioPhase]);

    // Studio animation handlers
    const openStudio = useCallback(() => {
        setIsStudioOpen(true);
        setStudioPhase((current) =>
            current === "closed" ? "opening" : current,
        );
    }, []);

    const closeStudio = useCallback(() => {
        setStudioPhase((current) => {
            if (current === "closed" || current === "closing") return current;
            return "closing";
        });
    }, []);

    // Agent handlers
    const handleToggleAgent = useCallback(
        (agentId: string) => {
            toggleAgent(agentId);
        },
        [toggleAgent],
    );

    const handleUpdateName = useCallback(
        (agentId: string, name: string) => {
            updateAgent(agentId, (agent) => ({ ...agent, name }));
        },
        [updateAgent],
    );

    const handleUpdatePrompt = useCallback(
        (agentId: string, systemPrompt: string) => {
            updateAgent(agentId, (agent) => ({ ...agent, systemPrompt }));
        },
        [updateAgent],
    );

    const handleDeleteAgent = useCallback(
        (agentId: string) => {
            removeAgent(agentId);
        },
        [removeAgent],
    );

    const handleCreateAgent = useCallback(
        (name: string, systemPrompt: string) => {
            const created = addAgent(name, systemPrompt);
            if (created) {
                setIsCreateOpen(false);
            }
        },
        [addAgent],
    );

    return (
        <AssistantLayout>
            <Card className="gap-4 p-4">
                {/* Header: Agent Info + Status + Buttons */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <AgentInfo agent={activeAgent} />
                    <StatusIndicator
                        isSending={isSending}
                        apiKeyPresent={apiKeyPresent}
                    />
                </div>

                {/* Agent Selector + Controls */}
                <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-background/45 p-2.5">
                    <AgentSelector
                        agents={agents}
                        selectedAgentId={selectedAgentId}
                        onSelectAgent={onSelectAgent}
                        boundaryRef={assistantBoundaryRef}
                    />

                    <div className="ml-auto inline-flex items-center gap-2">
                        <Button
                            variant="ghost"
                            className="h-11 rounded-lg border border-primary! px-4"
                            onClick={openStudio}
                        >
                            <UsersRound className="mr-2 h-4 w-4" />
                            Manage Agents
                        </Button>
                    </div>
                </div>

                {/* Prompt Form */}
                <PromptForm
                    promptText={promptText}
                    onPromptChange={onPromptChange}
                    onSend={onSend}
                    isSending={isSending}
                    apiKeyPresent={apiKeyPresent}
                    errorDetails={errorDetails}
                    onClearError={onClearErrorDetails}
                />
            </Card>

            {/* Response Display */}
            <ResponseDisplay content={responseText} isLoading={isSending} />

            {/* Agent Studio Panel */}
            {isStudioVisible && (
                <AgentStudio
                    isOpen={isStudioOpen}
                    isExpanded={isStudioExpanded}
                    agents={agents}
                    openAgentId={openAgentId}
                    onClose={closeStudio}
                    onToggleAgent={handleToggleAgent}
                    onUpdateName={handleUpdateName}
                    onUpdatePrompt={handleUpdatePrompt}
                    onDeleteAgent={handleDeleteAgent}
                    onCreateAgent={() => setIsCreateOpen(true)}
                />
            )}

            {/* Create Agent Dialog */}
            <CreateAgentDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreate={handleCreateAgent}
            />
        </AssistantLayout>
    );
}
