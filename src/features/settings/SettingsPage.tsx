import { useFormStatus } from "react-dom";
import { Button, Card, SwitchField } from "../../shared/components";
import { WINDOW_SIZE_LABELS } from "./windowSizeLabels";
import { useSettingsApiKey } from "./useSettingsApiKey";
import type { SettingsPageProps } from "./types";

const controlClass =
    "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface SaveKeyButtonProps {
    canSubmit: boolean;
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

/**
 * Renders user-facing settings for model behavior, display preferences,
 * and secure API key management.
 */
export function SettingsPage({
    settings,
    apiKeyPresent,
    onBack,
    onUpdateSettings,
    onSaveApiKey,
    onClearApiKey,
}: Readonly<SettingsPageProps>) {
    const {
        apiKeyDraft,
        setApiKeyDraft,
        isSavingKey,
        keyPreview,
        showKeyModal,
        showAdvanced,
        saveError,
        openKeyModal,
        closeKeyModal,
        toggleAdvanced,
        saveKeyAction,
        clearKey,
    } = useSettingsApiKey({
        apiKeyPresent,
        onSaveApiKey,
        onClearApiKey,
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                        Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Configure model behavior, appearance, and credentials.
                    </p>
                </div>

                <Button variant="ghost" onClick={onBack}>
                    Back to Assistant
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-base font-semibold">
                            API Credentials
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Your key is stored securely and used for requests.
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-lg border bg-background p-3">
                        <span className="font-mono text-sm text-muted-foreground">
                            {keyPreview === "<loading>"
                                ? "Loading..."
                                : keyPreview}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="primary" onClick={openKeyModal}>
                                Set Secret Key
                            </Button>
                            {keyPreview !== "<not found>" &&
                            keyPreview !== "<loading>" ? (
                                <Button
                                    variant="ghost"
                                    danger
                                    disabled={isSavingKey}
                                    onClick={clearKey}
                                >
                                    Clear Key
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <details
                        className="group rounded-lg border bg-background"
                        open={showAdvanced}
                    >
                        <summary
                            className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [::-webkit-details-marker]:hidden"
                            onClick={(event) => {
                                event.preventDefault();
                                toggleAdvanced();
                            }}
                        >
                            <span className="text-sm font-medium">
                                Advanced Model Settings
                            </span>
                            <span className="text-xs text-muted-foreground transition group-open:rotate-90">
                                ▸
                            </span>
                        </summary>

                        <div className="grid gap-3 border-t p-3">
                            <label
                                htmlFor="global-model"
                                className="text-xs font-medium text-muted-foreground"
                            >
                                Model
                            </label>
                            <input
                                id="global-model"
                                className={controlClass}
                                value={settings.model.model}
                                onChange={(event) =>
                                    onUpdateSettings({
                                        ...settings,
                                        model: {
                                            ...settings.model,
                                            model: event.target.value,
                                        },
                                    })
                                }
                                placeholder="gpt-4o-mini"
                            />

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="global-temp"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Temperature
                                    </label>
                                    <input
                                        id="global-temp"
                                        className={`${controlClass} mt-1`}
                                        type="number"
                                        min={0}
                                        max={2}
                                        step={0.1}
                                        value={settings.model.temperature}
                                        onChange={(event) =>
                                            onUpdateSettings({
                                                ...settings,
                                                model: {
                                                    ...settings.model,
                                                    temperature: Number(
                                                        event.target.value,
                                                    ),
                                                },
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="global-max-tokens"
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        Max Tokens
                                    </label>
                                    <input
                                        id="global-max-tokens"
                                        className={`${controlClass} mt-1`}
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={settings.model.maxTokens ?? ""}
                                        onChange={(event) =>
                                            onUpdateSettings({
                                                ...settings,
                                                model: {
                                                    ...settings.model,
                                                    maxTokens: event.target
                                                        .value
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : null,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </details>
                </Card>

                <Card className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-base font-semibold">
                            Behavior & Appearance
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Adjust interaction flow and text scaling.
                        </p>
                    </div>

                    <label
                        className="flex flex-col gap-1.5"
                        htmlFor="toggle-window-size"
                    >
                        <span className="text-xs font-medium text-muted-foreground">
                            UI Text Size
                        </span>
                        <select
                            id="toggle-window-size"
                            className={controlClass}
                            value={settings.windowSize}
                            onChange={(event) =>
                                onUpdateSettings({
                                    ...settings,
                                    windowSize: event.target
                                        .value as keyof typeof WINDOW_SIZE_LABELS,
                                })
                            }
                        >
                            {Object.entries(WINDOW_SIZE_LABELS).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>

                    <SwitchField
                        id="toggle-auto-send"
                        label="Auto-send captured prompts"
                        checked={settings.autoSendPrompt}
                        onChange={(checked) =>
                            onUpdateSettings({
                                ...settings,
                                autoSendPrompt: checked,
                            })
                        }
                    />

                    <SwitchField
                        id="toggle-dark-mode"
                        label="Dark mode"
                        checked={settings.darkMode}
                        onChange={(checked) =>
                            onUpdateSettings({
                                ...settings,
                                darkMode: checked,
                            })
                        }
                    />
                </Card>
            </div>

            {showKeyModal ? (
                <div className="fixed inset-0 z-50 grid place-content-center bg-black/60 p-3 backdrop-blur-sm">
                    <Button
                        variant="unstyled"
                        className="absolute inset-0 z-0"
                        aria-label="Close API key dialog"
                        onClick={closeKeyModal}
                    />

                    <div className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-2xl border bg-card p-6 shadow-2xl animate-[shell-enter_180ms_cubic-bezier(0.2,0.8,0.2,1)]">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Set Secret Key
                        </h2>

                        <form
                            action={saveKeyAction}
                            className="flex flex-col gap-3"
                        >
                            <label
                                htmlFor="modal-api-key"
                                className="text-sm font-medium"
                            >
                                API Key
                            </label>
                            <input
                                id="modal-api-key"
                                name="apiKey"
                                type="password"
                                className={controlClass}
                                value={apiKeyDraft}
                                onChange={(event) =>
                                    setApiKeyDraft(event.target.value)
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
                                    onClick={closeKeyModal}
                                    disabled={isSavingKey}
                                >
                                    Cancel
                                </Button>
                                <SaveKeyButton
                                    canSubmit={Boolean(apiKeyDraft.trim())}
                                />
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
