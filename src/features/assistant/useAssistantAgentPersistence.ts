import { useCallback, type RefObject } from "react";
import type { Agent, AppStateSnapshot } from "../../shared/types/appState";
import { updateRecentAgentIds } from "./agentUtils";

interface UseAssistantAgentPersistenceParams {
    snapshotRef: RefObject<AppStateSnapshot | null>;
    promptText: string;
    sourceText: string;
    setPromptText: (value: string) => void;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<void>;
}

/**
 * Persists agent selection and list updates back into the workspace snapshot.
 */
export function useAssistantAgentPersistence({
    snapshotRef,
    promptText,
    sourceText,
    setPromptText,
    persistSnapshot,
}: UseAssistantAgentPersistenceParams) {
    /** Selects an agent and persists recent-agent history updates. */
    const onSelectAgent = useCallback(
        (agentId: string) => {
            const activeSnapshot = snapshotRef.current;

            if (!activeSnapshot) {
                return;
            }

            const nextSnapshot: AppStateSnapshot = {
                ...activeSnapshot,
                selectedAgentId: agentId,
                settings: {
                    ...activeSnapshot.settings,
                    recentAgentIds: updateRecentAgentIds(
                        activeSnapshot.settings.recentAgentIds,
                        agentId,
                    ),
                },
            };

            const nextAgent = nextSnapshot.agents.find(
                (agent: Agent) => agent.id === agentId,
            );

            if (nextAgent && !promptText.trim()) {
                setPromptText(sourceText);
            }

            void persistSnapshot(nextSnapshot);
        },
        [persistSnapshot, promptText, setPromptText, snapshotRef, sourceText],
    );

    /** Persists full agent list updates while sanitizing recent ids. */
    const onUpdateAgents = useCallback(
        (agents: Agent[], selectedAgentId: string | null) => {
            const activeSnapshot = snapshotRef.current;

            if (!activeSnapshot) {
                return;
            }

            const fallbackSelectedId = selectedAgentId ?? agents[0]?.id ?? null;
            const validAgentIds = new Set(agents.map((agent) => agent.id));
            const sanitizedRecentAgentIds =
                activeSnapshot.settings.recentAgentIds
                    .filter((id) => validAgentIds.has(id))
                    .slice(0, 2);

            void persistSnapshot({
                ...activeSnapshot,
                agents,
                selectedAgentId: fallbackSelectedId,
                settings: {
                    ...activeSnapshot.settings,
                    recentAgentIds: sanitizedRecentAgentIds,
                },
            });
        },
        [persistSnapshot, snapshotRef],
    );

    return {
        onSelectAgent,
        onUpdateAgents,
    };
}
