export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  coverUrl?: string
  description?: string

  // Era -- set by Claude, editable by user
  startYear: number | null      // negative = BCE (e.g. -44 = 44 BCE)
  endYear: number | null
  eraLabel: string | null       // "World War II", "Ancient Rome"
  eraSource: 'auto' | 'manual'
  hasHistoricalEra: boolean     // false = self-help/business, sidebar only

  // Reading metadata
  dateRead?: string
  rating?: number               // 1-5
  readingStatus: 'read' | 'currently-reading'

  // Housekeeping
  source: 'manual' | 'goodreads' | 'storygraph'
  addedAt: string
}

export interface EraResult {
  hasHistoricalEra: boolean
  startYear: number | null
  endYear: number | null
  eraLabel: string | null
}

export interface BookLookupResult {
  title: string
  author: string
  isbn?: string
  coverUrl?: string
  description?: string
}
