import { TextInput } from "../../../shared/components";

interface AgentNameInputProps {
    agentId: string;
    value: string;
    onChange: (value: string) => void;
}

/** Input field for agent name with label and placeholder. */
export function AgentNameInput({
    agentId,
    value,
    onChange,
}: Readonly<AgentNameInputProps>) {
    return (
        <TextInput
            id={`agent-name-${agentId}`}
            label="Name"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Untitled assistant"
        />
    );
}
