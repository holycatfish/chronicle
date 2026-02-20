'use client'

import Image from 'next/image'
import { BookLookupResult } from '@/types/book'

interface Props {
  book: BookLookupResult
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function BookPreviewCard({ book, onConfirm, onCancel, isLoading }: Props) {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm">
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          width={80}
          height={120}
          className="object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-[120px] bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs text-center p-2">
          No cover
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
        <p className="text-sm text-gray-600">{book.author}</p>
        {book.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-3">{book.description}</p>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add to library'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 border text-sm rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
