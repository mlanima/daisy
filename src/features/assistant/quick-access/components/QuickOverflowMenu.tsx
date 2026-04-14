import {
    useLayoutEffect,
    useState,
    type CSSProperties,
    type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { Agent } from "../../../../shared/types/appState";
import { Button } from "../../../../shared/components";

interface QuickOverflowMenuProps {
    agents: Agent[];
    anchorRef: RefObject<HTMLElement | null>;
    selectedAgentId: string | null;
    isOpen: boolean;
    onSelectAgent: (agentId: string) => void;
}

/** Overlay dropdown menu for selecting any available quick agent. */
export function QuickOverflowMenu({
    agents,
    anchorRef,
    selectedAgentId,
    isOpen,
    onSelectAgent,
}: Readonly<QuickOverflowMenuProps>) {
    const [position, setPosition] = useState<{
        top: number;
        left: number;
        width: number;
        maxHeight: number;
    } | null>(null);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        const updatePosition = () => {
            const anchor = anchorRef.current;

            if (!anchor) {
                setPosition(null);
                return;
            }

            const rect = anchor.getBoundingClientRect();
            const viewportWidth = globalThis.innerWidth;
            const viewportHeight = globalThis.innerHeight;
            const edgePadding = 8;
            const gap = 6;
            const desiredWidth = Math.max(Math.round(rect.width), 192);
            const width = Math.min(
                Math.max(192, desiredWidth),
                Math.max(192, viewportWidth - edgePadding * 2),
            );
            const spaceRight = viewportWidth - rect.right - gap - edgePadding;
            const spaceLeft = rect.left - gap - edgePadding;
            const preferRight = spaceRight >= 120 || spaceRight >= spaceLeft;
            const proposedLeft = preferRight
                ? rect.right + gap
                : rect.left - width - gap;
            const maxLeft = Math.max(edgePadding, viewportWidth - width - edgePadding);
            const left = Math.min(
                Math.max(Math.round(proposedLeft), edgePadding),
                maxLeft,
            );
            const maxTop = Math.max(edgePadding, viewportHeight - edgePadding - 120);
            const top = Math.min(
                Math.max(Math.round(rect.top), edgePadding),
                maxTop,
            );
            const maxHeight = Math.max(
                120,
                Math.min(420, viewportHeight - top - edgePadding),
            );

            setPosition({
                top,
                left,
                width,
                maxHeight,
            });
        };

        updatePosition();

        globalThis.addEventListener("resize", updatePosition);
        globalThis.addEventListener("scroll", updatePosition, true);

        return () => {
            globalThis.removeEventListener("resize", updatePosition);
            globalThis.removeEventListener("scroll", updatePosition, true);
        };
    }, [anchorRef, isOpen]);

    if (!isOpen || agents.length === 0) {
        return null;
    }

    if (!position) {
        return null;
    }

    const menuStyle: CSSProperties = {
        position: "fixed",
        top: position.top,
        left: position.left,
        width: `${position.width}px`,
        maxHeight: `${position.maxHeight}px`,
        zIndex: 9999,
    };

    return createPortal(
        <div
            className="custom-scrollbar flex flex-col gap-1 overflow-y-auto overflow-x-hidden rounded-xl border border-primary/45 bg-background p-1.5 shadow-[0_22px_36px_-18px_hsl(var(--foreground))]"
            role="menu"
            aria-label="Select agent"
            style={menuStyle}
        >
            {agents.map((agent) => (
                <Button
                    key={agent.id}
                    variant="unstyled"
                    role="menuitem"
                    className={[
                        "h-9 min-h-9 w-full shrink-0 truncate rounded-md px-2.5 text-left text-inherit transition",
                        selectedAgentId === agent.id
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/85 hover:bg-primary/12",
                    ].join(" ")}
                    onClick={() => onSelectAgent(agent.id)}
                    title={agent.name}
                >
                    {agent.name}
                </Button>
            ))}
        </div>,
        document.body,
    );
}
