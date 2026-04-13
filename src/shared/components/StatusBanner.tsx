import type { StatusTone } from "../types/feedback";

interface StatusBannerProps {
    tone: StatusTone;
    message: string;
}

export function StatusBanner({ tone, message }: Readonly<StatusBannerProps>) {
    if (!message) {
        return null;
    }

    return <div className={`status-banner ${tone}`}>{message}</div>;
}
