import { useCallback, useState } from "react";
import { Button, Modal } from "../../../shared/components";
import { AgentNameInput } from "../forms/AgentNameInput";
import { AgentSystemPromptInput } from "../forms/AgentSystemPromptInput";

interface CreateAgentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, systemPrompt: string) => void;
    isPending?: boolean;
}

/** Modal dialog for creating a new agent. */
export function CreateAgentDialog({
    isOpen,
    onClose,
    onCreate,
    isPending = false,
}: Readonly<CreateAgentDialogProps>) {
    const [name, setName] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");

    const canSubmit =
        name.trim().length > 0 || systemPrompt.trim().length > 0;

    const handleSubmit = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            if (canSubmit) {
                onCreate(name, systemPrompt);
                setName("");
                setSystemPrompt("");
            }
        },
        [name, systemPrompt, canSubmit, onCreate],
    );

    const handleClose = useCallback(() => {
        setName("");
        setSystemPrompt("");
        onClose();
    }, [onClose]);

    return (
        <Modal
            isOpen={isOpen}
            title="New Agent"
            onClose={handleClose}
            isPending={isPending}
            size="md"
        >
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <AgentNameInput
                    agentId="new"
                    value={name}
                    onChange={setName}
                />

                <AgentSystemPromptInput
                    agentId="new"
                    value={systemPrompt}
                    onChange={setSystemPrompt}
                />

                <div className="mt-1 flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={!canSubmit || isPending}
                    >
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
