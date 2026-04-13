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
    const [displayKeyPreview, setOptimisticKeyPreview] = useOptimistic(
        keyPreview,
        (_currentPreview, nextPreview: string) => nextPreview,
    );

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

    const openKeyModal = () => {
        setShowKeyModal(true);
    };

    const closeKeyModal = () => {
        setShowKeyModal(false);
    };

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
