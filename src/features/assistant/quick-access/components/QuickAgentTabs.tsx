import type { Agent } from "../../../../shared/types/appState";
import { ChevronDown } from "lucide-react";
import { Button } from "../../../../shared/components";

interface QuickAgentTabsProps {
    selectedAgent: Agent | null;
    isOverflowOpen: boolean;
    onToggleOverflow: () => void;
}

/** Renders quick-agent dropdown trigger button. */
export function QuickAgentTabs({
    selectedAgent,
    isOverflowOpen,
    onToggleOverflow,
}: Readonly<QuickAgentTabsProps>) {
    const label = selectedAgent?.name?.trim() || "Select agent";

    return (
        <Button
            variant="unstyled"
            className={[
                "inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition",
                isOverflowOpen
                    ? "border-primary/60 bg-primary/15 text-foreground shadow-sm"
                    : "border-border/80 bg-background/75 text-foreground hover:border-primary/45 hover:bg-primary/10",
            ].join(" ")}
            onClick={onToggleOverflow}
            aria-label="Choose agent"
            title={label}
        >
            <span className="truncate font-medium">{label}</span>
            <ChevronDown
                className={`h-4 w-4 shrink-0 transition ${isOverflowOpen ? "rotate-180" : "rotate-0"}`}
            />
        </Button>
    );
}
