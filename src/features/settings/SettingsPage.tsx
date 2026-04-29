import { ArrowLeft } from "lucide-react";
import { Button } from "../../shared/components";
import { ApiCredentialsCard } from "./components/ApiCredentialsCard";
import { ApiCredentialsModal } from "./components/ApiCredentialsModal";
import { BehaviorAppearanceCard } from "./components/BehaviorAppearanceCard";
import { useSettingsApiKey } from "./useSettingsApiKey";
import type { SettingsPageProps } from "./types";

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
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-5">
            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:items-center">
                <Button
                    variant="ghost"
                    className="h-14 w-14 p-0 text-muted-foreground border-transparent! bg-transparent! hover:border-transparent! hover:bg-transparent! hover:text-foreground hover:scale-110"
                    aria-label="Back to assistant"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-8 w-8" />
                </Button>

                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Configure model behavior, appearance, and credentials.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ApiCredentialsCard
                    keyPreview={keyPreview}
                    isSavingKey={isSavingKey}
                    onOpenKeyModal={openKeyModal}
                    onClearKey={clearKey}
                />

                <BehaviorAppearanceCard
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    showAdvanced={showAdvanced}
                    onToggleAdvanced={toggleAdvanced}
                />
            </div>

            <div className="grid min-h-0 place-items-center">
                <div className="settings-footer-logo h-full w-full max-h-48 max-w-48" />
            </div>

            <ApiCredentialsModal
                isOpen={showKeyModal}
                apiKeyDraft={apiKeyDraft}
                isSavingKey={isSavingKey}
                saveError={saveError}
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onClose={closeKeyModal}
                onApiKeyDraftChange={setApiKeyDraft}
                saveKeyAction={saveKeyAction}
            />
        </div>
    );
}
