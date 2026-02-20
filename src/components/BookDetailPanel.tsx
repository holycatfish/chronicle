'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Book } from '@/types/book'
import { formatYear } from '@/lib/timeline'

interface Props {
  book: Book
  onClose: () => void
  onUpdate: (id: string, changes: Partial<Book>) => void
  startInEditMode?: boolean
}

export function BookDetailPanel({ book, onClose, onUpdate, startInEditMode = false }: Props) {
  const [editingEra, setEditingEra] = useState(startInEditMode)
  const [startYear, setStartYear] = useState(String(book.startYear ?? ''))
  const [endYear, setEndYear] = useState(String(book.endYear ?? ''))
  const [eraLabel, setEraLabel] = useState(book.eraLabel ?? '')

  function handleSaveEra() {
    const start = parseInt(startYear)
    const end = parseInt(endYear)
    onUpdate(book.id, {
      startYear: isNaN(start) ? null : start,
      endYear: isNaN(end) ? null : end,
      eraLabel: eraLabel || null,
      eraSource: 'manual',
      hasHistoricalEra: !isNaN(start),
    })
    setEditingEra(false)
  }

  const eraText = book.hasHistoricalEra && book.startYear !== null
    ? `${formatYear(book.startYear)}${book.endYear ? ` -- ${formatYear(book.endYear)}` : ''}`
    : 'No historical era'

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-white border-l shadow-xl z-30 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-sm truncate pr-2">{book.title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
      </div>

      <div className="p-4 flex gap-3">
        {book.coverUrl && (
          <div className="relative w-16 h-24 flex-shrink-0">
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover rounded" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{book.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
          {book.rating && (
            <p className="text-xs text-gray-500 mt-1">
              {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
            </p>
          )}
          {book.dateRead && (
            <p className="text-xs text-gray-400 mt-0.5">Read {book.dateRead}</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 border-t pt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Historical Era</span>
          <button
            onClick={() => setEditingEra(!editingEra)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {editingEra ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {!editingEra ? (
          <div>
            <p className="text-sm text-gray-900">{book.eraLabel ?? eraText}</p>
            <p className="text-xs text-gray-400">{eraText}</p>
            {book.eraSource === 'auto' && (
              <p className="text-xs text-gray-300 mt-0.5">AI-detected</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={eraLabel}
              onChange={e => setEraLabel(e.target.value)}
              placeholder="Era label (e.g. World War II)"
              className="w-full border rounded px-2 py-1 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={startYear}
                onChange={e => setStartYear(e.target.value)}
                placeholder="Start year (- for BCE)"
                className="flex-1 border rounded px-2 py-1 text-xs"
              />
              <input
                type="number"
                value={endYear}
                onChange={e => setEndYear(e.target.value)}
                placeholder="End year"
                className="flex-1 border rounded px-2 py-1 text-xs"
              />
            </div>
            <button
              onClick={handleSaveEra}
              className="w-full py-1.5 bg-gray-900 text-white text-xs rounded"
            >
              Save era
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
