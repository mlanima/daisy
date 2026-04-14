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
        "flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/75 px-3 py-2.5",
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
                className="relative h-6 w-11 rounded-full border border-border/80 bg-muted transition before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-background before:shadow before:transition peer-checked:border-primary/70 peer-checked:bg-primary/85 peer-checked:before:translate-x-5 peer-disabled:opacity-60"
            />
        </label>
    );
}
