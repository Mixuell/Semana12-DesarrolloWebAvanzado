import Link from 'next/link'

export function AppHeader() {
    return (
        <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <Link href="/" className="text-xl font-semibold text-zinc-950">
                    Biblioteca
                </Link>
                <nav className="flex flex-wrap gap-2 text-sm font-medium">
                    <Link className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100" href="/">
                        Autores
                    </Link>
                    <Link className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100" href="/books">
                        Libros
                    </Link>
                </nav>
            </div>
        </header>
    )
}
