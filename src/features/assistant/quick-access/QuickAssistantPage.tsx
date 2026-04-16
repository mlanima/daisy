import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type MouseEvent,
    type PointerEvent,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Button } from "../../../shared/components";
import { suppressQuickWindowAutoHide } from "../assistantService";
import type { QuickAssistantPageProps } from "../types";
import { useQuickAssistantShell } from "./useQuickAssistantShell";
import { QuickAgentTabs } from "./components/QuickAgentTabs";
import { QuickOverflowMenu } from "./components/QuickOverflowMenu";

type ResizeDirection = "South";

/** Compact quick-window assistant UI with agent tabs and single prompt area. */
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
}: Readonly<QuickAssistantPageProps>) {
    const dropdownAnchorRef = useRef<HTMLDivElement | null>(null);
    const splitContainerRef = useRef<HTMLDivElement | null>(null);
    const [splitRatio, setSplitRatio] = useState(0.34);
    const [hasManualSplit, setHasManualSplit] = useState(false);

    const {
        promptRef,
        shellRef,
        isConstrained,
        isOverflowOpen,
        visibleAgents,
        hiddenAgents,
        toggleOverflow,
        selectHiddenAgent,
    } = useQuickAssistantShell({
        agents,
        selectedAgentId,
        recentAgentIds,
        promptText,
        responseText,
        isSending,
        windowSize,
        forceSplit: hasManualSplit,
        onSelectAgent,
        onRefreshCapture,
    });

    const orderedAgents = [...visibleAgents, ...hiddenAgents];
    const selectedAgent =
        orderedAgents.find((agent) => agent.id === selectedAgentId) ?? null;
    const hasVisibleResponse = responseText.trim().length > 0;
    const isSplitActive =
        hasVisibleResponse && (isConstrained || hasManualSplit);

    useEffect(() => {
        if (!hasVisibleResponse) {
            setHasManualSplit(false);
            setSplitRatio(0.34);
        }
    }, [hasVisibleResponse]);

    useEffect(() => {
        if (!isSplitActive) {
            return;
        }

        const container = splitContainerRef.current;

        if (!container) {
            return;
        }

        const splitterHeight = 10;
        const minPromptPx = 56;
        const minResponsePx = 72;

        const clampRatioToContainer = () => {
            const total =
                container.getBoundingClientRect().height - splitterHeight;

            if (total <= 0) {
                return;
            }

            if (total <= minPromptPx + minResponsePx) {
                setSplitRatio(0.5);
                return;
            }

            const minRatio = minPromptPx / total;
            const maxRatio = 1 - minResponsePx / total;

            setSplitRatio((ratio) =>
                Math.min(Math.max(ratio, minRatio), maxRatio),
            );
        };

        clampRatioToContainer();

        const resizeObserver = new ResizeObserver(clampRatioToContainer);
        resizeObserver.observe(container);
        globalThis.addEventListener("resize", clampRatioToContainer);

        return () => {
            resizeObserver.disconnect();
            globalThis.removeEventListener("resize", clampRatioToContainer);
        };
    }, [isSplitActive]);

    const promptPaneStyle = isSplitActive
        ? {
              flexBasis: `${(splitRatio * 100).toFixed(2)}%`,
              flexGrow: 0,
              flexShrink: 0,
          }
        : undefined;

    const responsePaneStyle = isSplitActive
        ? {
              flexBasis: `${((1 - splitRatio) * 100).toFixed(2)}%`,
              flexGrow: 1,
              flexShrink: 1,
          }
        : undefined;

    const handleSplitterPointerDown = useCallback(
        (event: PointerEvent<HTMLButtonElement>) => {
            if (!hasVisibleResponse) {
                return;
            }

            suppressQuickWindowAutoHide(1400);

            setHasManualSplit(true);

            const container = splitContainerRef.current;

            if (!container) {
                return;
            }

            event.preventDefault();
            const splitter = event.currentTarget;

            splitter.setPointerCapture(event.pointerId);

            const updateSplitRatio = (clientY: number) => {
                const rect = container.getBoundingClientRect();
                const splitterHeight = 10;
                const minPromptPx = 56;
                const minResponsePx = 72;
                const total = rect.height - splitterHeight;

                if (total <= minPromptPx + minResponsePx) {
                    return;
                }

                const proposedPrompt = clientY - rect.top - splitterHeight / 2;
                const clampedPrompt = Math.min(
                    Math.max(proposedPrompt, minPromptPx),
                    total - minResponsePx,
                );

                setSplitRatio(clampedPrompt / total);
            };

            updateSplitRatio(event.clientY);

            const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
                updateSplitRatio(moveEvent.clientY);
            };

            const stopDragging = () => {
                globalThis.removeEventListener(
                    "pointermove",
                    handlePointerMove,
                );
                globalThis.removeEventListener("pointerup", stopDragging);
                globalThis.removeEventListener("pointercancel", stopDragging);

                if (splitter.hasPointerCapture(event.pointerId)) {
                    splitter.releasePointerCapture(event.pointerId);
                }
            };

            globalThis.addEventListener("pointermove", handlePointerMove);
            globalThis.addEventListener("pointerup", stopDragging);
            globalThis.addEventListener("pointercancel", stopDragging);
        },
        [hasVisibleResponse],
    );

    const handleInteractionGuard = useCallback(() => {
        suppressQuickWindowAutoHide(1200);
    }, []);

    const handleWindowDragStart = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            suppressQuickWindowAutoHide(2400);
            void getCurrentWindow()
                .startDragging()
                .catch(() => {
                    // Ignore drag errors silently for unsupported platforms/state.
                });
        },
        [],
    );

    const handleDragbarDoubleClick = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            // Prevent default double-click titlebar-like behavior in custom region.
            event.preventDefault();
            suppressQuickWindowAutoHide(2400);
        },
        [],
    );

    const handleWindowResizeStart = useCallback(
        (direction: ResizeDirection) =>
            (event: MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                suppressQuickWindowAutoHide(2400);
                void getCurrentWindow()
                    .startResizeDragging(direction)
                    .catch(() => {
                        // Ignore resize drag errors silently for unsupported platforms/state.
                    });
            },
        [],
    );

    return (
        <main
            className={`quick-shell ${hasVisibleResponse ? "has-output" : ""} relative flex h-full min-h-0 max-h-full flex-col gap-0 overflow-visible rounded-2xl border border-border/70 bg-card/96 shadow-[0_20px_48px_-30px_hsl(var(--foreground))] backdrop-blur-xl`}
            ref={shellRef}
            onPointerDownCapture={handleInteractionGuard}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-2 rounded-t-2xl border-b border-border/70 bg-muted/65"
            />

            <button
                type="button"
                className="quick-dragbar"
                onMouseDown={handleWindowDragStart}
                onDoubleClick={handleDragbarDoubleClick}
                aria-label="Drag popup"
                title="Drag to move popup"
            />

            <div className="flex items-center justify-between gap-2 border-b border-border/65 px-2.5 py-2">
                <div ref={dropdownAnchorRef} className="min-w-0">
                    <QuickAgentTabs
                        selectedAgent={selectedAgent}
                        isOverflowOpen={isOverflowOpen}
                        onToggleOverflow={toggleOverflow}
                    />
                    <QuickOverflowMenu
                        agents={orderedAgents}
                        anchorRef={dropdownAnchorRef}
                        boundaryRef={shellRef}
                        selectedAgentId={selectedAgentId}
                        isOpen={isOverflowOpen}
                        onSelectAgent={selectHiddenAgent}
                    />
                </div>

                <div className="inline-flex shrink-0 gap-1">
                    <Button
                        variant="ghost"
                        className="h-8 border-transparent bg-transparent px-3"
                        onClick={onOpenFullApp}
                    >
                        Open
                    </Button>
                    <Button
                        variant="primary"
                        className="h-8 px-3"
                        onClick={onSend}
                        disabled={isSending || !promptText.trim()}
                    >
                        {isSending ? "..." : "Send"}
                    </Button>
                </div>
            </div>

            <div
                ref={splitContainerRef}
                className={`quick-split ${isConstrained ? "is-constrained" : ""} ${isSplitActive ? "is-active" : ""}`}
            >
                <div
                    className={`quick-prompt px-1.5 py-1 ${hasVisibleResponse ? "" : "border-b border-border/60"}`}
                    style={promptPaneStyle}
                >
                    <textarea
                        ref={promptRef}
                        className="quick-input custom-scrollbar w-full resize-none overflow-y-auto rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 leading-relaxed text-card-foreground outline-none transition focus:border-primary/50 focus:bg-background/35 focus:ring-0"
                        value={promptText}
                        onChange={(event) => onPromptChange(event.target.value)}
                        rows={1}
                    />
                </div>

                {hasVisibleResponse ? (
                    <button
                        type="button"
                        className="quick-splitter"
                        onPointerDown={handleSplitterPointerDown}
                        aria-label="Resize input and output"
                    />
                ) : null}

                {hasVisibleResponse ? (
                    <div
                        className="quick-response custom-scrollbar px-1.5 py-1"
                        style={responsePaneStyle}
                    >
                        <pre className="quick-output m-0 min-h-0 overflow-visible whitespace-pre-wrap wrap-break-word rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 font-mono leading-relaxed text-card-foreground">
                            {responseText}
                        </pre>
                    </div>
                ) : null}
            </div>

            <button
                type="button"
                className="quick-resize-bottom"
                onMouseDown={handleWindowResizeStart("South")}
                title="Resize height"
                aria-label="Resize popup height"
            />
        </main>
    );
}
