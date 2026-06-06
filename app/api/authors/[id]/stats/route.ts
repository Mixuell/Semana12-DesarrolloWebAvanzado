import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type BookForStats = {
    title: string
    publishedYear: number | null
    pages: number | null
    genre: string | null
}

function bookYear(book: BookForStats) {
    return book.publishedYear ?? Number.MAX_SAFE_INTEGER
}

function bookPages(book: BookForStats) {
    return book.pages ?? -1
}

// GET - Obtener estadisticas completas de un autor
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const author = await prisma.author.findUnique({
            where: { id },
            include: {
                books: true,
            },
        })

        if (!author) {
            return NextResponse.json(
                { error: 'Autor no encontrado' },
                { status: 404 }
            )
        }

        const books = author.books
        const booksWithYear = books.filter((book) => book.publishedYear !== null)
        const booksWithPages = books.filter((book) => book.pages !== null)
        const firstBook = booksWithYear.toSorted((a, b) => bookYear(a) - bookYear(b))[0]
        const latestBook = booksWithYear.toSorted((a, b) => bookYear(b) - bookYear(a))[0]
        const longestBook = booksWithPages.toSorted((a, b) => bookPages(b) - bookPages(a))[0]
        const shortestBook = booksWithPages.toSorted((a, b) => bookPages(a) - bookPages(b))[0]
        const averagePages = booksWithPages.length
            ? Math.round(
                booksWithPages.reduce((total, book) => total + (book.pages ?? 0), 0) /
                booksWithPages.length
            )
            : 0

        return NextResponse.json({
            authorId: author.id,
            authorName: author.name,
            totalBooks: books.length,
            firstBook: firstBook
                ? { title: firstBook.title, year: firstBook.publishedYear }
                : null,
            latestBook: latestBook
                ? { title: latestBook.title, year: latestBook.publishedYear }
                : null,
            averagePages,
            genres: Array.from(new Set(books.map((book) => book.genre).filter(Boolean))),
            longestBook: longestBook
                ? { title: longestBook.title, pages: longestBook.pages }
                : null,
            shortestBook: shortestBook
                ? { title: shortestBook.title, pages: shortestBook.pages }
                : null,
        })
    } catch {
        return NextResponse.json(
            { error: 'Error al obtener estadisticas del autor' },
            { status: 500 }
        )
    }
}
