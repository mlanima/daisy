import { TextareaInput } from "../../../shared/components";

interface AgentSystemPromptInputProps {
    agentId: string;
    value: string;
    onChange: (value: string) => void;
}

/** Textarea for agent system prompt with label and placeholder. */
export function AgentSystemPromptInput({
    agentId,
    value,
    onChange,
}: Readonly<AgentSystemPromptInputProps>) {
    return (
        <TextareaInput
            id={`agent-prompt-${agentId}`}
            label="System Prompt"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Define how this assistant should respond..."
            className="min-h-30"
        />
    );
}
