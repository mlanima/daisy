import type { StatusTone } from "../types/feedback";

interface StatusBannerProps {
    tone: StatusTone;
    message: string;
}

const TONE_CLASS_BY_TONE: Record<StatusTone, string> = {
    error: "border-rose-300/80 bg-rose-50/90 text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200",
    success:
        "border-emerald-300/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200",
    idle: "border-slate-300/80 bg-white/85 text-slate-700 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200",
};

/** Displays transient app status feedback when a message is present. */
export function StatusBanner({ tone, message }: Readonly<StatusBannerProps>) {
    if (!message) {
        return null;
    }

    const toneClass = TONE_CLASS_BY_TONE[tone];

    return (
        <div className={`rounded-xl border px-4 py-2 text-sm ${toneClass}`}>
            {message}
        </div>
    );
}
