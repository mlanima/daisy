import type { InputHTMLAttributes, ReactNode } from "react";

interface SwitchFieldProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
> {
    id: string;
    label: ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/** Labeled checkbox control normalized to a boolean `onChange` signature. */
export function SwitchField({
    id,
    label,
    checked,
    onChange,
    className,
    ...props
}: Readonly<SwitchFieldProps>) {
    const classes = [
        "flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-card/70 px-3 py-2.5 shadow-sm backdrop-blur",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <label className={classes} htmlFor={id}>
            <span className="text-sm text-foreground/90">{label}</span>

            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="peer sr-only"
                {...props}
            />

            <span
                aria-hidden
                className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border/80 bg-muted/80 p-0.5 transition-colors duration-200 peer-checked:border-primary/65 peer-checked:bg-primary/88 peer-disabled:opacity-60 peer-checked:[&>span]:translate-x-5"
            >
                <span className="h-5 w-5 rounded-full bg-background shadow-md ring-1 ring-black/5 transition-transform duration-200" />
            </span>
        </label>
    );
}
