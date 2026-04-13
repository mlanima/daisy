import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStateSnapshot } from "../shared/types/appState";
import { openMainAssistantWindow } from "../features/assistant/assistantService";
import { resolveSelectedAgent } from "../features/assistant/agentUtils";
import { useAssistantFlow } from "../features/assistant/useAssistantFlow";
import { useSettingsFlow } from "../features/settings/useSettingsFlow";
import {
    createErrorPresenter,
    createWorkspaceStateService,
    isQuickWindowMode,
} from "./controllerUtils";
import { useControllerFeedback } from "./useControllerFeedback";

interface PersistSnapshotOptions {
    successMessage?: string;
}

type UiView = "assistant" | "settings";

const workspaceStateService = createWorkspaceStateService();
const errorPresenter = createErrorPresenter();
const loadWorkspaceSnapshot = () => workspaceStateService.loadSnapshot();

function useUiShellState(
    snapshot: AppStateSnapshot | null,
    isQuickWindow: boolean,
) {
    useEffect(() => {
        if (!snapshot) {
            return;
        }

        document.documentElement.dataset.theme = snapshot.settings.darkMode
            ? "dark"
            : "light";
    }, [snapshot]);

    useEffect(() => {
        if (!snapshot) {
            return;
        }

        document.documentElement.dataset.windowSize =
            snapshot.settings.windowSize;
    }, [snapshot]);

    useEffect(() => {
        document.documentElement.dataset.windowMode = isQuickWindow
            ? "quick"
            : "main";
    }, [isQuickWindow]);

    useEffect(() => {
        if (!isQuickWindow) {
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [isQuickWindow]);
}

export function useAppController() {
    const [view, setView] = useState<UiView>("assistant");
    const [snapshot, setSnapshot] = useState<AppStateSnapshot | null>(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [apiKeyPresent, setApiKeyPresent] = useState(false);

    const snapshotRef = useRef<AppStateSnapshot | null>(null);
    const {
        status,
        lastErrorDetails,
        setStatusMessage,
        clearErrorDetails,
        setErrorState,
    } = useControllerFeedback(errorPresenter);

    const [isQuickWindow] = useState(isQuickWindowMode);
    const selectedAgent = resolveSelectedAgent(snapshot);
    snapshotRef.current = snapshot;

    useUiShellState(snapshot, isQuickWindow);

    const applySnapshotLocally = useCallback(
        (nextSnapshot: AppStateSnapshot) => {
            setSnapshot(nextSnapshot);
            snapshotRef.current = nextSnapshot;
        },
        [],
    );

    const persistSnapshot = useCallback(
        async (
            nextSnapshot: AppStateSnapshot,
            options?: PersistSnapshotOptions,
        ): Promise<void> => {
            applySnapshotLocally(nextSnapshot);

            try {
                const savedSnapshot =
                    await workspaceStateService.persistSnapshot(nextSnapshot);
                applySnapshotLocally(savedSnapshot);

                if (options?.successMessage) {
                    setStatusMessage("success", options.successMessage);
                }

                clearErrorDetails();
            } catch (error) {
                setErrorState(error);
            }
        },
        [
            applySnapshotLocally,
            clearErrorDetails,
            setErrorState,
            setStatusMessage,
        ],
    );

    const {
        promptText,
        responseText,
        isSending,
        setPromptText,
        refreshQuickCapture,
        sendCurrentPrompt,
        onSelectAgent,
        onUpdateAgents,
    } = useAssistantFlow({
        isQuickWindow,
        snapshot,
        applySnapshotLocally,
        persistSnapshot,
        setStatus: setStatusMessage,
        clearErrorDetails,
        reportError: setErrorState,
    });

    const { onUpdateSettings, onSaveApiKey, onClearApiKey } = useSettingsFlow({
        getSnapshot: () => snapshotRef.current,
        persistSnapshot,
        applySnapshotLocally,
        loadSnapshot: loadWorkspaceSnapshot,
        setStatus: setStatusMessage,
        setApiKeyPresent,
        clearErrorDetails,
        reportError: setErrorState,
    });

    useEffect(() => {
        let mounted = true;

        const bootstrap = async () => {
            try {
                const initialState = await workspaceStateService.bootstrap();

                if (!mounted) {
                    return;
                }

                applySnapshotLocally(initialState.snapshot);
                setApiKeyPresent(initialState.apiKeyPresent);
            } catch (error) {
                if (mounted) {
                    setErrorState(error);
                }
            } finally {
                if (mounted) {
                    setIsBootstrapping(false);
                }
            }
        };

        void bootstrap();

        return () => {
            mounted = false;
        };
    }, [applySnapshotLocally, setErrorState]);

    useEffect(() => {
        if (!snapshot) {
            return;
        }

        const nextSnapshot =
            workspaceStateService.repairSelectedAgent(snapshot);

        if (!nextSnapshot) {
            return;
        }

        void persistSnapshot(nextSnapshot);
    }, [snapshot, persistSnapshot]);

    const onOpenFullApp = useCallback(async () => {
        try {
            await openMainAssistantWindow();
        } catch (error) {
            setErrorState(error);
        }
    }, [setErrorState]);

    return {
        view,
        setView,
        isQuickWindow,
        selectedAgent,
        snapshot,
        isBootstrapping,
        status,
        promptText,
        responseText,
        isSending,
        apiKeyPresent,
        lastErrorDetails,
        setPromptText,
        clearErrorDetails,
        refreshQuickCapture,
        sendCurrentPrompt,
        onSelectAgent,
        onUpdateAgents,
        onUpdateSettings,
        onSaveApiKey,
        onClearApiKey,
        onOpenFullApp,
    };
}
