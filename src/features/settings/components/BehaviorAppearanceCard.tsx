import { Card, SwitchField } from "../../../shared/components";
import { SettingsRow } from "./SettingsRow";
import { UiTextSizeDropdown } from "./UiTextSizeDropdown";
import type { AppSettings } from "../../../shared/types/appState";
import { controlClass } from "./settingsFormClasses";

interface BehaviorAppearanceCardProps {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    showAdvanced: boolean;
    onToggleAdvanced: () => void;
}

/** Groups model behavior and appearance controls into a single card. */
export function BehaviorAppearanceCard({
    settings,
    onUpdateSettings,
    showAdvanced,
    onToggleAdvanced,
}: Readonly<BehaviorAppearanceCardProps>) {
    return (
        <Card className="flex flex-col gap-4">
            <div>
                <h3 className="text-base font-semibold">
                    Behavior & Appearance
                </h3>
                <p className="text-xs text-muted-foreground">
                    Adjust interaction flow and text scaling.
                </p>
            </div>

            <details
                className="group rounded-xl border border-border/70 bg-card/70"
                open={showAdvanced}
            >
                <summary
                    className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [::-webkit-details-marker]:hidden"
                    onClick={(event) => {
                        event.preventDefault();
                        onToggleAdvanced();
                    }}
                >
                    <span className="text-sm font-medium">
                        Advanced Model Settings
                    </span>
                    <span className="text-xs text-muted-foreground transition group-open:rotate-90">
                        ▸
                    </span>
                </summary>

                <div className="grid gap-3 border-t border-border/70 p-3">
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
                                            maxTokens: event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </details>

            <SettingsRow
                label={
                    <span className="text-xs font-medium">UI Text Size</span>
                }
            >
                <div ref={null} className="relative w-fit">
                    {/* Use local state to show a small options menu anchored to the trigger */}
                    {/* Anchor wrapper */}
                    <div className="relative" ref={null} />
                </div>
                <UiTextSizeDropdown
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                />
            </SettingsRow>

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
    );
}
