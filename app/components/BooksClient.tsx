'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest, optionalNumber, optionalText } from './api'
import { AppHeader } from './AppHeader'
import { Field, SelectField, TextAreaField } from './Field'
import type { Author, Book, SearchResponse } from './types'

const INITIAL_SEARCH: SearchResponse = {
    data: [],
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    },
}

export function BooksClient() {
    const [authors, setAuthors] = useState<Author[]>([])
    const [books, setBooks] = useState<SearchResponse>(INITIAL_SEARCH)
    const [editingBook, setEditingBook] = useState<Book | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [filters, setFilters] = useState({
        search: '',
        genre: '',
        authorName: '',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
    })

    const genres = useMemo(() => {
        const values = books.data.map((book) => book.genre).filter(Boolean) as string[]
        return Array.from(new Set(values)).sort()
    }, [books.data])

    const loadAuthors = useCallback(async () => {
        const data = await apiRequest<Author[]>('/api/authors')
        setAuthors(data)
    }, [])

    const searchBooks = useCallback(async (nextFilters = filters) => {
        setLoading(true)
        setMessage('')
        const params = new URLSearchParams({
            page: String(nextFilters.page),
            limit: String(nextFilters.limit),
            sortBy: nextFilters.sortBy,
            order: nextFilters.order,
        })

        if (nextFilters.search) params.set('search', nextFilters.search)
        if (nextFilters.genre) params.set('genre', nextFilters.genre)
        if (nextFilters.authorName) params.set('authorName', nextFilters.authorName)

        try {
            const data = await apiRequest<SearchResponse>(`/api/books/search?${params.toString()}`)
            setBooks(data)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al buscar libros')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadAuthors().catch((error) => {
                setMessage(error instanceof Error ? error.message : 'Error al cargar autores')
            })
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadAuthors])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void searchBooks()
        }, 350)

        return () => window.clearTimeout(timer)
    }, [searchBooks])

    function updateFilter(name: keyof typeof filters, value: string | number) {
        setFilters((current) => ({
            ...current,
            [name]: value,
            ...(name !== 'page' ? { page: 1 } : {}),
        }))
    }

    async function saveBook(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        const form = new FormData(event.currentTarget)
        const payload = {
            title: String(form.get('title') ?? '').trim(),
            description: optionalText(form.get('description')),
            isbn: optionalText(form.get('isbn')),
            publishedYear: optionalNumber(form.get('publishedYear')),
            genre: optionalText(form.get('genre')),
            pages: optionalNumber(form.get('pages')),
            authorId: String(form.get('authorId') ?? '').trim(),
        }

        try {
            if (editingBook) {
                await apiRequest<Book>(`/api/books/${editingBook.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                setEditingBook(null)
                setMessage('Libro actualizado')
            } else {
                await apiRequest<Book>('/api/books', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                event.currentTarget.reset()
                setMessage('Libro creado')
            }
            await searchBooks(filters)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al guardar libro')
        } finally {
            setSaving(false)
        }
    }

    async function deleteBook(book: Book) {
        const accepted = window.confirm(`Eliminar "${book.title}"?`)
        if (!accepted) return

        setMessage('')
        try {
            await apiRequest(`/api/books/${book.id}`, { method: 'DELETE' })
            await searchBooks(filters)
            setMessage('Libro eliminado')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error al eliminar libro')
        }
    }

    const formBook = editingBook

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950">
            <AppHeader />
            <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
                <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Catalogo</p>
                        <h1 className="mt-2 text-3xl font-semibold">Busqueda y gestion de libros</h1>
                        <p className="mt-2 text-sm text-zinc-600">{books.pagination.total} resultados encontrados</p>
                    </div>
                    <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-100" href="/">
                        Gestionar autores
                    </Link>
                </section>

                {message && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        {message}
                    </p>
                )}

                <section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
                    <form onSubmit={saveBook} className="grid gap-4 rounded-md border border-zinc-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">{formBook ? 'Editar libro' : 'Crear libro'}</h2>
                            {formBook && (
                                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100" type="button" onClick={() => setEditingBook(null)}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                        <Field label="Titulo" name="title" value={formBook?.title} required />
                        <TextAreaField label="Descripcion" name="description" value={formBook?.description} />
                        <Field label="ISBN" name="isbn" value={formBook?.isbn ?? ''} />
                        <Field label="Anio publicado" name="publishedYear" type="number" value={formBook?.publishedYear ?? ''} />
                        <Field label="Genero" name="genre" value={formBook?.genre ?? ''} />
                        <Field label="Paginas" name="pages" type="number" value={formBook?.pages ?? ''} />
                        <SelectField label="Autor" name="authorId" value={formBook?.authorId} required>
                            <option value="">Seleccionar autor</option>
                            {authors.map((author) => (
                                <option key={author.id} value={author.id}>
                                    {author.name}
                                </option>
                            ))}
                        </SelectField>
                        <button className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={saving} type="submit">
                            {saving ? 'Guardando...' : formBook ? 'Guardar cambios' : 'Crear libro'}
                        </button>
                    </form>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
                            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                                Buscar
                                <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Titulo" />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                                Genero
                                <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" value={filters.genre} onChange={(event) => updateFilter('genre', event.target.value)}>
                                    <option value="">Todos</option>
                                    {genres.map((genre) => (
                                        <option key={genre} value={genre}>{genre}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                                Autor
                                <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" value={filters.authorName} onChange={(event) => updateFilter('authorName', event.target.value)}>
                                    <option value="">Todos</option>
                                    {authors.map((author) => (
                                        <option key={author.id} value={author.name}>{author.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                                Orden
                                <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" value={`${filters.sortBy}:${filters.order}`} onChange={(event) => {
                                    const [sortBy, order] = event.target.value.split(':')
                                    setFilters((current) => ({ ...current, sortBy, order, page: 1 }))
                                }}>
                                    <option value="createdAt:desc">Recientes primero</option>
                                    <option value="createdAt:asc">Antiguos primero</option>
                                    <option value="title:asc">Titulo A-Z</option>
                                    <option value="title:desc">Titulo Z-A</option>
                                    <option value="publishedYear:desc">Anio mayor</option>
                                    <option value="publishedYear:asc">Anio menor</option>
                                </select>
                            </label>
                        </div>

                        {loading ? (
                            <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Buscando libros...</p>
                        ) : books.data.length === 0 ? (
                            <p className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">No se encontraron libros.</p>
                        ) : (
                            <div className="grid gap-3">
                                {books.data.map((book) => (
                                    <article key={book.id} className="rounded-md border border-zinc-200 bg-white p-4">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-semibold">{book.title}</h3>
                                                <p className="mt-1 text-sm text-zinc-600">{book.author?.name ?? 'Sin autor'} · {book.genre ?? 'Sin genero'} · {book.publishedYear ?? 'Sin anio'}</p>
                                                <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{book.description ?? 'Sin descripcion'}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {book.author?.id && (
                                                    <Link className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800" href={`/authors/${book.author.id}`}>
                                                        Autor
                                                    </Link>
                                                )}
                                                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100" type="button" onClick={() => setEditingBook(book)}>
                                                    Editar
                                                </button>
                                                <button className="rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" type="button" onClick={() => void deleteBook(book)}>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-zinc-600">
                                Pagina {books.pagination.page} de {Math.max(books.pagination.totalPages, 1)}
                            </p>
                            <div className="flex gap-2">
                                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50" disabled={!books.pagination.hasPrev} type="button" onClick={() => updateFilter('page', filters.page - 1)}>
                                    Anterior
                                </button>
                                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50" disabled={!books.pagination.hasNext} type="button" onClick={() => updateFilter('page', filters.page + 1)}>
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
