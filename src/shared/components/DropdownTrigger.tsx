import { ChevronDown } from "lucide-react";
import { Button } from "./Button";

export interface DropdownTriggerProps {
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    ariaLabel?: string;
    className?: string;
}

/** Generic dropdown trigger button used across the app. */
export function DropdownTrigger({
    label,
    isOpen,
    onToggle,
    ariaLabel = "Open menu",
    className,
}: Readonly<DropdownTriggerProps>) {
    const classes = [
        "inline-flex max-w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left transition",
        isOpen
            ? "border-primary/60 bg-primary/15 text-foreground shadow-sm"
            : "border-border/80 bg-background/75 text-foreground hover:border-primary/45 hover:bg-primary/10",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Button
            variant="unstyled"
            className={classes}
            onClick={onToggle}
            aria-label={ariaLabel}
            title={label}
        >
            <span className="truncate font-medium">{label}</span>
            <ChevronDown
                className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : "rotate-0"}`}
            />
        </Button>
    );
}
