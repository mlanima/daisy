import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
}

/** Generic card container used across assistant and settings screens. */
export function Card({ className, children, ...props }: Readonly<CardProps>) {
    const classes = ["card", className ?? ""].filter(Boolean).join(" ");

    return (
        <section className={classes} {...props}>
            {children}
        </section>
    );
}
