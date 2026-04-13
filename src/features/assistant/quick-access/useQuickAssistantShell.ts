import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { Agent, WindowSize } from "../../../shared/types/appState";
import {
    bindQuickWindowLifecycle,
    resizeQuickAssistantWindow,
} from "../assistantService";
import { resolveQuickAgentRows } from "../agentUtils";

interface UseQuickAssistantShellParams {
    agents: Agent[];
    selectedAgentId: string | null;
    recentAgentIds: string[];
    promptText: string;
    responseText: string;
    isSending: boolean;
    windowSize: WindowSize;
    onSelectAgent: (agentId: string) => void;
    onRefreshCapture: () => Promise<void>;
}

/**
 * Coordinates quick-window layout sizing, overflow state, and focus refresh.
 */
export function useQuickAssistantShell({
    agents,
    selectedAgentId,
    recentAgentIds,
    promptText,
    responseText,
    isSending,
    windowSize,
    onSelectAgent,
    onRefreshCapture,
}: UseQuickAssistantShellParams) {
    const promptRef = useRef<HTMLTextAreaElement | null>(null);
    const shellRef = useRef<HTMLElement | null>(null);
    const lastSizeRef = useRef({ width: 0, height: 0 });
    const resizeRequestIdRef = useRef(0);
    const [isOverflowOpen, setIsOverflowOpen] = useState(false);

    const hasResponse = responseText.trim().length > 0;

    const { visibleAgents, hiddenAgents } = useMemo(
        () => resolveQuickAgentRows(agents, selectedAgentId, recentAgentIds),
        [agents, selectedAgentId, recentAgentIds],
    );

    useEffect(() => {
        if (hiddenAgents.length === 0 && isOverflowOpen) {
            setIsOverflowOpen(false);
        }
    }, [hiddenAgents.length, isOverflowOpen]);

    useLayoutEffect(() => {
        const promptElement = promptRef.current;

        if (!promptElement) {
            return;
        }

        promptElement.style.height = "0px";
        promptElement.style.height = `${Math.max(promptElement.scrollHeight, 28)}px`;
    }, [promptText]);

    useLayoutEffect(() => {
        const shell = shellRef.current;

        if (!shell) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            const bodyStyle = globalThis.getComputedStyle(document.body);
            const bodyPaddingX =
                Number.parseFloat(bodyStyle.paddingLeft || "0") +
                Number.parseFloat(bodyStyle.paddingRight || "0");
            const bodyPaddingY =
                Number.parseFloat(bodyStyle.paddingTop || "0") +
                Number.parseFloat(bodyStyle.paddingBottom || "0");
            const shellWidth = Math.ceil(shell.getBoundingClientRect().width);
            const nextHeight = Math.max(
                Math.ceil(shell.scrollHeight + bodyPaddingY) + 4,
                72,
            );
            const nextWidth = Math.max(
                Math.ceil(shellWidth + bodyPaddingX) + 4,
                360,
            );
            const lastSize = lastSizeRef.current;

            if (
                lastSize.width === nextWidth &&
                Math.abs(lastSize.height - nextHeight) < 1
            ) {
                return;
            }

            const requestId = ++resizeRequestIdRef.current;

            void resizeQuickAssistantWindow(nextWidth, nextHeight)
                .then((result) => {
                    if (requestId !== resizeRequestIdRef.current) {
                        return;
                    }

                    lastSizeRef.current = {
                        width: Math.ceil(result.width),
                        height: Math.ceil(result.height),
                    };

                    shell.classList.toggle(
                        "constrained",
                        result.isHeightClamped,
                    );
                })
                .catch(() => {
                    if (requestId !== resizeRequestIdRef.current) {
                        return;
                    }

                    lastSizeRef.current = { width: 0, height: 0 };
                    shell.classList.remove("constrained");
                });
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [promptText, responseText, isSending, windowSize, isOverflowOpen]);

    useEffect(() => {
        return bindQuickWindowLifecycle(() => {
            void onRefreshCapture();
        });
    }, [onRefreshCapture]);

    /** Toggles visibility of the hidden-agent overflow menu. */
    const toggleOverflow = useCallback(() => {
        setIsOverflowOpen((open) => !open);
    }, []);

    /** Selects an overflow agent and closes the overflow menu. */
    const selectHiddenAgent = useCallback(
        (agentId: string) => {
            onSelectAgent(agentId);
            setIsOverflowOpen(false);
        },
        [onSelectAgent],
    );

    return {
        promptRef,
        shellRef,
        hasResponse,
        isOverflowOpen,
        visibleAgents,
        hiddenAgents,
        toggleOverflow,
        selectHiddenAgent,
    };
}
