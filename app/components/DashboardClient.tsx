'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest, optionalNumber, optionalText } from './api'
import { AppHeader } from './AppHeader'
import { Field, TextAreaField } from './Field'
import type { Author } from './types'

export function DashboardClient() {
    const [authors, setAuthors] = useState<Author[]>([])
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const totals = useMemo(() => {
        const totalBooks = authors.reduce((total, author) => total + (author._count?.books ?? author.books.length), 0)
        return {
            authors: authors.length,
            books: totalBooks,
            withBooks: authors.filter((author) => (author._count?.books ?? author.books.length) > 0).length,
        }
    }, [authors])

    const loadAuthors = useCallback(async () => {
        setLoading(true)
        setMessage('')
        try {
            const data = await apiRequest<Author[]>('/api/authors')
            setAuthors(data)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al cargar autores')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadAuthors()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadAuthors])

    async function saveAuthor(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        const form = new FormData(event.currentTarget)
        const payload = {
            name: String(form.get('name') ?? '').trim(),
            email: String(form.get('email') ?? '').trim(),
            nationality: optionalText(form.get('nationality')),
            birthYear: optionalNumber(form.get('birthYear')),
            bio: optionalText(form.get('bio')),
        }

        try {
            if (editingAuthor) {
                await apiRequest<Author>(`/api/authors/${editingAuthor.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                setEditingAuthor(null)
                setMessage('Autor actualizado')
            } else {
                await apiRequest<Author>('/api/authors', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                event.currentTarget.reset()
                setMessage('Autor creado')
            }
            await loadAuthors()
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al guardar autor')
        } finally {
            setSaving(false)
        }
    }

    async function deleteAuthor(author: Author) {
        const accepted = window.confirm(`Eliminar a ${author.name}? Tambien se eliminaran sus libros.`)
        if (!accepted) return

        setMessage('')
        try {
            await apiRequest(`/api/authors/${author.id}`, { method: 'DELETE' })
            await loadAuthors()
            setMessage('Autor eliminado')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al eliminar autor')
        }
    }

    const authorToEdit = editingAuthor

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950">
            <AppHeader />
            <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
                <section className="grid gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Sistema de biblioteca</p>
                        <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Autores y resumen general</h1>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Stat label="Autores" value={totals.authors} />
                        <Stat label="Libros" value={totals.books} />
                        <Stat label="Autores con libros" value={totals.withBooks} />
                    </div>
                </section>

                {message && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        {message}
                    </p>
                )}

                <section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
                    <form onSubmit={saveAuthor} className="grid gap-4 rounded-md border border-zinc-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">{authorToEdit ? 'Editar autor' : 'Crear autor'}</h2>
                            {authorToEdit && (
                                <button
                                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                    type="button"
                                    onClick={() => setEditingAuthor(null)}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                        <Field label="Nombre" name="name" value={authorToEdit?.name} required />
                        <Field label="Email" name="email" type="email" value={authorToEdit?.email} required />
                        <Field label="Nacionalidad" name="nationality" value={authorToEdit?.nationality ?? ''} />
                        <Field label="Anio de nacimiento" name="birthYear" type="number" value={authorToEdit?.birthYear ?? ''} />
                        <TextAreaField label="Biografia" name="bio" value={authorToEdit?.bio} />
                        <button
                            className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                            disabled={saving}
                            type="submit"
                        >
                            {saving ? 'Guardando...' : authorToEdit ? 'Guardar cambios' : 'Crear autor'}
                        </button>
                    </form>

                    <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">Autores registrados</h2>
                            <button
                                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                type="button"
                                onClick={() => void loadAuthors()}
                            >
                                Actualizar
                            </button>
                        </div>
                        {loading ? (
                            <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Cargando autores...</p>
                        ) : authors.length === 0 ? (
                            <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">No hay autores registrados.</p>
                        ) : (
                            <div className="grid gap-3">
                                {authors.map((author) => (
                                    <article key={author.id} className="rounded-md border border-zinc-200 bg-white p-4">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-semibold text-zinc-950">{author.name}</h3>
                                                <p className="break-all text-sm text-zinc-600">{author.email}</p>
                                                <p className="mt-2 text-sm text-zinc-600">
                                                    {author.nationality ?? 'Sin nacionalidad'} · {author.birthYear ?? 'Sin anio'} · {author._count?.books ?? author.books.length} libros
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Link className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800" href={`/authors/${author.id}`}>
                                                    Ver detalle
                                                </Link>
                                                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100" type="button" onClick={() => setEditingAuthor(author)}>
                                                    Editar
                                                </button>
                                                <button className="rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" type="button" onClick={() => void deleteAuthor(author)}>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-zinc-200 bg-white px-5 py-4">
            <p className="text-sm font-medium text-zinc-600">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
        </div>
    )
}
