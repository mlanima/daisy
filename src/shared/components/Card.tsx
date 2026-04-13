import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
}

export function Card({ className, children, ...props }: Readonly<CardProps>) {
    const classes = ["card", className ?? ""].filter(Boolean).join(" ");

    return (
        <section className={classes} {...props}>
            {children}
        </section>
    );
}
