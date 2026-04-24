import { useCallback } from "react";
import { Button, TextareaInput } from "../../../shared/components";

interface PromptFormProps {
    promptText: string;
    onPromptChange: (text: string) => void;
    onSend: () => void;
    isSending?: boolean;
    errorDetails?: string;
    onClearError?: () => void;
}

/** Form for entering and submitting prompts. */
export function PromptForm({
    promptText,
    onPromptChange,
    onSend,
    isSending = false,
    errorDetails,
    onClearError,
}: Readonly<PromptFormProps>) {
    const handleSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onSend();
        },
        [onSend],
    );

    return (
        <form className="grid gap-3" onSubmit={handleSubmit}>
            <TextareaInput
                label="Prompt"
                value={promptText}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Describe what you want this assistant to do..."
                className="min-h-28 max-h-64 rounded-2xl border-border/75 bg-background/75 leading-relaxed"
            />

            <Button
                type="submit"
                variant="primary"
                disabled={isSending || !promptText.trim()}
            >
                {isSending ? "Sending..." : "Send Prompt"}
            </Button>

            {errorDetails && (
                <div className="flex flex-wrap items-center gap-2">
                    <div className="grow rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
                        {errorDetails}
                    </div>
                    <Button variant="ghost" danger onClick={onClearError}>
                        Dismiss
                    </Button>
                </div>
            )}
        </form>
    );
}
