export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        const message = data && typeof data.error === 'string'
            ? data.error
            : 'No se pudo completar la operacion'
        throw new Error(message)
    }

    return data as T
}

export function optionalNumber(value: FormDataEntryValue | null) {
    const text = String(value ?? '').trim()
    return text ? Number(text) : null
}

export function optionalText(value: FormDataEntryValue | null) {
    const text = String(value ?? '').trim()
    return text || null
}
