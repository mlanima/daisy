interface StatusIndicatorProps {
    isSending: boolean;
    apiKeyPresent: boolean;
}

/** Shows current assistant status (Running or Ready). */
export function StatusIndicator({
    isSending,
    apiKeyPresent,
}: Readonly<StatusIndicatorProps>) {
    let dotClass = "bg-emerald-500";
    let label = "Ready";

    if (isSending) {
        dotClass = "bg-amber-400";
        label = "Running";
    } else if (!apiKeyPresent) {
        dotClass = "bg-rose-500";
        label = "API key missing";
    }

    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-sm font-medium text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            {label}
        </div>
    );
}
