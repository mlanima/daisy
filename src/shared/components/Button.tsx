import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "unstyled" | "primary" | "ghost" | "tab";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    active?: boolean;
    danger?: boolean;
    children?: ReactNode;
}

const baseButtonClass =
    "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariantClasses: Record<
    Exclude<ButtonVariant, "unstyled">,
    string
> = {
    primary:
        "border-slate-900 bg-slate-900 text-white shadow-sm hover:border-slate-800 hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-white dark:hover:bg-white",
    ghost: "border-slate-300 bg-white/75 text-slate-700 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900",
    tab: "border-transparent bg-transparent text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-slate-100",
};

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
        variant === "tab" && active
            ? "border-slate-300 bg-white text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            : "";

    let dangerClass = "";

    if (danger) {
        dangerClass =
            variant === "primary"
                ? "border-rose-600 bg-rose-600 hover:border-rose-500 hover:bg-rose-500 dark:border-rose-500 dark:bg-rose-500"
                : "border-rose-300 text-rose-600 hover:border-rose-400 dark:border-rose-500/60 dark:text-rose-300";
    }

    const classes = [
        baseButtonClass,
        buttonVariantClasses[variant],
        activeTabClass,
        dangerClass,
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button type={type} className={classes} {...props}>
            {children}
        </button>
    );
}
