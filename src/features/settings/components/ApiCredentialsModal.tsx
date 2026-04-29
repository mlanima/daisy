import { useFormStatus } from "react-dom";
import { Button, Modal } from "../../../shared/components";
import type { AppSettings } from "../../../shared/types/appState";
import { controlClass } from "./settingsFormClasses";

interface SaveKeyButtonProps {
    canSubmit: boolean;
}

interface ApiCredentialsModalProps {
    isOpen: boolean;
    apiKeyDraft: string;
    isSavingKey: boolean;
    saveError: string | null;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    onClose: () => void;
    onApiKeyDraftChange: (value: string) => void;
    saveKeyAction: (formData: FormData) => void;
}

/** Submit button that reflects pending state from the nearest parent form. */
function SaveKeyButton({ canSubmit }: Readonly<SaveKeyButtonProps>) {
    const { pending } = useFormStatus();

    return (
        <Button
            variant="primary"
            type="submit"
            disabled={pending || !canSubmit}
        >
            {pending ? "Saving..." : "Save"}
        </Button>
    );
}

/** Modal for entering the API key and endpoint. */
export function ApiCredentialsModal({
    isOpen,
    apiKeyDraft,
    isSavingKey,
    saveError,
    settings,
    onUpdateSettings,
    onClose,
    onApiKeyDraftChange,
    saveKeyAction,
}: Readonly<ApiCredentialsModalProps>) {
    return (
        <Modal
            isOpen={isOpen}
            title="Set Secret Key"
            description="Add your API key and endpoint to enable requests."
            onClose={onClose}
            isPending={isSavingKey}
            size="md"
        >
            <form action={saveKeyAction} className="flex flex-col gap-3">
                <label htmlFor="modal-api-key" className="text-sm font-medium">
                    API Key
                </label>
                <input
                    id="modal-api-key"
                    name="apiKey"
                    type="password"
                    className={controlClass}
                    value={apiKeyDraft}
                    onChange={(event) =>
                        onApiKeyDraftChange(event.target.value)
                    }
                    placeholder="sk-..."
                    autoFocus
                />

                <label
                    htmlFor="modal-api-endpoint"
                    className="text-sm font-medium"
                >
                    API Endpoint
                </label>
                <input
                    id="modal-api-endpoint"
                    type="url"
                    className={controlClass}
                    value={settings.apiBaseUrl}
                    onChange={(event) =>
                        onUpdateSettings({
                            ...settings,
                            apiBaseUrl: event.target.value,
                        })
                    }
                    placeholder="https://api.openai.com/v1/chat/completions"
                />

                {saveError ? (
                    <p
                        role="alert"
                        className="text-sm text-rose-600 dark:text-rose-300"
                    >
                        {saveError}
                    </p>
                ) : null}

                <div className="mt-1 flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isSavingKey}
                    >
                        Cancel
                    </Button>
                    <SaveKeyButton canSubmit={Boolean(apiKeyDraft.trim())} />
                </div>
            </form>
        </Modal>
    );
}
