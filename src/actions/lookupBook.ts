'use server'

import { BookLookupResult } from '@/types/book'

type LookupParams =
  | { isbn: string; title?: never; author?: never }
  | { isbn?: never; title: string; author?: string }

export async function lookupBook(params: LookupParams): Promise<BookLookupResult | null> {
  try {
    const isbn = params.isbn
    if (isbn) {
      return await lookupByIsbn(isbn)
    }
    // TypeScript doesn't narrow `never?` unions through if-returns, so assert here
    return await lookupByTitle(params.title!, params.author)
  } catch {
    return null
  }
}

async function lookupByIsbn(isbn: string): Promise<BookLookupResult | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`
  const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
  const data = await res.json() as Record<string, unknown>

  const key = `ISBN:${isbn}`
  const book = data[key] as Record<string, unknown> | undefined
  if (!book) return null

  const details = book.details as Record<string, unknown> ?? book

  return {
    title: (book.title ?? details.title) as string,
    author: extractAuthors(book.authors as Array<{name: string}> | undefined),
    isbn,
    coverUrl: extractCover(book.cover as Record<string, string> | undefined),
    description: extractDescription(book),
  }
}

async function lookupByTitle(title: string, author?: string): Promise<BookLookupResult | null> {
  const q = [title, author].filter(Boolean).join(' ')
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1&fields=title,author_name,isbn,cover_i,first_sentence,subject`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  const data = await res.json() as { docs?: Array<Record<string, unknown>> }

  const doc = data.docs?.[0]
  if (!doc) return null

  const isbn = (doc.isbn as string[] | undefined)?.[0]
  const coverId = doc.cover_i as number | undefined

  return {
    title: doc.title as string,
    author: (doc.author_name as string[] | undefined)?.[0] ?? 'Unknown',
    isbn,
    coverUrl: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : undefined,
    description: (doc.first_sentence as { value: string } | undefined)?.value,
  }
}

function extractAuthors(authors: Array<{name: string}> | undefined): string {
  return authors?.map(a => a.name).join(', ') ?? 'Unknown'
}

function extractCover(cover: Record<string, string> | undefined): string | undefined {
  return cover?.medium ?? cover?.large ?? cover?.small
}

function extractDescription(book: Record<string, unknown>): string | undefined {
  const excerpts = book.excerpts as Array<{text: string}> | undefined
  return excerpts?.[0]?.text
}
