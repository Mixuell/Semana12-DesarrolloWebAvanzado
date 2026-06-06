import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const SORT_FIELDS = ['title', 'publishedYear', 'createdAt'] as const
const ORDERS = ['asc', 'desc'] as const

type SortField = (typeof SORT_FIELDS)[number]
type SortOrder = (typeof ORDERS)[number]

function getNumberParam(value: string | null, fallback: number, max?: number) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) return fallback
    return max ? Math.min(parsed, max) : parsed
}

function getSortField(value: string | null): SortField {
    return SORT_FIELDS.includes(value as SortField) ? (value as SortField) : 'createdAt'
}

function getOrder(value: string | null): SortOrder {
    return ORDERS.includes(value as SortOrder) ? (value as SortOrder) : 'desc'
}

// GET - Buscar libros con filtros, ordenamiento y paginacion
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.trim()
        const genre = searchParams.get('genre')?.trim()
        const authorName = searchParams.get('authorName')?.trim()
        const page = getNumberParam(searchParams.get('page'), 1)
        const limit = getNumberParam(searchParams.get('limit'), 10, 50)
        const sortBy = getSortField(searchParams.get('sortBy'))
        const order = getOrder(searchParams.get('order'))
        const skip = (page - 1) * limit

        const where: Prisma.BookWhereInput = {
            ...(search && {
                title: {
                    contains: search,
                    mode: 'insensitive',
                },
            }),
            ...(genre && { genre }),
            ...(authorName && {
                author: {
                    name: {
                        contains: authorName,
                        mode: 'insensitive',
                    },
                },
            }),
        }

        const [books, total] = await prisma.$transaction([
            prisma.book.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    }
                },
                orderBy: {
                    [sortBy]: order,
                },
                skip,
                take: limit,
            }),
            prisma.book.count({ where }),
        ])

        const totalPages = Math.ceil(total / limit)

        return NextResponse.json({
            data: books,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            }
        })
    } catch {
        return NextResponse.json(
            { error: 'Error al buscar libros' },
            { status: 500 }
        )
    }
}
