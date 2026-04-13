import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "unstyled" | "primary" | "ghost" | "tab";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    active?: boolean;
    danger?: boolean;
    children?: ReactNode;
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
    const classes = [
        variant === "unstyled" ? "" : variant,
        active ? "active" : "",
        danger ? "danger" : "",
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
