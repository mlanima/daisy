import type { TextareaHTMLAttributes, ReactNode } from "react";

export interface TextareaInputProps extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    ""
> {
    label?: ReactNode;
    error?: string;
    helperText?: string;
    charCount?: number;
}

const textareaClass =
    "w-full rounded-xl border border-input/85 bg-background/70 px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 disabled:cursor-not-allowed disabled:opacity-50 resize-y";

/** Standard textarea field with optional label, error, helper text, and character count. */
export function TextareaInput({
    label,
    error,
    helperText,
    charCount,
    id,
    className,
    ...props
}: Readonly<TextareaInputProps>) {
    const combinedClass = [textareaClass, className].filter(Boolean).join(" ");

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-xs font-medium text-muted-foreground"
                    >
                        {label}
                    </label>
                )}
                {charCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                        {charCount} chars
                    </span>
                )}
            </div>
            <textarea id={id} className={combinedClass} {...props} />
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
