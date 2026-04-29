import type { ReactNode } from "react";

interface AssistantLayoutProps {
    children: ReactNode;
}

/** Main assistant page layout wrapper (two-section layout). */
export function AssistantLayout({ children }: Readonly<AssistantLayoutProps>) {
    return (
        <div className="grid h-full min-h-0 gap-3">
            <section className="grid min-h-0 gap-3 grid-rows-[auto_minmax(0,1fr)]">
                {children}
            </section>
        </div>
    );
}
