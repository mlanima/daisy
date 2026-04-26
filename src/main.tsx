import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

interface RootErrorBoundaryState {
    hasError: boolean;
    message: string;
    stack: string;
}

class RootErrorBoundary extends React.Component<
    React.PropsWithChildren,
    RootErrorBoundaryState
> {
    state: RootErrorBoundaryState = {
        hasError: false,
        message: "",
        stack: "",
    };

    static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
        const message = error instanceof Error ? error.message : String(error);

        return {
            hasError: true,
            message,
            stack: "",
        };
    }

    componentDidCatch(error: unknown): void {
        const stack = error instanceof Error ? error.stack || "" : "";

        this.setState((previous) => ({
            ...previous,
            stack,
        }));
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <main
                style={{
                    fontFamily: "Segoe UI, sans-serif",
                    minHeight: "100vh",
                    padding: "24px",
                    background: "#111827",
                    color: "#f9fafb",
                }}
            >
                <h1 style={{ margin: 0, fontSize: 28 }}>
                    App crashed during render
                </h1>
                <p style={{ marginTop: 12, color: "#fca5a5" }}>
                    {this.state.message}
                </p>
                {this.state.stack ? (
                    <pre
                        style={{
                            marginTop: 16,
                            whiteSpace: "pre-wrap",
                            background: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 12,
                            lineHeight: 1.4,
                            overflow: "auto",
                        }}
                    >
                        {this.state.stack}
                    </pre>
                ) : null}
            </main>
        );
    }
}

function showGlobalRuntimeError(error: unknown): void {
    const root = document.getElementById("root");

    if (!root) {
        return;
    }

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack || "" : "";

    root.innerHTML = `
        <main style="font-family: Segoe UI, sans-serif; min-height: 100vh; padding: 24px; background: #111827; color: #f9fafb;">
            <h1 style="margin: 0; font-size: 28px;">Runtime error</h1>
            <p style="margin-top: 12px; color: #fca5a5;">${message.replace(/</g, "&lt;")}</p>
            ${stack ? `<pre style="margin-top: 16px; white-space: pre-wrap; background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.4; overflow: auto;">${stack.replace(/</g, "&lt;")}</pre>` : ""}
        </main>
    `;
}

globalThis.addEventListener("error", (event) => {
    showGlobalRuntimeError(event.error ?? event.message);
});

globalThis.addEventListener("unhandledrejection", (event) => {
    showGlobalRuntimeError(event.reason);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <RootErrorBoundary>
            <App />
        </RootErrorBoundary>
    </React.StrictMode>,
);
