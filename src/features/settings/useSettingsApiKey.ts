import { useCallback, useEffect, useState } from "react";
import { fetchApiKeyPreview } from "./settingsService";

interface UseSettingsApiKeyParams {
    apiKeyPresent: boolean;
    onSaveApiKey: (apiKey: string) => Promise<void>;
    onClearApiKey: () => Promise<void>;
}

export function useSettingsApiKey({
    apiKeyPresent,
    onSaveApiKey,
    onClearApiKey,
}: UseSettingsApiKeyParams) {
    const [apiKeyDraft, setApiKeyDraft] = useState("");
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState("<loading>");
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const refreshPreview = useCallback(async () => {
        try {
            const preview = await fetchApiKeyPreview();
            setKeyPreview(preview);
        } catch {
            setKeyPreview("<error checking>");
        }
    }, []);

    useEffect(() => {
        void refreshPreview();
    }, [apiKeyPresent, refreshPreview]);

    const saveKey = useCallback(async () => {
        const nextKey = apiKeyDraft.trim();

        if (!nextKey) {
            return;
        }

        setIsSavingKey(true);
        try {
            await onSaveApiKey(nextKey);
            setApiKeyDraft("");
            setShowKeyModal(false);
            await refreshPreview();
        } finally {
            setIsSavingKey(false);
        }
    }, [apiKeyDraft, onSaveApiKey, refreshPreview]);

    const clearKey = useCallback(async () => {
        setIsSavingKey(true);
        try {
            await onClearApiKey();
            setKeyPreview("<not found>");
        } finally {
            setIsSavingKey(false);
        }
    }, [onClearApiKey]);

    const openKeyModal = useCallback(() => {
        setShowKeyModal(true);
    }, []);

    const closeKeyModal = useCallback(() => {
        setShowKeyModal(false);
    }, []);

    const toggleAdvanced = useCallback(() => {
        setShowAdvanced((value) => !value);
    }, []);

    return {
        apiKeyDraft,
        setApiKeyDraft,
        isSavingKey,
        keyPreview,
        showKeyModal,
        showAdvanced,
        openKeyModal,
        closeKeyModal,
        toggleAdvanced,
        saveKey,
        clearKey,
    };
}
