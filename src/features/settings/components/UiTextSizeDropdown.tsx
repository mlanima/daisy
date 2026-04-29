import { useEffect, useRef, useState } from "react";
import { DropdownTrigger } from "../../../shared/components";
import { WINDOW_SIZE_LABELS } from "../windowSizeLabels";
import type { AppSettings } from "../../../shared/types/appState";

interface UiTextSizeDropdownProps {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
}

export function UiTextSizeDropdown({
    settings,
    onUpdateSettings,
}: Readonly<UiTextSizeDropdownProps>) {
    const anchorRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const onDocClick = (event: MouseEvent) => {
            const el = anchorRef.current;
            if (!el) return;
            if (event.target instanceof Node && !el.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    return (
        <div className="relative w-fit" ref={anchorRef}>
            <DropdownTrigger
                label={WINDOW_SIZE_LABELS[settings.windowSize]}
                isOpen={isOpen}
                onToggle={() => setIsOpen((s) => !s)}
                ariaLabel="Change UI text size"
                className="ml-auto"
            />

            {isOpen ? (
                <div className="absolute right-0 mt-2 w-44 rounded-md border border-border/70 bg-card/95 shadow-lg z-50 overflow-hidden">
                    {Object.entries(WINDOW_SIZE_LABELS).map(
                        ([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-background/50"
                                onClick={() => {
                                    onUpdateSettings({
                                        ...settings,
                                        windowSize: value as any,
                                    });
                                    setIsOpen(false);
                                }}
                            >
                                {label}
                            </button>
                        ),
                    )}
                </div>
            ) : null}
        </div>
    );
}
