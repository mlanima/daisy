import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Button } from "../Button";

export interface ModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    children: ReactNode;
    onClose: () => void;
    isPending?: boolean;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-[calc(100vw-2rem)] max-w-sm",
    md: "w-[calc(100vw-2rem)] max-w-md",
    lg: "w-[calc(100vw-2rem)] max-w-lg",
};

/** Reusable modal dialog with backdrop, title, and content area. */
export function Modal({
    isOpen,
    title,
    description,
    children,
    onClose,
    isPending = false,
    size = "md",
}: Readonly<ModalProps>) {
    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-50 grid place-content-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm">
            <Button
                variant="unstyled"
                className="absolute inset-0 z-0"
                aria-label="Close modal"
                onClick={onClose}
                disabled={isPending}
            />

            <dialog
                className={`relative z-10 flex flex-col gap-4 overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-6 shadow-2xl backdrop-blur animate-[shell-enter_180ms_cubic-bezier(0.2,0.8,0.2,1)] ${sizeClasses[size]}`}
                aria-modal="true"
                aria-labelledby={`modal-title-${title}`}
            >
                <div>
                    <h2
                        id={`modal-title-${title}`}
                        className="text-2xl font-semibold tracking-tight"
                    >
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>

                {children}
            </dialog>
        </div>,
        document.body,
    );
}
