import { useCallback, useEffect, useMemo, useState } from "react";
import type { Agent } from "../../shared/types/appState";
import { createDraftAgent } from "./createDraftAgent";

interface UseAssistantAgentManagementParams {
    agents: Agent[];
    selectedAgentId: string | null;
    responseText: string;
    onUpdateAgents: (agents: Agent[], selectedAgentId: string | null) => void;
}

export function useAssistantAgentManagement({
    agents,
    selectedAgentId,
    responseText,
    onUpdateAgents,
}: UseAssistantAgentManagementParams) {
    const [isAssistantsOpen, setIsAssistantsOpen] = useState(true);
    const [openAssistantId, setOpenAssistantId] = useState<string | null>(null);

    const activeAgent = useMemo(
        () =>
            agents.find((agent) => agent.id === selectedAgentId) ??
            agents[0] ??
            null,
        [agents, selectedAgentId],
    );

    const hasResponse = responseText.trim().length > 0;

    const updateAgent = useCallback(
        (agentId: string, updater: (agent: Agent) => Agent) => {
            const nextAgents = agents.map((agent) =>
                agent.id === agentId ? updater(agent) : agent,
            );

            onUpdateAgents(nextAgents, selectedAgentId);
        },
        [agents, onUpdateAgents, selectedAgentId],
    );

    const removeAgent = useCallback(
        (agentId: string) => {
            if (agents.length <= 1) {
                return;
            }

            const nextAgents = agents.filter((agent) => agent.id !== agentId);
            const nextSelectedId =
                selectedAgentId === agentId
                    ? (nextAgents[0]?.id ?? null)
                    : selectedAgentId;

            onUpdateAgents(nextAgents, nextSelectedId);
        },
        [agents, onUpdateAgents, selectedAgentId],
    );

    const addAgent = useCallback(() => {
        const newAgent = createDraftAgent();
        onUpdateAgents([...agents, newAgent], selectedAgentId ?? newAgent.id);
        setOpenAssistantId(newAgent.id);
    }, [agents, onUpdateAgents, selectedAgentId]);

    const toggleAssistantsPanel = useCallback((nextOpen: boolean) => {
        setIsAssistantsOpen(nextOpen);

        if (!nextOpen) {
            setOpenAssistantId(null);
        }
    }, []);

    const toggleAgentAccordion = useCallback((agentId: string) => {
        setOpenAssistantId((currentOpenId) =>
            currentOpenId === agentId ? null : agentId,
        );
    }, []);

    useEffect(() => {
        if (
            openAssistantId &&
            !agents.some((agent) => agent.id === openAssistantId)
        ) {
            setOpenAssistantId(null);
        }
    }, [agents, openAssistantId]);

    return {
        activeAgent,
        hasResponse,
        isAssistantsOpen,
        openAssistantId,
        updateAgent,
        removeAgent,
        addAgent,
        toggleAssistantsPanel,
        toggleAgentAccordion,
    };
}
