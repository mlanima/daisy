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

export function SwitchField({
    id,
    label,
    checked,
    onChange,
    className,
    ...props
}: Readonly<SwitchFieldProps>) {
    const classes = ["switch-row", className ?? ""].filter(Boolean).join(" ");

    return (
        <label className={classes} htmlFor={id}>
            <span>{label}</span>
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                {...props}
            />
        </label>
    );
}
