'use client'

import Image from 'next/image'
import { Book } from '@/types/book'

interface Props {
  book: Book
  width: number
  onClick: (book: Book) => void
  style?: React.CSSProperties
}

const CARD_HEIGHT = 120

export function BookCard({ book, width, onClick, style }: Props) {
  const isCurrentlyReading = book.readingStatus === 'currently-reading'

  return (
    <button
      onClick={() => onClick(book)}
      className={[
        'flex flex-col items-center rounded-lg overflow-hidden bg-white shadow-sm',
        'border-2 transition-transform hover:scale-105 hover:shadow-md hover:z-10',
        isCurrentlyReading
          ? 'border-amber-400 animate-pulse-slow'
          : 'border-transparent hover:border-gray-200',
      ].join(' ')}
      style={{ width, height: CARD_HEIGHT, position: 'absolute', ...style }}
      title={book.title}
    >
      {book.coverUrl ? (
        <div className="relative w-full h-full">
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center p-2">
          <span className="text-xs text-gray-600 text-center line-clamp-4 leading-tight">
            {book.title}
          </span>
        </div>
      )}
      {isCurrentlyReading && (
        <span className="absolute top-1 right-1 text-xs bg-amber-400 rounded px-1">
          📖
        </span>
      )}
    </button>
  )
}
