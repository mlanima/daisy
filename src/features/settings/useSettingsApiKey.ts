import { useActionState, useEffect, useOptimistic, useState } from "react";
import { apiKeySchema } from "../../shared/schemas/appStateSchema";
import { fetchApiKeyPreview } from "./settingsService";

interface UseSettingsApiKeyParams {
    apiKeyPresent: boolean;
    onSaveApiKey: (apiKey: string) => Promise<void>;
    onClearApiKey: () => Promise<void>;
}

interface SaveApiKeyActionState {
    error: string | null;
}

const INITIAL_SAVE_STATE: SaveApiKeyActionState = {
    error: null,
};

/**
 * Encapsulates API key modal state, preview loading, and save/clear actions.
 */
export function useSettingsApiKey({
    apiKeyPresent,
    onSaveApiKey,
    onClearApiKey,
}: UseSettingsApiKeyParams) {
    const [apiKeyDraft, setApiKeyDraft] = useState("");
    const [isClearingKey, setIsClearingKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState("<loading>");
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    // Optimistic value keeps the preview responsive during save/clear actions.
    const [displayKeyPreview, setOptimisticKeyPreview] = useOptimistic(
        keyPreview,
        (_currentPreview, nextPreview: string) => nextPreview,
    );

    /** Refreshes the preview string shown for current API key state. */
    const refreshPreview = async () => {
        try {
            const preview = await fetchApiKeyPreview();
            setKeyPreview(preview);
        } catch {
            setKeyPreview("<error checking>");
        }
    };

    const [saveState, saveKeyAction, isSavingKey] = useActionState<
        SaveApiKeyActionState,
        FormData
    >(async (_previousState, formData) => {
        const apiKeyField = formData.get("apiKey");
        const parsedApiKey = apiKeySchema.safeParse(apiKeyField);

        if (!parsedApiKey.success) {
            return {
                error:
                    parsedApiKey.error.issues[0]?.message ??
                    "API key is required.",
            };
        }

        const nextKey = parsedApiKey.data;

        // Immediately surface in-progress state to the user.
        setOptimisticKeyPreview("<saving>");

        try {
            await onSaveApiKey(nextKey);
            setApiKeyDraft("");
            setShowKeyModal(false);
            await refreshPreview();

            return {
                error: null,
            };
        } catch {
            setOptimisticKeyPreview("<error checking>");

            return {
                error: "Failed to save API key.",
            };
        }
    }, INITIAL_SAVE_STATE);

    useEffect(() => {
        void refreshPreview();
    }, [apiKeyPresent]);

    /** Clears the persisted key and updates preview with optimistic fallback. */
    const clearKey = async () => {
        setIsClearingKey(true);
        setOptimisticKeyPreview("<not found>");

        try {
            await onClearApiKey();
            setKeyPreview("<not found>");
        } catch {
            setOptimisticKeyPreview("<error checking>");
        } finally {
            setIsClearingKey(false);
        }
    };

    /** Opens the API key modal dialog. */
    const openKeyModal = () => {
        setShowKeyModal(true);
    };

    /** Closes the API key modal dialog. */
    const closeKeyModal = () => {
        setShowKeyModal(false);
    };

    /** Toggles visibility of advanced settings section. */
    const toggleAdvanced = () => {
        setShowAdvanced((value) => !value);
    };

    return {
        apiKeyDraft,
        setApiKeyDraft,
        isSavingKey: isSavingKey || isClearingKey,
        keyPreview: displayKeyPreview,
        showKeyModal,
        showAdvanced,
        saveError: saveState.error,
        openKeyModal,
        closeKeyModal,
        toggleAdvanced,
        saveKeyAction,
        clearKey,
    };
}
