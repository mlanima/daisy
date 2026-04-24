import type { InputHTMLAttributes, ReactNode } from "react";

export interface TextInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: ReactNode;
    error?: string;
    helperText?: string;
}

const inputClass =
    "w-full rounded-xl border border-input/85 bg-background/70 px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 disabled:cursor-not-allowed disabled:opacity-50";

/** Standard text input field with optional label, error, and helper text. */
export function TextInput({
    label,
    error,
    helperText,
    id,
    className,
    ...props
}: Readonly<TextInputProps>) {
    const combinedClass = [inputClass, className].filter(Boolean).join(" ");

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-medium text-muted-foreground"
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                type="text"
                className={combinedClass}
                {...props}
            />
            {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
}
