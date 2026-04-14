import type { StatusTone } from "../types/feedback";

interface StatusBannerProps {
    tone: StatusTone;
    message: string;
}

const TONE_CLASS_BY_TONE: Record<StatusTone, string> = {
    error: "border-rose-300/80 bg-rose-500/10 text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/20 dark:text-rose-200",
    success:
        "border-emerald-300/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-200",
    idle: "border-border/80 bg-card/80 text-foreground/85",
};

/** Displays transient app status feedback when a message is present. */
export function StatusBanner({ tone, message }: Readonly<StatusBannerProps>) {
    if (!message) {
        return null;
    }

    const toneClass = TONE_CLASS_BY_TONE[tone];

    return (
        <div
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-sm backdrop-blur ${toneClass}`}
        >
            {message}
        </div>
    );
}
