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
    forceSplit: boolean;
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
    forceSplit,
    onSelectAgent,
    onRefreshCapture,
}: UseQuickAssistantShellParams) {
    const promptRef = useRef<HTMLTextAreaElement | null>(null);
    const shellRef = useRef<HTMLElement | null>(null);
    const lastSizeRef = useRef({ width: 0, height: 0 });
    const widthLockRef = useRef<number | null>(null);
    const heightLockRef = useRef<number | null>(null);
    const lastResizeAtRef = useRef(0);
    const resizeRequestIdRef = useRef(0);
    const [isOverflowOpen, setIsOverflowOpen] = useState(false);
    const [isConstrained, setIsConstrained] = useState(false);

    const hasResponse = responseText.trim().length > 0;

    const { visibleAgents, hiddenAgents } = useMemo(
        () => resolveQuickAgentRows(agents, selectedAgentId, recentAgentIds),
        [agents, selectedAgentId, recentAgentIds],
    );

    useEffect(() => {
        if (agents.length === 0 && isOverflowOpen) {
            setIsOverflowOpen(false);
        }
    }, [agents.length, isOverflowOpen]);

    useLayoutEffect(() => {
        const promptElement = promptRef.current;

        if (!promptElement) {
            return;
        }

        promptElement.style.height = "0px";
        const naturalHeight = Math.max(promptElement.scrollHeight, 28);

        if (hasResponse && (forceSplit || isConstrained)) {
            // In split/constrained mode, the pane defines textarea height.
            promptElement.style.height = "100%";
            return;
        }

        promptElement.style.height = `${naturalHeight}px`;
    }, [forceSplit, hasResponse, isConstrained, promptText]);

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
            const measuredHeight = Math.max(
                Math.ceil(shell.getBoundingClientRect().height + bodyPaddingY) +
                    4,
                72,
            );
            const measuredWidth = Math.max(
                Math.ceil(shell.getBoundingClientRect().width + bodyPaddingX) +
                    4,
                360,
            );
            const promptElement = promptRef.current;
            const responseElement = shell.querySelector<HTMLElement>(
                ".quick-response",
            );
            const shellOverflow = Math.max(
                shell.scrollHeight - shell.clientHeight,
                0,
            );
            const promptOverflow = promptElement
                ? Math.max(
                      promptElement.scrollHeight - promptElement.clientHeight,
                      0,
                  )
                : 0;
            const responseOverflow = responseElement
                ? Math.max(
                      responseElement.scrollHeight - responseElement.clientHeight,
                      0,
                  )
                : 0;
            const extraOverflowHeight = Math.max(
                shellOverflow,
                promptOverflow,
                responseOverflow,
            );
            const rawHeight = Math.max(
                measuredHeight + Math.ceil(extraOverflowHeight),
                72,
            );
            const lastSize = lastSizeRef.current;

            // Keep width static by default, but adopt explicit manual window resizes.
            widthLockRef.current ??=
                lastSize.width > 0 ? lastSize.width : measuredWidth;

            // Keep user-selected height, but auto-grow when content exceeds it.
            if (heightLockRef.current == null) {
                heightLockRef.current =
                    lastSize.height > 0 ? lastSize.height : measuredHeight;
            } else if (Math.abs(measuredHeight - heightLockRef.current) >= 24) {
                heightLockRef.current = measuredHeight;
            }

            const nextWidth = widthLockRef.current;
            const nextHeight = Math.max(rawHeight, heightLockRef.current);
            const widthDelta = Math.abs(lastSize.width - nextWidth);
            const heightDelta = Math.abs(lastSize.height - nextHeight);

            if (widthDelta < 2 && heightDelta < 2) {
                return;
            }

            const now = Date.now();
            const minIntervalMs = isSending ? 110 : 56;
            const isSignificantChange = widthDelta >= 14 || heightDelta >= 24;

            if (
                lastSize.width > 0 &&
                now - lastResizeAtRef.current < minIntervalMs &&
                !isSignificantChange
            ) {
                return;
            }

            const requestId = ++resizeRequestIdRef.current;
            lastResizeAtRef.current = now;

            void resizeQuickAssistantWindow(nextWidth, nextHeight)
                .then((result) => {
                    if (requestId !== resizeRequestIdRef.current) {
                        return;
                    }

                    lastSizeRef.current = {
                        width: Math.ceil(result.width),
                        height: Math.ceil(result.height),
                    };
                    widthLockRef.current = Math.ceil(result.width);
                    heightLockRef.current = Math.ceil(result.height);

                    const isConstrained =
                        shell.classList.contains("constrained");

                    if (isConstrained !== result.isHeightClamped) {
                        shell.classList.toggle(
                            "constrained",
                            result.isHeightClamped,
                        );
                    }

                    setIsConstrained(result.isHeightClamped);
                })
                .catch(() => {
                    if (requestId !== resizeRequestIdRef.current) {
                        return;
                    }

                    lastSizeRef.current = { width: 0, height: 0 };
                    widthLockRef.current = null;
                    heightLockRef.current = null;
                    shell.classList.remove("constrained");
                    setIsConstrained(false);
                });
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [forceSplit, isConstrained, isOverflowOpen, responseText, isSending, windowSize]);

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
        isConstrained,
        isOverflowOpen,
        visibleAgents,
        hiddenAgents,
        toggleOverflow,
        selectHiddenAgent,
    };
}
