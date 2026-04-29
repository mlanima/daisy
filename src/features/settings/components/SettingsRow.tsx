import type { HTMLAttributes, ReactNode } from "react";

interface SettingsRowProps extends HTMLAttributes<HTMLDivElement> {
    label?: ReactNode;
    children: ReactNode;
}

/**
 * Small layout primitive used for rows in the settings page.
 * Ensures consistent padding, border and background (including dark-mode overrides).
 */
export function SettingsRow({
    label,
    children,
    className,
    ...props
}: Readonly<SettingsRowProps>) {
    const classes = [
        "flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-card/70 px-3 py-2.5",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes} {...props}>
            {label ? (
                <div className="text-sm text-muted-foreground">{label}</div>
            ) : null}
            <div className="ml-auto flex items-center gap-2">{children}</div>
        </div>
    );
}
