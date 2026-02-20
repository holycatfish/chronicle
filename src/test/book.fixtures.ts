import { Book } from '@/types/book'

export const bandOfBrothers: Book = {
  id: 'test-1',
  title: 'Band of Brothers',
  author: 'Stephen E. Ambrose',
  isbn: '9780743224543',
  startYear: 1942,
  endYear: 1945,
  eraLabel: 'World War II',
  eraSource: 'auto',
  hasHistoricalEra: true,
  readingStatus: 'read',
  source: 'manual',
  addedAt: '2026-01-01T00:00:00Z',
}

export const atomicHabits: Book = {
  id: 'test-2',
  title: 'Atomic Habits',
  author: 'James Clear',
  isbn: '9780735211292',
  startYear: null,
  endYear: null,
  eraLabel: null,
  eraSource: 'auto',
  hasHistoricalEra: false,
  readingStatus: 'read',
  source: 'manual',
  addedAt: '2026-01-02T00:00:00Z',
}

export const sapiens: Book = {
  id: 'test-3',
  title: 'Sapiens',
  author: 'Yuval Noah Harari',
  startYear: -300000,
  endYear: 2015,
  eraLabel: 'Human Prehistory to Present',
  eraSource: 'auto',
  hasHistoricalEra: true,
  readingStatus: 'currently-reading',
  source: 'goodreads',
  addedAt: '2026-01-03T00:00:00Z',
}
