import type { Agent } from "../../shared/types/appState";

/** Creates a new editable assistant draft with a unique id. */
export function createDraftAgent(): Agent {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `agent-${Date.now()}`;

    return {
        id,
        name: "New Agent",
        description: "Custom assistant workflow",
        systemPrompt:
            "You are a helpful assistant. Respond clearly and directly.",
    };
}
