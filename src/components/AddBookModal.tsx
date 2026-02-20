'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { lookupBook } from '@/actions/lookupBook'
import { extractEras } from '@/actions/extractEras'
import { BookPreviewCard } from './BookPreviewCard'
import { Book, BookLookupResult } from '@/types/book'

interface Props {
  onAdd: (book: Book) => void
  onClose: () => void
}

export function AddBookModal({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<BookLookupResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!query.trim()) return
    setError(null)
    setIsSearching(true)

    try {
      // Check if input looks like an ISBN (10-13 digits, possibly with dashes)
      const cleanedQuery = query.replace(/[-\s]/g, '')
      const isIsbn = /^\d{10}(\d{3})?$/.test(cleanedQuery)

      const result = isIsbn
        ? await lookupBook({ isbn: cleanedQuery })
        : await lookupBook({ title: query })

      if (!result) {
        setError('Book not found. Try a different title or ISBN.')
        return
      }
      setPreview(result)
    } finally {
      setIsSearching(false)
    }
  }

  async function handleConfirm() {
    if (!preview) return
    setIsAdding(true)

    try {
      const [era] = await extractEras([{
        title: preview.title,
        author: preview.author,
        description: preview.description,
      }])

      const book: Book = {
        id: uuid(),
        ...preview,
        startYear: era?.startYear ?? null,
        endYear: era?.endYear ?? null,
        eraLabel: era?.eraLabel ?? null,
        eraSource: 'auto',
        hasHistoricalEra: era?.hasHistoricalEra ?? false,
        readingStatus: 'read',
        source: 'manual',
        addedAt: new Date().toISOString(),
      }

      onAdd(book)
      onClose()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add a book</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Title, author, or ISBN..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {preview && (
          <BookPreviewCard
            book={preview}
            onConfirm={handleConfirm}
            onCancel={() => setPreview(null)}
            isLoading={isAdding}
          />
        )}
      </div>
    </div>
  )
}
