import type { Agent, AppStateSnapshot } from "../../shared/types/appState";

export function resolveSelectedAgent(
    snapshot: AppStateSnapshot | null,
): Agent | null {
    if (!snapshot || snapshot.agents.length === 0) {
        return null;
    }

    return (
        snapshot.agents.find(
            (agent) => agent.id === snapshot.selectedAgentId,
        ) ?? snapshot.agents[0]
    );
}

export function updateRecentAgentIds(
    currentRecentAgentIds: string[],
    agentId: string,
): string[] {
    return [
        agentId,
        ...currentRecentAgentIds.filter((id) => id !== agentId),
    ].slice(0, 2);
}

export function resolveQuickAgentRows(
    agents: Agent[],
    selectedAgentId: string | null,
    recentAgentIds: string[],
): { visibleAgents: Agent[]; hiddenAgents: Agent[] } {
    const orderedRecent = recentAgentIds
        .map((id) => agents.find((agent) => agent.id === id) ?? null)
        .filter((agent): agent is Agent => Boolean(agent));
    const selectedAgent =
        agents.find((agent) => agent.id === selectedAgentId) ?? null;

    if (
        selectedAgent &&
        !orderedRecent.some((agent) => agent.id === selectedAgent.id)
    ) {
        orderedRecent.unshift(selectedAgent);
    }

    if (orderedRecent.length === 0 && agents.length > 0) {
        orderedRecent.push(agents[0]);
    }

    const visibleAgents = orderedRecent.slice(0, 2);
    const visibleIds = new Set(visibleAgents.map((agent) => agent.id));
    const hiddenAgents = agents.filter((agent) => !visibleIds.has(agent.id));

    return { visibleAgents, hiddenAgents };
}
