import type { StatusTone } from "../types/feedback";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface StatusBannerProps {
    tone: StatusTone;
    message: string;
}

interface ToneVisualConfig {
    containerClass: string;
    iconClass: string;
    icon: typeof Info;
}

const TONE_VISUAL_CONFIG_BY_TONE: Record<StatusTone, ToneVisualConfig> = {
    error: {
        containerClass:
            "border-rose-300/80 bg-rose-50 text-rose-900 dark:border-rose-500/65 dark:bg-rose-950 dark:text-rose-100",
        iconClass: "text-rose-600 dark:text-rose-300",
        icon: AlertCircle,
    },
    success: {
        containerClass:
            "border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-500/65 dark:bg-emerald-950 dark:text-emerald-100",
        iconClass: "text-emerald-600 dark:text-emerald-300",
        icon: CheckCircle2,
    },
    idle: {
        containerClass: "border-border/80 bg-card text-foreground/90",
        iconClass: "text-muted-foreground",
        icon: Info,
    },
};

/** Displays transient app status feedback when a message is present. */
export function StatusBanner({ tone, message }: Readonly<StatusBannerProps>) {
    if (!message) {
        return null;
    }

    const isError = tone === "error";
    const toneConfig = TONE_VISUAL_CONFIG_BY_TONE[tone];
    const ToneIcon = toneConfig.icon;

    const content = (
        <div className="flex items-center gap-2.5">
            <ToneIcon
                aria-hidden="true"
                className={`h-4.5 w-4.5 shrink-0 ${toneConfig.iconClass}`}
            />
            <p className="text-sm font-medium leading-relaxed text-current">
                {message}
            </p>
        </div>
    );

    const bannerClass = `rounded-xl border px-3.5 py-2.5 shadow-sm ${toneConfig.containerClass}`;

    if (isError) {
        return (
            <div role="alert" aria-live="assertive" className={bannerClass}>
                {content}
            </div>
        );
    }

    return (
        <output aria-live="polite" className={bannerClass}>
            {content}
        </output>
    );
}
