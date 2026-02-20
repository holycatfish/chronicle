import Papa from 'papaparse'
import { v4 as uuid } from 'uuid'
import { Book } from '@/types/book'

type RawRow = Record<string, string>

function cleanIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  // Goodreads wraps ISBNs in ="..." format (Excel CSV artifact to prevent number truncation)
  return raw.replace(/^=?"?|"?$/g, '').trim() || undefined
}

function parseRating(raw: string | undefined): number | undefined {
  const n = Number(raw)
  return n >= 1 && n <= 5 ? Math.round(n) : undefined
}

function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  // Goodreads: "2024/01/15" -> "2024-01-15"
  // StoryGraph: "2024-01-01 to 2024-01-15" -> take end date
  const cleaned = raw.includes(' to ')
    ? raw.split(' to ')[1]
    : raw.replace(/\//g, '-')
  return cleaned.trim() || undefined
}

function baseBook(overrides: Partial<Book>): Book {
  return {
    id: uuid(),
    title: '',
    author: '',
    startYear: null,
    endYear: null,
    eraLabel: null,
    eraSource: 'auto',
    hasHistoricalEra: false,
    readingStatus: 'read',
    source: 'manual',
    addedAt: new Date().toISOString(),
    ...overrides,
  }
}

export function parseGoodreadsCsv(csvText: string): Book[] {
  const { data } = Papa.parse<RawRow>(csvText, { header: true, skipEmptyLines: true })

  return data
    .filter(row => {
      const shelf = row['Exclusive Shelf']?.trim()
      return shelf === 'read' || shelf === 'currently-reading'
    })
    .map(row => baseBook({
      title: row['Title']?.trim() ?? '',
      author: row['Author']?.trim() ?? '',
      isbn: cleanIsbn(row['ISBN13']) ?? cleanIsbn(row['ISBN']),
      rating: parseRating(row['My Rating']),
      dateRead: parseDate(row['Date Read']),
      readingStatus: row['Exclusive Shelf']?.trim() === 'currently-reading'
        ? 'currently-reading'
        : 'read',
      source: 'goodreads',
    }))
    .filter(b => b.title)
}

export function parseStorygraphCsv(csvText: string): Book[] {
  const { data } = Papa.parse<RawRow>(csvText, { header: true, skipEmptyLines: true })

  return data
    .filter(row => {
      const status = row['Read Status']?.trim()
      return status === 'read' || status === 'currently-reading'
    })
    .map(row => baseBook({
      title: row['Title']?.trim() ?? '',
      author: row['Authors']?.trim() ?? '',
      isbn: cleanIsbn(row['ISBN/UID']),
      rating: parseRating(row['Star Rating']),
      dateRead: parseDate(row['Read Dates']),
      readingStatus: row['Read Status']?.trim() === 'currently-reading'
        ? 'currently-reading'
        : 'read',
      source: 'storygraph',
    }))
    .filter(b => b.title)
}
