import type { Config } from "tailwindcss";

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                card: "hsl(var(--card) / <alpha-value>)",
                "card-foreground":
                    "hsl(var(--card-foreground) / <alpha-value>)",
                primary: "hsl(var(--primary) / <alpha-value>)",
                "primary-foreground":
                    "hsl(var(--primary-foreground) / <alpha-value>)",
                secondary: "hsl(var(--secondary) / <alpha-value>)",
                "secondary-foreground":
                    "hsl(var(--secondary-foreground) / <alpha-value>)",
                muted: "hsl(var(--muted) / <alpha-value>)",
                "muted-foreground":
                    "hsl(var(--muted-foreground) / <alpha-value>)",
                accent: "hsl(var(--accent) / <alpha-value>)",
                "accent-foreground":
                    "hsl(var(--accent-foreground) / <alpha-value>)",
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",
            },
            fontSize: {
                base: "var(--app-font-size)",
            },
            fontFamily: {
                sans: [
                    '"Sora"',
                    '"Segoe UI Variable"',
                    '"Trebuchet MS"',
                    "sans-serif",
                ],
                mono: ['"IBM Plex Mono"', '"Consolas"', "monospace"],
            },
            animation: {
                "shell-enter": "shell-enter 0.3s ease-out",
            },
            keyframes: {
                "shell-enter": {
                    from: {
                        opacity: "0",
                        transform: "translateY(10px)",
                    },
                    to: {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
            },
            width: {
                "quick-shell": "var(--quick-shell-width)",
            },
            minWidth: {
                "quick-shell": "var(--quick-shell-min-width)",
            },
            maxWidth: {
                "quick-shell": "var(--quick-shell-width)",
            },
        },
    },
    plugins: [],
} satisfies Config;
