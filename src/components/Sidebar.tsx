'use client'

import { Book } from '@/types/book'

interface Props {
  books: Book[]
  onAssignEra: (book: Book) => void
}

export function Sidebar({ books, onAssignEra }: Props) {
  const nonHistorical = books.filter(b => !b.hasHistoricalEra)

  if (nonHistorical.length === 0) return null

  return (
    <div className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r overflow-y-auto z-20">
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          No historical era
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">{nonHistorical.length} books</p>
      </div>
      <ul className="divide-y">
        {nonHistorical.map(book => (
          <li key={book.id}>
            <button
              onClick={() => onAssignEra(book)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 group"
            >
              <p className="text-xs font-medium text-gray-900 truncate">{book.title}</p>
              <p className="text-xs text-gray-400 truncate">{book.author}</p>
              <p className="text-xs text-gray-300 group-hover:text-gray-400 mt-0.5">
                Click to assign era
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
