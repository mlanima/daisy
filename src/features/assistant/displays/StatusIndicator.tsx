interface StatusIndicatorProps {
    isSending: boolean;
}

/** Shows current assistant status (Running or Ready). */
export function StatusIndicator({ isSending }: Readonly<StatusIndicatorProps>) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-sm font-medium text-muted-foreground">
            <span
                className={`h-2 w-2 rounded-full ${isSending ? "bg-amber-400" : "bg-emerald-500"}`}
            />
            {isSending ? "Running" : "Ready"}
        </div>
    );
}
