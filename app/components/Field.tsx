type FieldProps = {
    label: string
    name: string
    value?: string | number
    type?: string
    required?: boolean
    placeholder?: string
}

export function Field({
    label,
    name,
    value,
    type = 'text',
    required = false,
    placeholder,
}: FieldProps) {
    return (
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            {label}
            <input
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                name={name}
                defaultValue={value ?? ''}
                type={type}
                required={required}
                placeholder={placeholder}
            />
        </label>
    )
}

type TextAreaFieldProps = {
    label: string
    name: string
    value?: string | null
    placeholder?: string
}

export function TextAreaField({ label, name, value, placeholder }: TextAreaFieldProps) {
    return (
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            {label}
            <textarea
                className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                name={name}
                defaultValue={value ?? ''}
                placeholder={placeholder}
            />
        </label>
    )
}

export function SelectField({
    label,
    name,
    value,
    required = false,
    children,
}: {
    label: string
    name: string
    value?: string
    required?: boolean
    children: React.ReactNode
}) {
    return (
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            {label}
            <select
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                name={name}
                defaultValue={value ?? ''}
                required={required}
            >
                {children}
            </select>
        </label>
    )
}
