import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";

/** Lazily get the app window instance with error handling */
function getAppWindow() {
    try {
        return getCurrentWindow();
    } catch {
        return null;
    }
}

/** Styled custom title bar for the main desktop window. */
export function MainWindowTitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    const refreshMaximizedState = useCallback(async () => {
        try {
            const appWindow = getAppWindow();
            if (!appWindow) return;
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        } catch {
            // Ignore maximize-state read failures on unsupported platforms.
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let unlistenResize: (() => void) | null = null;

        const syncIfMounted = async () => {
            if (!isMounted) {
                return;
            }

            await refreshMaximizedState();
        };

        void syncIfMounted();

        const appWindow = getAppWindow();
        if (appWindow) {
            void appWindow
                .onResized(() => {
                    void syncIfMounted();
                })
                .then((unlisten) => {
                    if (!isMounted) {
                        unlisten();
                        return;
                    }

                    unlistenResize = unlisten;
                })
                .catch(() => {
                    // Ignore resize listener errors; controls still work without state sync.
                });
        }

        return () => {
            isMounted = false;
            unlistenResize?.();
        };
    }, [refreshMaximizedState]);

    const minimizeWindow = useCallback(() => {
        const appWindow = getAppWindow();
        if (!appWindow) return;
        void appWindow.minimize().catch(() => {
            // Ignore minimize failures silently.
        });
    }, []);

    const toggleMaximizeWindow = useCallback(() => {
        const appWindow = getAppWindow();
        if (!appWindow) return;
        void appWindow
            .toggleMaximize()
            .then(() => refreshMaximizedState())
            .catch(() => {
                // Ignore maximize toggle failures silently.
            });
    }, [refreshMaximizedState]);

    const closeWindow = useCallback(() => {
        const appWindow = getAppWindow();
        if (!appWindow) return;
        void appWindow.close().catch(() => {
            // Ignore close failures silently.
        });
    }, []);

    return (
        <header className="relative z-30 flex h-10 items-center justify-between border-b border-border/70 bg-card pl-2 pr-1">
            <div
                data-tauri-drag-region
                className="flex min-w-0 flex-1 items-center gap-2.5 px-2 select-none"
                title="Drag to move window"
            >
                <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]"
                />
                <span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Daisy Assistant
                </span>
            </div>

            <div className="inline-flex items-center gap-1.5">
                <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border/70 hover:bg-background/80 hover:text-foreground"
                    aria-label="Minimize window"
                    title="Minimize"
                    onClick={minimizeWindow}
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>

                <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border/70 hover:bg-background/80 hover:text-foreground"
                    aria-label={
                        isMaximized ? "Restore window" : "Maximize window"
                    }
                    title={isMaximized ? "Restore" : "Maximize"}
                    onClick={toggleMaximizeWindow}
                >
                    {isMaximized ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                    )}
                </button>

                <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-rose-300/65 hover:bg-rose-500/12 hover:text-rose-500"
                    aria-label="Close window"
                    title="Close"
                    onClick={closeWindow}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </header>
    );
}
