import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
}

/** Generic card container used across assistant and settings screens. */
export function Card({ className, children, ...props }: Readonly<CardProps>) {
    const classes = [
        "flex min-h-0 flex-col gap-4 rounded-3xl border border-border/75 bg-card p-4 shadow-[0_24px_60px_-42px_hsl(var(--foreground))] dark:shadow-none md:p-5",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <section className={classes} {...props}>
            {children}
        </section>
    );
}
