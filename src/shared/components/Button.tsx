import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "unstyled" | "primary" | "ghost" | "tab";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    active?: boolean;
    danger?: boolean;
    children?: ReactNode;
}

const baseButtonClass =
    "inline-flex h-10 items-center justify-center rounded-xl border border-transparent px-4 text-sm font-medium tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-100 disabled:saturate-80";

const buttonVariantClasses: Record<
    Exclude<ButtonVariant, "unstyled">,
    string
> = {
    primary:
        "border-primary/80 bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary))] hover:bg-primary/90 hover:shadow-[0_14px_30px_-14px_hsl(var(--primary))]",
    ghost: "border-border/70 bg-background/70 text-foreground/85 hover:border-border hover:bg-accent hover:text-accent-foreground",
    tab: "border-transparent bg-transparent text-muted-foreground hover:bg-background/75 hover:text-foreground",
};

const dangerButtonClass =
    "!border-1 hover:!border-red-500 bg-red-100 hover:bg-red-200 hover:text-red-600 text-red-500 focus-visible:ring-red-500/50";

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
            ? "border-border/80 bg-background text-foreground shadow-sm"
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
