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
        "flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white/60 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/55",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <label className={classes} htmlFor={id}>
            <span className="text-sm text-slate-700 dark:text-slate-200">
                {label}
            </span>

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
                className="relative h-6 w-11 rounded-full bg-slate-300 transition before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition peer-checked:bg-slate-900 peer-checked:before:translate-x-5 peer-disabled:opacity-60 dark:bg-slate-700 dark:peer-checked:bg-slate-100"
            />
        </label>
    );
}
