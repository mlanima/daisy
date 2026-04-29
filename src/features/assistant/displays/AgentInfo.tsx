import type { Agent } from "../../../shared/types/appState";

interface AgentInfoProps {
    agent: Agent | null;
}

function toShortPromptPreview(systemPrompt: string): string {
    const condensed = systemPrompt.replace(/\s+/g, " ").trim();

    if (!condensed) {
        return "No system prompt yet.";
    }

    return condensed.length > 72 ? `${condensed.slice(0, 72)}...` : condensed;
}

/** Display current agent name and system prompt preview. */
export function AgentInfo({ agent }: Readonly<AgentInfoProps>) {
    const displayName = agent?.name.trim() || "No Agent";
    const promptPreview = toShortPromptPreview(agent?.systemPrompt ?? "");

    return (
        <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">
                {displayName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
                {promptPreview}
            </p>
        </div>
    );
}
