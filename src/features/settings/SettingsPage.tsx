import { useEffect, useState } from "react";
import type { AppSettings, WindowSize } from "../../domain/types";
import { getApiKeyPreview } from "../../infrastructure/tauriClient";

const WINDOW_SIZE_LABELS: Record<WindowSize, string> = {
    small: "Small",
    medium: "Medium",
    big: "Big",
};

interface SettingsPageProps {
    readonly settings: AppSettings;
    readonly apiKeyPresent: boolean;
    readonly onBack: () => void;
    readonly onUpdateSettings: (settings: AppSettings) => void;
    readonly onSaveApiKey: (apiKey: string) => Promise<void>;
    readonly onClearApiKey: () => Promise<void>;
}

export function SettingsPage({
    settings,
    apiKeyPresent,
    onBack,
    onUpdateSettings,
    onSaveApiKey,
    onClearApiKey,
}: SettingsPageProps) {
    const [apiKeyDraft, setApiKeyDraft] = useState("");
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState("<loading>");
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const preview = await getApiKeyPreview();
                setKeyPreview(preview);
            } catch (error) {
                console.error("Failed to fetch key preview:", error);
                setKeyPreview("<error checking>");
            }
        };

        void fetchPreview();
    }, [apiKeyPresent]);

    const saveKey = async () => {
        if (!apiKeyDraft.trim()) {
            return;
        }

        setIsSavingKey(true);
        try {
            await onSaveApiKey(apiKeyDraft.trim());
            setApiKeyDraft("");
            setShowKeyModal(false);
            // Refetch preview after save
            const preview = await getApiKeyPreview();
            setKeyPreview(preview);
        } catch (error) {
            console.error("Failed to save API key:", error);
        } finally {
            setIsSavingKey(false);
        }
    };

    const clearKey = async () => {
        setIsSavingKey(true);
        try {
            await onClearApiKey();
            setKeyPreview("<not found>");
        } catch (error) {
            console.error("Failed to clear API key:", error);
        } finally {
            setIsSavingKey(false);
        }
    };

    return (
        <section className="settings-page">
            <header className="settings-header">
                <h2>Settings</h2>
                <button type="button" className="ghost" onClick={onBack}>
                    Back to Assistant
                </button>
            </header>

            <div className="settings-grid">
                {/* AI Settings Card - Simple with modal for secrets */}
                <section className="card settings-card">
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
                        <button
                            type="button"
                            className="primary"
                            onClick={() => setShowKeyModal(true)}
                        >
                            Set Secret Key
                        </button>
                        {keyPreview !== "<not found>" &&
                            keyPreview !== "<loading>" && (
                                <button
                                    type="button"
                                    className="ghost danger"
                                    disabled={isSavingKey}
                                    onClick={clearKey}
                                >
                                    Clear Key
                                </button>
                            )}
                    </div>

                    {/* Advanced Settings Collapsible Section */}
                    <div
                        style={{
                            marginTop: "1.5rem",
                            paddingTop: "1.5rem",
                            borderTop: "1px solid var(--border-color)",
                        }}
                    >
                        <button
                            type="button"
                            className="ghost"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <span>{showAdvanced ? "▼" : "▶"}</span>
                            <span>Advanced Settings</span>
                        </button>

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
                </section>

                <section className="card settings-card">
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
                                        .value as WindowSize,
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

                    <label className="switch-row" htmlFor="toggle-auto-send">
                        <span>Auto-send captured prompts</span>
                        <input
                            id="toggle-auto-send"
                            type="checkbox"
                            checked={settings.autoSendPrompt}
                            onChange={(event) =>
                                onUpdateSettings({
                                    ...settings,
                                    autoSendPrompt: event.target.checked,
                                })
                            }
                        />
                    </label>

                    <label className="switch-row" htmlFor="toggle-dark-mode">
                        <span>Dark mode</span>
                        <input
                            id="toggle-dark-mode"
                            type="checkbox"
                            checked={settings.darkMode}
                            onChange={(event) =>
                                onUpdateSettings({
                                    ...settings,
                                    darkMode: event.target.checked,
                                })
                            }
                        />
                    </label>
                </section>
            </div>

            {/* Secret Key Modal */}
            {showKeyModal && (
                <div className="modal-overlay">
                    <button
                        type="button"
                        className="modal-backdrop"
                        aria-label="Close API key dialog"
                        onClick={() => setShowKeyModal(false)}
                    />
                    <div className="modal-content">
                        <h2>Set Secret Key</h2>

                        <label htmlFor="modal-api-key">API Key</label>
                        <input
                            id="modal-api-key"
                            type="password"
                            value={apiKeyDraft}
                            onChange={(event) =>
                                setApiKeyDraft(event.target.value)
                            }
                            placeholder="sk-..."
                            autoFocus
                        />

                        <label htmlFor="modal-api-endpoint">API Endpoint</label>
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

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="ghost"
                                onClick={() => setShowKeyModal(false)}
                                disabled={isSavingKey}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="primary"
                                onClick={saveKey}
                                disabled={isSavingKey || !apiKeyDraft.trim()}
                            >
                                {isSavingKey ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
