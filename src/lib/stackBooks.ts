import { Book } from '@/types/book'
import { yearToPixel, TIMELINE_START_YEAR, TIMELINE_END_YEAR } from './timeline'

export interface StackedBook {
  book: Book
  x: number
  width: number
  row: number
}

const CARD_WIDTH = 96   // px, fixed minimum width for book cards
const CARD_GAP = 8      // px gap between cards on the same row

export function stackBooks(books: Book[], pxPerYear: number): StackedBook[] {
  const historicalBooks = books.filter(b => b.hasHistoricalEra && b.startYear !== null)

  // Sort by start year so we assign rows left-to-right
  const sorted = [...historicalBooks].sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0))

  // rowEndX tracks the rightmost pixel used in each row (including gap)
  const rowEndX: number[] = []
  const result: StackedBook[] = []

  for (const book of sorted) {
    const x = yearToPixel(book.startYear!, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
    const endX = book.endYear && book.endYear !== book.startYear
      ? yearToPixel(book.endYear, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
      : x + CARD_WIDTH
    const width = Math.max(endX - x, CARD_WIDTH)

    // Find the first row where we don't overlap the previous card
    let row = 0
    while (rowEndX[row] !== undefined && rowEndX[row] > x) {
      row++
    }
    rowEndX[row] = x + width + CARD_GAP

    result.push({ book, x, width, row })
  }

  return result
}
