import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
}

/** Generic card container used across assistant and settings screens. */
export function Card({ className, children, ...props }: Readonly<CardProps>) {
    const classes = [
        "flex min-h-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm md:p-5 dark:border-slate-700/70 dark:bg-slate-900/70",
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
