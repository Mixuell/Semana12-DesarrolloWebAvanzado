import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// GET - Obtener un libro especifico por ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const book = await prisma.book.findUnique({
            where: { id },
            include: {
                author: true,
            },
        })

        if (!book) {
            return NextResponse.json(
                { error: 'Libro no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(book)
    } catch {
        return NextResponse.json(
            { error: 'Error al obtener libro' },
            { status: 500 }
        )
    }
}

// PUT - Actualizar un libro
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const {
            title,
            description,
            isbn,
            publishedYear,
            genre,
            pages,
            authorId
        } = body

        if (title && title.length < 3) {
            return NextResponse.json(
                { error: 'El titulo debe tener al menos 3 caracteres' },
                { status: 400 }
            )
        }

        if (pages && parseInt(pages) < 1) {
            return NextResponse.json(
                { error: 'El numero de paginas debe ser mayor a 0' },
                { status: 400 }
            )
        }

        if (authorId) {
            const authorExists = await prisma.author.findUnique({
                where: { id: authorId }
            })

            if (!authorExists) {
                return NextResponse.json(
                    { error: 'El autor especificado no existe' },
                    { status: 404 }
                )
            }
        }

        const book = await prisma.book.update({
            where: { id },
            data: {
                title,
                description,
                isbn,
                publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
                genre,
                pages: pages ? parseInt(pages) : undefined,
                authorId,
            },
            include: {
                author: true,
            }
        })

        return NextResponse.json(book)
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            return NextResponse.json(
                { error: 'Libro no encontrado' },
                { status: 404 }
            )
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            return NextResponse.json(
                { error: 'El ISBN ya existe' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Error al actualizar libro' },
            { status: 500 }
        )
    }
}

// DELETE - Eliminar un libro
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.book.delete({
            where: { id },
        })

        return NextResponse.json({
            message: 'Libro eliminado correctamente'
        })
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            return NextResponse.json(
                { error: 'Libro no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { error: 'Error al eliminar libro' },
            { status: 500 }
        )
    }
}
