import type { ReactNode } from "react";

interface AccordionItemProps {
    id: string;
    isOpen: boolean;
    onToggle: (id: string) => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
}

/** Reusable accordion item component. */
export function AccordionItem({
    id,
    isOpen,
    onToggle,
    title,
    subtitle,
    children,
}: Readonly<AccordionItemProps>) {
    return (
        <li>
            <details
                className="group rounded-2xl border border-border/75 bg-background/60 open:border-primary/65"
                open={isOpen}
            >
                <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 [::-webkit-details-marker]:hidden"
                    onClick={(event) => {
                        event.preventDefault();
                        onToggle(id);
                    }}
                >
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                            {title}
                        </p>
                        {subtitle && (
                            <p className="truncate text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground transition group-open:rotate-90">
                        ▸
                    </span>
                </summary>

                <div className="grid max-h-0 -translate-y-0.5 gap-3 overflow-hidden px-3 opacity-0 transition-all duration-200 group-open:max-h-176 group-open:translate-y-0 group-open:pb-3 group-open:opacity-100">
                    {children}
                </div>
            </details>
        </li>
    );
}
