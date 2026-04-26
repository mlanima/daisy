import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "unstyled" | "primary" | "ghost" | "tab";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    active?: boolean;
    danger?: boolean;
    children?: ReactNode;
}

const baseButtonClass =
    "inline-flex h-10 items-center justify-center rounded-xl border border-transparent px-4 text-sm font-medium tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-100 disabled:saturate-75";

const buttonVariantClasses: Record<
    Exclude<ButtonVariant, "unstyled">,
    string
> = {
    primary:
        "border-primary/70 bg-primary text-primary-foreground shadow-[0_14px_34px_-24px_hsl(var(--primary))] hover:bg-primary/92 hover:shadow-[0_18px_38px_-24px_hsl(var(--primary))]",
    ghost: "border-border/75 bg-background/60 text-foreground/88 shadow-sm hover:border-border hover:bg-accent hover:text-accent-foreground",
    tab: "border-transparent bg-transparent text-muted-foreground hover:bg-muted/75 hover:text-foreground",
};

const dangerButtonClass =
    "!border-1 border-rose-200/70 bg-rose-50/90 text-rose-600 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 focus-visible:ring-rose-500/50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:border-rose-400/40 dark:hover:bg-rose-500/16 dark:hover:text-rose-200";

function joinClasses(...values: Array<string | false | null | undefined>) {
    return values.filter(Boolean).join(" ");
}

/**
 * Shared button primitive with app-specific variants and state styles.
 */
export function Button({
    variant = "unstyled",
    active = false,
    danger = false,
    className,
    type = "button",
    children,
    ...props
}: Readonly<ButtonProps>) {
    if (variant === "unstyled") {
        return (
            <button type={type} className={className ?? ""} {...props}>
                {children}
            </button>
        );
    }

    const activeTabClass =
        !danger && variant === "tab" && active
            ? "border-border/80 bg-card text-foreground shadow-sm"
            : "";

    const classes = joinClasses(
        baseButtonClass,
        danger ? "" : buttonVariantClasses[variant],
        activeTabClass,
        danger ? dangerButtonClass : "",
        className,
    );

    return (
        <button type={type} className={classes} {...props}>
            {children}
        </button>
    );
}
