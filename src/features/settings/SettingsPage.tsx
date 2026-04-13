import { useFormStatus } from "react-dom";
import { Button, Card, SwitchField } from "../../shared/components";
import { WINDOW_SIZE_LABELS } from "./windowSizeLabels";
import { useSettingsApiKey } from "./useSettingsApiKey";
import type { SettingsPageProps } from "./types";

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
        <section className="settings-page">
            <header className="settings-header">
                <h2>Settings</h2>
                <Button variant="ghost" onClick={onBack}>
                    Back to Assistant
                </Button>
            </header>

            <div className="settings-grid">
                <Card className="settings-card">
                    <h3>AI Settings</h3>
                    <p
                        style={{
                            fontSize: "0.9rem",
                            color: "var(--text-soft)",
                        }}
                    >
                        API Key:{" "}
                        <strong>
                            {keyPreview === "<loading>"
                                ? "Loading..."
                                : keyPreview}
                        </strong>
                    </p>

                    <div className="inline-row">
                        <Button variant="primary" onClick={openKeyModal}>
                            Set Secret Key
                        </Button>
                        {keyPreview !== "<not found>" &&
                            keyPreview !== "<loading>" && (
                                <Button
                                    variant="ghost"
                                    danger
                                    disabled={isSavingKey}
                                    onClick={clearKey}
                                >
                                    Clear Key
                                </Button>
                            )}
                    </div>

                    <div
                        style={{
                            marginTop: "1.5rem",
                            paddingTop: "1.5rem",
                            borderTop: "1px solid var(--border-color)",
                        }}
                    >
                        <Button
                            variant="ghost"
                            onClick={toggleAdvanced}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <span>{showAdvanced ? "▼" : "▶"}</span>
                            <span>Advanced Settings</span>
                        </Button>

                        {showAdvanced && (
                            <div style={{ marginLeft: "1rem" }}>
                                <label htmlFor="global-model">Model</label>
                                <input
                                    id="global-model"
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

                                <div className="settings-grid compact">
                                    <div>
                                        <label htmlFor="global-temp">
                                            Temperature
                                        </label>
                                        <input
                                            id="global-temp"
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
                                        <label htmlFor="global-max-tokens">
                                            Max tokens
                                        </label>
                                        <input
                                            id="global-max-tokens"
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={
                                                settings.model.maxTokens ?? ""
                                            }
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
                        )}
                    </div>
                </Card>

                <Card className="settings-card">
                    <h3>Behavior</h3>

                    <label className="stack-row" htmlFor="toggle-window-size">
                        <span>UI text size</span>
                        <select
                            id="toggle-window-size"
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

            {showKeyModal && (
                <div className="modal-overlay">
                    <Button
                        variant="unstyled"
                        className="modal-backdrop"
                        aria-label="Close API key dialog"
                        onClick={closeKeyModal}
                    />
                    <div className="modal-content">
                        <h2>Set Secret Key</h2>

                        <form action={saveKeyAction}>
                            <label htmlFor="modal-api-key">API Key</label>
                            <input
                                id="modal-api-key"
                                name="apiKey"
                                type="password"
                                value={apiKeyDraft}
                                onChange={(event) =>
                                    setApiKeyDraft(event.target.value)
                                }
                                placeholder="sk-..."
                                autoFocus
                            />

                            <label htmlFor="modal-api-endpoint">
                                API Endpoint
                            </label>
                            <input
                                id="modal-api-endpoint"
                                type="url"
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
                                    style={{ color: "var(--danger)" }}
                                >
                                    {saveError}
                                </p>
                            ) : null}

                            <div className="modal-actions">
                                <Button
                                    type="button"
                                    variant="ghost"
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
            )}
        </section>
    );
}
