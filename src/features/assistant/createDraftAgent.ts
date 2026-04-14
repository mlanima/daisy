import type { Agent } from "../../shared/types/appState";

interface CreateDraftAgentParams {
    name?: string;
    systemPrompt?: string;
}

/** Creates a new editable assistant draft with a unique id. */
export function createDraftAgent(params?: CreateDraftAgentParams): Agent {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `agent-${Date.now()}`;

    return {
        id,
        name: params?.name ?? "",
        description: "",
        systemPrompt: params?.systemPrompt ?? "",
    };
}
