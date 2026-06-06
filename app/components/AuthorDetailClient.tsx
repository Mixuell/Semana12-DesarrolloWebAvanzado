'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { apiRequest, optionalNumber, optionalText } from './api'
import { AppHeader } from './AppHeader'
import { Field, TextAreaField } from './Field'
import type { Author, AuthorStats, Book } from './types'

export function AuthorDetailClient({ authorId }: { authorId: string }) {
    const [author, setAuthor] = useState<Author | null>(null)
    const [stats, setStats] = useState<AuthorStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [savingAuthor, setSavingAuthor] = useState(false)
    const [savingBook, setSavingBook] = useState(false)
    const [message, setMessage] = useState('')

    const loadAuthor = useCallback(async () => {
        setLoading(true)
        setMessage('')
        try {
            const [authorData, statsData] = await Promise.all([
                apiRequest<Author>(`/api/authors/${authorId}`),
                apiRequest<AuthorStats>(`/api/authors/${authorId}/stats`),
            ])
            setAuthor(authorData)
            setStats(statsData)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al cargar autor')
        } finally {
            setLoading(false)
        }
    }, [authorId])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadAuthor()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadAuthor])

    async function updateAuthor(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSavingAuthor(true)
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
            await apiRequest<Author>(`/api/authors/${authorId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
            await loadAuthor()
            setMessage('Autor actualizado')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al actualizar autor')
        } finally {
            setSavingAuthor(false)
        }
    }

    async function createBook(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSavingBook(true)
        setMessage('')
        const form = new FormData(event.currentTarget)
        const payload = {
            title: String(form.get('title') ?? '').trim(),
            description: optionalText(form.get('description')),
            isbn: optionalText(form.get('isbn')),
            publishedYear: optionalNumber(form.get('publishedYear')),
            genre: optionalText(form.get('genre')),
            pages: optionalNumber(form.get('pages')),
            authorId,
        }

        try {
            await apiRequest<Book>('/api/books', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            event.currentTarget.reset()
            await loadAuthor()
            setMessage('Libro agregado')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al crear libro')
        } finally {
            setSavingBook(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950">
            <AppHeader />
            <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/">
                            Volver a autores
                        </Link>
                        <h1 className="mt-2 text-3xl font-semibold">{author?.name ?? 'Detalle de autor'}</h1>
                        <p className="mt-2 text-sm text-zinc-600">{author?.email ?? 'Cargando informacion'}</p>
                    </div>
                    <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-100" href="/books">
                        Ir a libros
                    </Link>
                </div>

                {message && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        {message}
                    </p>
                )}

                {loading ? (
                    <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Cargando autor...</p>
                ) : author ? (
                    <>
                        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Stat label="Total de libros" value={stats?.totalBooks ?? 0} />
                            <Stat label="Promedio paginas" value={stats?.averagePages ?? 0} />
                            <Stat label="Generos" value={stats?.genres.length ?? 0} />
                            <Stat label="Anio nacimiento" value={author.birthYear ?? 0} />
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
                            <div className="grid gap-6">
                                <form onSubmit={updateAuthor} className="grid gap-4 rounded-md border border-zinc-200 bg-white p-5">
                                    <h2 className="text-lg font-semibold">Editar informacion</h2>
                                    <Field label="Nombre" name="name" value={author.name} required />
                                    <Field label="Email" name="email" type="email" value={author.email} required />
                                    <Field label="Nacionalidad" name="nationality" value={author.nationality ?? ''} />
                                    <Field label="Anio de nacimiento" name="birthYear" type="number" value={author.birthYear ?? ''} />
                                    <TextAreaField label="Biografia" name="bio" value={author.bio} />
                                    <button className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={savingAuthor} type="submit">
                                        {savingAuthor ? 'Guardando...' : 'Guardar autor'}
                                    </button>
                                </form>

                                <form onSubmit={createBook} className="grid gap-4 rounded-md border border-zinc-200 bg-white p-5">
                                    <h2 className="text-lg font-semibold">Agregar libro</h2>
                                    <Field label="Titulo" name="title" required />
                                    <TextAreaField label="Descripcion" name="description" />
                                    <Field label="ISBN" name="isbn" />
                                    <Field label="Anio publicado" name="publishedYear" type="number" />
                                    <Field label="Genero" name="genre" />
                                    <Field label="Paginas" name="pages" type="number" />
                                    <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60" disabled={savingBook} type="submit">
                                        {savingBook ? 'Agregando...' : 'Agregar libro'}
                                    </button>
                                </form>
                            </div>

                            <div className="grid gap-6">
                                <section className="rounded-md border border-zinc-200 bg-white p-5">
                                    <h2 className="text-lg font-semibold">Estadisticas del autor</h2>
                                    <div className="mt-4 grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
                                        <Info label="Primer libro" value={stats?.firstBook ? `${stats.firstBook.title} (${stats.firstBook.year ?? 'sin anio'})` : 'Sin datos'} />
                                        <Info label="Ultimo libro" value={stats?.latestBook ? `${stats.latestBook.title} (${stats.latestBook.year ?? 'sin anio'})` : 'Sin datos'} />
                                        <Info label="Libro mas largo" value={stats?.longestBook ? `${stats.longestBook.title} (${stats.longestBook.pages ?? 0} pags.)` : 'Sin datos'} />
                                        <Info label="Libro mas corto" value={stats?.shortestBook ? `${stats.shortestBook.title} (${stats.shortestBook.pages ?? 0} pags.)` : 'Sin datos'} />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(stats?.genres.length ? stats.genres : ['Sin generos']).map((genre) => (
                                            <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800" key={genre}>
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="grid gap-3">
                                    <h2 className="text-lg font-semibold">Libros del autor</h2>
                                    {author.books.length === 0 ? (
                                        <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Este autor aun no tiene libros.</p>
                                    ) : (
                                        author.books.map((book) => (
                                            <article className="rounded-md border border-zinc-200 bg-white p-4" key={book.id}>
                                                <h3 className="font-semibold">{book.title}</h3>
                                                <p className="mt-1 text-sm text-zinc-600">{book.genre ?? 'Sin genero'} · {book.publishedYear ?? 'Sin anio'} · {book.pages ?? 0} paginas</p>
                                                <p className="mt-2 text-sm text-zinc-600">{book.description ?? 'Sin descripcion'}</p>
                                            </article>
                                        ))
                                    )}
                                </section>
                            </div>
                        </section>
                    </>
                ) : (
                    <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Autor no encontrado.</p>
                )}
            </main>
        </div>
    )
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-zinc-200 bg-white px-5 py-4">
            <p className="text-sm font-medium text-zinc-600">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
    )
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-zinc-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 font-medium text-zinc-950">{value}</p>
        </div>
    )
}
