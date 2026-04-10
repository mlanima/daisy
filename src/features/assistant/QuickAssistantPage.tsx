import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { Agent, WindowSize } from "../../domain/types";
import { resizeQuickWindow } from "../../infrastructure/tauriClient";

interface QuickAssistantPageProps {
    readonly agents: Agent[];
    readonly selectedAgentId: string | null;
    readonly recentAgentIds: string[];
    readonly promptText: string;
    readonly responseText: string;
    readonly isSending: boolean;
    readonly windowSize: WindowSize;
    readonly onSelectAgent: (agentId: string) => void;
    readonly onPromptChange: (value: string) => void;
    readonly onRefreshCapture: () => Promise<void>;
    readonly onSend: () => void;
    readonly onOpenFullApp: () => void;
}

export function QuickAssistantPage({
    agents,
    selectedAgentId,
    recentAgentIds,
    promptText,
    responseText,
    isSending,
    windowSize,
    onSelectAgent,
    onPromptChange,
    onRefreshCapture,
    onSend,
    onOpenFullApp,
}: QuickAssistantPageProps) {
    const promptRef = useRef<HTMLTextAreaElement | null>(null);
    const shellRef = useRef<HTMLElement | null>(null);
    const lastSizeRef = useRef({ width: 0, height: 0 });
    const resizeRequestIdRef = useRef(0);
    const [isOverflowOpen, setIsOverflowOpen] = useState(false);
    const hasResponse = responseText.trim().length > 0;

    const { visibleAgents, hiddenAgents } = useMemo(() => {
        const orderedRecent = recentAgentIds
            .map((id) => agents.find((agent) => agent.id === id) ?? null)
            .filter((agent): agent is Agent => Boolean(agent));
        const selectedAgent =
            agents.find((agent) => agent.id === selectedAgentId) ?? null;

        if (
            selectedAgent &&
            !orderedRecent.some((agent) => agent.id === selectedAgent.id)
        ) {
            orderedRecent.unshift(selectedAgent);
        }

        if (orderedRecent.length === 0 && agents.length > 0) {
            orderedRecent.push(agents[0]);
        }

        const nextVisible = orderedRecent.slice(0, 2);

        const visibleIds = new Set(nextVisible.map((agent) => agent.id));
        const nextHidden = agents.filter((agent) => !visibleIds.has(agent.id));

        return {
            visibleAgents: nextVisible,
            hiddenAgents: nextHidden,
        };
    }, [agents, selectedAgentId, recentAgentIds]);

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

            void resizeQuickWindow(nextWidth, nextHeight)
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

                    // Let the next layout pass retry sizing instead of getting stuck.
                    lastSizeRef.current = { width: 0, height: 0 };

                    shell.classList.remove("constrained");
                });
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [promptText, responseText, isSending, windowSize, isOverflowOpen]);

    useEffect(() => {
        const webviewWindow = getCurrentWebviewWindow();

        const handleFocus = () => {
            void onRefreshCapture();
        };

        const handleBlur = () => {
            void webviewWindow.hide();
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("blur", handleBlur);
        };
    }, [onRefreshCapture]);

    return (
        <main
            className={`quick-shell ${hasResponse ? "has-output" : ""}`}
            ref={shellRef}
        >
            <div className="quick-topbar">
                <div className="quick-agent-row">
                    {visibleAgents.map((agent, index) => {
                        const isLastVisible =
                            index === visibleAgents.length - 1;

                        return (
                            <button
                                key={agent.id}
                                type="button"
                                className={`quick-agent-pill ${isLastVisible ? "last-visible" : ""} ${selectedAgentId === agent.id ? "active" : ""}`}
                                onClick={() => onSelectAgent(agent.id)}
                                title={agent.name}
                            >
                                {agent.name}
                            </button>
                        );
                    })}

                    {hiddenAgents.length > 0 ? (
                        <button
                            type="button"
                            className={`quick-agent-pill quick-overflow-toggle ${isOverflowOpen ? "active" : ""}`}
                            onClick={() => setIsOverflowOpen((open) => !open)}
                            aria-label="Show more agents"
                        >
                            ...
                        </button>
                    ) : null}
                </div>

                <div className="quick-top-actions">
                    <button
                        type="button"
                        className="ghost"
                        onClick={onOpenFullApp}
                    >
                        Open
                    </button>
                    <button
                        type="button"
                        className="primary"
                        onClick={onSend}
                        disabled={isSending || !promptText.trim()}
                    >
                        {isSending ? "..." : "Send"}
                    </button>
                </div>
            </div>

            {isOverflowOpen && hiddenAgents.length > 0 ? (
                <div
                    className="quick-overflow-menu"
                    role="menu"
                    aria-label="More agents"
                >
                    {hiddenAgents.map((agent) => (
                        <button
                            key={agent.id}
                            type="button"
                            role="menuitem"
                            className={`quick-overflow-item ${selectedAgentId === agent.id ? "active" : ""}`}
                            onClick={() => {
                                onSelectAgent(agent.id);
                                setIsOverflowOpen(false);
                            }}
                        >
                            {agent.name}
                        </button>
                    ))}
                </div>
            ) : null}

            <textarea
                ref={promptRef}
                className="quick-input"
                value={promptText}
                onChange={(event) => onPromptChange(event.target.value)}
                rows={1}
            />

            {responseText.trim() ? (
                <pre className="quick-output">{responseText}</pre>
            ) : null}
        </main>
    );
}
