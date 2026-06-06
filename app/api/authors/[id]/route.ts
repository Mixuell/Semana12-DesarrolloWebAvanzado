import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener un autor por ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const author = await prisma.author.findUnique({
            where: { id },
            include: { books: true },
        })

        if (!author) {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }

        return NextResponse.json(author)
    } catch {
        return NextResponse.json({ error: 'Error al obtener autor' }, { status: 500 })
    }
}

// PUT - Actualizar un autor
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, email, nationality, birthYear, bio } = body

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
            }
        }

        const author = await prisma.author.update({
            where: { id },
            data: {
                name,
                email,
                nationality,
                birthYear: birthYear ? parseInt(birthYear) : undefined,
                bio,
            },
            include: { books: true },
        })

        return NextResponse.json(author)
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            return NextResponse.json({ error: 'El email ya esta registrado' }, { status: 409 })
        }

        return NextResponse.json({ error: 'Error al actualizar autor' }, { status: 500 })
    }
}

// DELETE - Eliminar un autor
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.author.delete({ where: { id } })
        return NextResponse.json({ message: 'Autor eliminado correctamente' })
    } catch (error: unknown) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
        }

        return NextResponse.json({ error: 'Error al eliminar autor' }, { status: 500 })
    }
}
