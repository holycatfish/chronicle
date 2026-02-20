# Chronicle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Build a Next.js web app where users import their non-fiction book libraries and see them plotted on an interactive horizontal scrolling timeline based on the historical era each book covers.

**Architecture:** Next.js 14+ App Router (TypeScript + Tailwind). All book data stored in localStorage. Two server actions handle external calls: `lookupBook` (Open Library API) and `extractEras` (claude-agent-sdk locally, direct Anthropic SDK on Vercel). No database, no auth.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, `@anthropic-ai/claude-agent-sdk`, `@anthropic-ai/sdk`, Open Library API (free, no key), Vitest + Testing Library, Vercel

---

## Phase 1: Project Foundation

---

### Task 1: Scaffold the project

**Files:**
- Create: `/Users/michaelwekall/projects/chronicle/` (already exists)

**Step 1: Scaffold Next.js inside the existing directory**

```bash
cd /Users/michaelwekall/projects/chronicle
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

When prompted, accept all defaults. The `.` installs into the current directory.

**Step 2: Install dependencies**

```bash
npm install @anthropic-ai/claude-agent-sdk @anthropic-ai/sdk uuid papaparse
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom @types/uuid @types/papaparse
```

- `uuid` -- generates book IDs
- `papaparse` -- CSV parsing (Goodreads / StoryGraph)
- `vitest` + Testing Library -- unit tests

**Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

**Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 5: Verify scaffold**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Vitest"
```

---

### Task 2: Types and constants

**Files:**
- Create: `src/types/book.ts`
- Create: `src/lib/constants.ts`
- Create: `src/test/book.fixtures.ts`

**Step 1: Write the Book type**

`src/types/book.ts`:

```typescript
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
```

**Step 2: Write constants**

`src/lib/constants.ts`:

```typescript
export const STORAGE_KEY = 'chronicle-books'

// Timeline bounds (BCE years are negative)
export const TIMELINE_START_YEAR = -3000   // 3000 BCE
export const TIMELINE_END_YEAR = new Date().getFullYear()

// Era bands shown as background regions
export const ERA_BANDS = [
  { label: 'Ancient',       start: -3000, end: -500,  color: '#fef3c7' },
  { label: 'Classical',     start: -500,  end:  500,  color: '#ede9fe' },
  { label: 'Medieval',      start:  500,  end: 1400,  color: '#d1fae5' },
  { label: 'Renaissance',   start: 1400,  end: 1700,  color: '#dbeafe' },
  { label: 'Industrial',    start: 1700,  end: 1900,  color: '#fce7f3' },
  { label: 'Modern',        start: 1900,  end: 1945,  color: '#e0f2fe' },
  { label: 'Contemporary',  start: 1945,  end: TIMELINE_END_YEAR, color: '#f0fdf4' },
] as const

// Pixels per year at each zoom level
export const ZOOM_LEVELS = {
  century: 0.8,   // zoomed out -- ~4000px wide for full timeline
  decade:  8,     // zoomed in -- ~40000px wide
} as const

export const MAX_ERA_BATCH_SIZE = 15
```

**Step 3: Write test fixtures**

`src/test/book.fixtures.ts`:

```typescript
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
```

**Step 4: Commit**

```bash
git add src/types/book.ts src/lib/constants.ts src/test/book.fixtures.ts
git commit -m "feat: add Book types, era constants, and test fixtures"
```

---

### Task 3: useLibrary hook (localStorage CRUD)

**Files:**
- Create: `src/hooks/useLibrary.ts`
- Create: `src/hooks/useLibrary.test.ts`

**Step 1: Write the failing tests**

`src/hooks/useLibrary.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useLibrary } from './useLibrary'
import { bandOfBrothers, atomicHabits } from '@/test/book.fixtures'

beforeEach(() => {
  localStorage.clear()
})

describe('useLibrary', () => {
  it('starts with an empty library', () => {
    const { result } = renderHook(() => useLibrary())
    expect(result.current.books).toEqual([])
  })

  it('adds a book', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    expect(result.current.books).toHaveLength(1)
    expect(result.current.books[0].title).toBe('Band of Brothers')
  })

  it('persists books to localStorage', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    const stored = JSON.parse(localStorage.getItem('chronicle-books') ?? '[]')
    expect(stored).toHaveLength(1)
  })

  it('removes a book by id', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    act(() => result.current.removeBook(bandOfBrothers.id))
    expect(result.current.books).toHaveLength(0)
  })

  it('updates a book', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    act(() => result.current.updateBook(bandOfBrothers.id, { eraSource: 'manual', startYear: 1940 }))
    expect(result.current.books[0].eraSource).toBe('manual')
    expect(result.current.books[0].startYear).toBe(1940)
  })

  it('adds multiple books at once', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBooks([bandOfBrothers, atomicHabits]))
    expect(result.current.books).toHaveLength(2)
  })

  it('does not add duplicate books (same isbn)', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    act(() => result.current.addBook(bandOfBrothers))
    expect(result.current.books).toHaveLength(1)
  })

  it('loads existing books from localStorage on mount', () => {
    localStorage.setItem('chronicle-books', JSON.stringify([bandOfBrothers]))
    const { result } = renderHook(() => useLibrary())
    expect(result.current.books).toHaveLength(1)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/hooks/useLibrary.test.ts
```

Expected: FAIL -- `useLibrary` does not exist yet.

**Step 3: Implement the hook**

`src/hooks/useLibrary.ts`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Book } from '@/types/book'
import { STORAGE_KEY } from '@/lib/constants'

function loadFromStorage(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Book[]) : []
  } catch {
    return []
  }
}

function saveToStorage(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    setBooks(loadFromStorage())
  }, [])

  const persist = useCallback((next: Book[]) => {
    setBooks(next)
    saveToStorage(next)
  }, [])

  const addBook = useCallback((book: Book) => {
    setBooks(prev => {
      // Deduplicate by ISBN if present, otherwise by id
      const isDupe = prev.some(b =>
        book.isbn ? b.isbn === book.isbn : b.id === book.id
      )
      if (isDupe) return prev
      const next = [...prev, book]
      saveToStorage(next)
      return next
    })
  }, [])

  const addBooks = useCallback((incoming: Book[]) => {
    setBooks(prev => {
      const existingIsbns = new Set(prev.map(b => b.isbn).filter(Boolean))
      const existingIds = new Set(prev.map(b => b.id))
      const filtered = incoming.filter(b =>
        !(b.isbn && existingIsbns.has(b.isbn)) && !existingIds.has(b.id)
      )
      const next = [...prev, ...filtered]
      saveToStorage(next)
      return next
    })
  }, [])

  const removeBook = useCallback((id: string) => {
    setBooks(prev => {
      const next = prev.filter(b => b.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

  const updateBook = useCallback((id: string, changes: Partial<Book>) => {
    setBooks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...changes } : b)
      saveToStorage(next)
      return next
    })
  }, [])

  return { books, addBook, addBooks, removeBook, updateBook, persist }
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/hooks/useLibrary.test.ts
```

Expected: All 8 tests PASS.

**Step 5: Commit**

```bash
git add src/hooks/useLibrary.ts src/hooks/useLibrary.test.ts
git commit -m "feat: add useLibrary hook with localStorage CRUD"
```

---

## Phase 2: Server Actions

---

### Task 4: lookupBook server action (Open Library)

**Files:**
- Create: `src/actions/lookupBook.ts`
- Create: `src/actions/lookupBook.test.ts`

**Step 1: Write the failing tests**

`src/actions/lookupBook.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupBook } from './lookupBook'

// Mock fetch globally
beforeEach(() => {
  vi.restoreAllMocks()
})

describe('lookupBook', () => {
  it('looks up a book by ISBN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        'ISBN:9780743224543': {
          title: 'Band of Brothers',
          authors: [{ name: 'Stephen E. Ambrose' }],
          cover: { medium: 'https://covers.openlibrary.org/b/id/123-M.jpg' },
          excerpts: [{ text: 'The story of Easy Company...' }],
          subjects: [{ name: 'World War, 1939-1945' }],
        }
      })
    }))

    const result = await lookupBook({ isbn: '9780743224543' })
    expect(result?.title).toBe('Band of Brothers')
    expect(result?.author).toBe('Stephen E. Ambrose')
    expect(result?.coverUrl).toContain('openlibrary.org')
  })

  it('returns null when ISBN not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    }))

    const result = await lookupBook({ isbn: '0000000000000' })
    expect(result).toBeNull()
  })

  it('searches by title and author when no ISBN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [{
          title: 'Band of Brothers',
          author_name: ['Stephen E. Ambrose'],
          isbn: ['9780743224543'],
          cover_i: 123,
          first_sentence: { value: 'The story...' },
          subject: ['World War, 1939-1945'],
        }]
      })
    }))

    const result = await lookupBook({ title: 'Band of Brothers', author: 'Ambrose' })
    expect(result?.title).toBe('Band of Brothers')
  })

  it('returns null on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')))
    const result = await lookupBook({ isbn: '9780743224543' })
    expect(result).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/actions/lookupBook.test.ts
```

Expected: FAIL -- module does not exist.

**Step 3: Implement the server action**

`src/actions/lookupBook.ts`:

```typescript
'use server'

import { BookLookupResult } from '@/types/book'

type LookupParams =
  | { isbn: string; title?: never; author?: never }
  | { isbn?: never; title: string; author?: string }

export async function lookupBook(params: LookupParams): Promise<BookLookupResult | null> {
  try {
    if (params.isbn) {
      return await lookupByIsbn(params.isbn)
    }
    return await lookupByTitle(params.title, params.author)
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
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/actions/lookupBook.test.ts
```

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add src/actions/lookupBook.ts src/actions/lookupBook.test.ts
git commit -m "feat: add lookupBook server action via Open Library API"
```

---

### Task 5: extractEras server action (Claude)

**Files:**
- Create: `src/actions/extractEras.ts`
- Create: `src/actions/extractEras.test.ts`

**Step 1: Write the failing tests**

`src/actions/extractEras.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildEraPrompt, parseEraResponse } from './extractEras'

// Note: We test the prompt builder and response parser, not the SDK call itself.
// The SDK is an integration point -- testing it would mean testing Anthropic's API.

describe('buildEraPrompt', () => {
  it('includes all book titles in the prompt', () => {
    const books = [
      { title: 'Band of Brothers', author: 'Stephen Ambrose', description: 'WWII story' },
      { title: 'Atomic Habits', author: 'James Clear', description: 'Self-help' },
    ]
    const prompt = buildEraPrompt(books)
    expect(prompt).toContain('Band of Brothers')
    expect(prompt).toContain('Atomic Habits')
  })

  it('truncates long descriptions to 400 chars', () => {
    const longDesc = 'x'.repeat(600)
    const books = [{ title: 'Test', author: 'Author', description: longDesc }]
    const prompt = buildEraPrompt(books)
    expect(prompt).toContain('x'.repeat(400))
    expect(prompt).not.toContain('x'.repeat(401))
  })
})

describe('parseEraResponse', () => {
  it('parses a valid era response', () => {
    const raw = JSON.stringify({
      books: [
        { hasHistoricalEra: true, startYear: 1942, endYear: 1945, eraLabel: 'World War II' },
        { hasHistoricalEra: false, startYear: null, endYear: null, eraLabel: null },
      ]
    })
    const result = parseEraResponse(raw, 2)
    expect(result[0]?.hasHistoricalEra).toBe(true)
    expect(result[0]?.startYear).toBe(1942)
    expect(result[1]?.hasHistoricalEra).toBe(false)
  })

  it('returns nulls for malformed response', () => {
    const result = parseEraResponse('not json at all', 2)
    expect(result).toEqual([null, null])
  })

  it('handles missing books array gracefully', () => {
    const result = parseEraResponse('{}', 2)
    expect(result).toEqual([null, null])
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/actions/extractEras.test.ts
```

Expected: FAIL -- module does not exist.

**Step 3: Implement the server action**

`src/actions/extractEras.ts`:

```typescript
'use server'

import { EraResult } from '@/types/book'
import { MAX_ERA_BATCH_SIZE } from '@/lib/constants'

interface BookInput {
  title: string
  author: string
  description?: string
  subjects?: string[]
}

// Build the prompt sent to Claude for era extraction
export function buildEraPrompt(books: BookInput[]): string {
  const bookList = books.map((b, i) => {
    const desc = b.description?.slice(0, 400) ?? 'No description available'
    const subjects = b.subjects?.join(', ') ?? ''
    return `${i + 1}. "${b.title}" by ${b.author}
   Description: ${desc}
   Subjects: ${subjects}`
  }).join('\n\n')

  return `You are a historian and librarian. For each non-fiction book below, determine the historical time period the book's content covers.

Return a JSON object with a "books" array containing one entry per book in order.

For each book provide:
- hasHistoricalEra: true if it covers a specific historical period (biography, history, war, science history, etc.)
  false for self-help, personal development, business strategy, productivity, or contemporary how-to books
- startYear: earliest year the content covers (negative integer for BCE, e.g. -44 for 44 BCE, null if hasHistoricalEra is false)
- endYear: latest year covered (null if hasHistoricalEra is false)
- eraLabel: short descriptive label like "World War II", "Ancient Rome", "Victorian England", "American Civil War" (null if hasHistoricalEra is false)

Books to classify:

${bookList}

Return ONLY valid JSON matching this structure:
{"books": [{"hasHistoricalEra": true, "startYear": 1942, "endYear": 1945, "eraLabel": "World War II"}, ...]}`
}

// Parse Claude's response, returning null per-book on failure
export function parseEraResponse(raw: string, expectedCount: number): (EraResult | null)[] {
  const nulls = Array(expectedCount).fill(null) as null[]
  try {
    // Try to extract JSON even if wrapped in extra text
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return nulls
    const parsed = JSON.parse(match[0]) as { books?: unknown[] }
    if (!Array.isArray(parsed.books)) return nulls

    return parsed.books.map((entry): EraResult | null => {
      if (!entry || typeof entry !== 'object') return null
      const e = entry as Record<string, unknown>
      if (typeof e.hasHistoricalEra !== 'boolean') return null
      return {
        hasHistoricalEra: e.hasHistoricalEra,
        startYear: typeof e.startYear === 'number' ? e.startYear : null,
        endYear: typeof e.endYear === 'number' ? e.endYear : null,
        eraLabel: typeof e.eraLabel === 'string' ? e.eraLabel : null,
      }
    })
  } catch {
    return nulls
  }
}

// Main export: extract historical eras for a batch of books
export async function extractEras(books: BookInput[]): Promise<(EraResult | null)[]> {
  if (books.length === 0) return []

  // Process in batches of MAX_ERA_BATCH_SIZE
  const results: (EraResult | null)[] = []
  for (let i = 0; i < books.length; i += MAX_ERA_BATCH_SIZE) {
    const batch = books.slice(i, i + MAX_ERA_BATCH_SIZE)
    const batchResults = await extractBatch(batch)
    results.push(...batchResults)
  }
  return results
}

async function extractBatch(books: BookInput[]): Promise<(EraResult | null)[]> {
  const prompt = buildEraPrompt(books)

  // Primary path: claude-agent-sdk (uses Claude Code login, no API key needed locally)
  // Fallback path: direct @anthropic-ai/sdk (needs ANTHROPIC_API_KEY, used on Vercel)
  const useDirectApi = !!process.env.ANTHROPIC_API_KEY

  if (useDirectApi) {
    return extractBatchDirect(prompt, books.length)
  }
  return extractBatchAgentSdk(prompt, books.length)
}

async function extractBatchAgentSdk(prompt: string, count: number): Promise<(EraResult | null)[]> {
  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk')
    let resultText = ''

    const claudeQuery = query({
      prompt,
      options: {
        tools: [],
        persistSession: false,
        thinking: { type: 'disabled' },
        effort: 'low',
        maxTurns: 3,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        model: 'claude-haiku-4-5-20251001',
        outputFormat: {
          type: 'json_schema',
          schema: ERA_RESPONSE_SCHEMA,
        },
      } as Parameters<typeof query>[0]['options'],
    })

    for await (const msg of claudeQuery) {
      if (msg.type === 'result' && msg.subtype === 'success') {
        resultText = msg.result ?? ''
      }
    }

    return parseEraResponse(resultText, count)
  } catch (err) {
    console.error('[extractEras] agent SDK error:', err)
    return Array(count).fill(null)
  }
}

async function extractBatchDirect(prompt: string, count: number): Promise<(EraResult | null)[]> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return parseEraResponse(text, count)
  } catch (err) {
    console.error('[extractEras] direct API error:', err)
    return Array(count).fill(null)
  }
}

const ERA_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    books: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hasHistoricalEra: { type: 'boolean' },
          startYear: { type: ['number', 'null'] },
          endYear: { type: ['number', 'null'] },
          eraLabel: { type: ['string', 'null'] },
        },
        required: ['hasHistoricalEra', 'startYear', 'endYear', 'eraLabel'],
      },
    },
  },
  required: ['books'],
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/actions/extractEras.test.ts
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add src/actions/extractEras.ts src/actions/extractEras.test.ts
git commit -m "feat: add extractEras server action with claude-agent-sdk + direct API fallback"
```

---

## Phase 3: Book Add Flow

---

### Task 6: Manual book add -- search + preview

**Files:**
- Create: `src/components/AddBookModal.tsx`
- Create: `src/components/BookPreviewCard.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Write BookPreviewCard**

`src/components/BookPreviewCard.tsx`:

```typescript
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
        <div className="w-20 h-30 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs text-center p-2">
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
```

**Step 2: Write AddBookModal**

`src/components/AddBookModal.tsx`:

```typescript
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

  async function handleSearch(e: React.FormEvent) {
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
```

**Step 3: Wire into page.tsx temporarily to test**

`src/app/page.tsx` (minimal shell for now):

```typescript
'use client'

import { useState } from 'react'
import { useLibrary } from '@/hooks/useLibrary'
import { AddBookModal } from '@/components/AddBookModal'

export default function Home() {
  const { books, addBook } = useLibrary()
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-6 z-40">
        <h1 className="font-semibold text-gray-900">Chronicle</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
        >
          + Add book
        </button>
      </nav>

      <div className="pt-14 p-6">
        <p className="text-gray-500 text-sm">{books.length} books in library</p>
        {/* Timeline goes here in Task 9 */}
      </div>

      {showAddModal && (
        <AddBookModal
          onAdd={addBook}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  )
}
```

**Step 4: Verify manually**

```bash
npm run dev
```

Open http://localhost:3000, click "+ Add book", search for "Band of Brothers". Confirm a preview card appears and clicking "Add to library" adds it.

**Step 5: Commit**

```bash
git add src/components/ src/app/page.tsx
git commit -m "feat: add manual book search and add flow"
```

---

### Task 7: CSV parsers (Goodreads + StoryGraph)

**Files:**
- Create: `src/lib/parseCsv.ts`
- Create: `src/lib/parseCsv.test.ts`

**Step 1: Write the failing tests**

`src/lib/parseCsv.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseGoodreadsCsv, parseStorygraphCsv } from './parseCsv'

const GOODREADS_CSV = `Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies
1,Band of Brothers,Stephen E. Ambrose,"Ambrose, Stephen E.",,="0743224540",="9780743224543",5,4.47,Simon & Schuster,Paperback,336,2001,1992,2024/01/15,2024/01/01,,shelf1,read,,,,1,0
2,Atomic Habits,James Clear,"Clear, James",,="0735211299",="9780735211292",4,4.38,Avery,Hardcover,320,2018,2018,2023/06/20,2023/06/01,,shelf2,read,,,,1,0
3,To Kill a Mockingbird,Harper Lee,"Lee, Harper",,="0061935020",="9780061935022",5,4.27,Harper Perennial,Paperback,336,2002,1960,,,, ,to-read,,,,0,0`

const STORYGRAPH_CSV = `Title,Authors,Read Status,Star Rating,Review,Tags,Number of Pages,Publication Year,ISBN/UID,Read Dates,Owned?
Band of Brothers,Stephen E. Ambrose,read,5.0,,history,336,2001,9780743224543,2024-01-01 to 2024-01-15,false
Atomic Habits,James Clear,currently-reading,,,self-help,320,2018,9780735211292,,false
The Hobbit,J.R.R. Tolkien,to-read,,,,310,1937,9780547928227,,false`

describe('parseGoodreadsCsv', () => {
  it('parses read books from Goodreads CSV', () => {
    const books = parseGoodreadsCsv(GOODREADS_CSV)
    expect(books).toHaveLength(2) // only 'read' shelf, not 'to-read'
    expect(books[0].title).toBe('Band of Brothers')
    expect(books[0].author).toBe('Stephen E. Ambrose')
    expect(books[0].isbn).toBe('9780743224543')
    expect(books[0].rating).toBe(5)
    expect(books[0].dateRead).toBe('2024-01-15')
    expect(books[0].readingStatus).toBe('read')
    expect(books[0].source).toBe('goodreads')
  })

  it('handles currently-reading status', () => {
    // Goodreads exports don't typically have currently-reading in Exclusive Shelf
    // but if they do, include it
    const csv = GOODREADS_CSV.replace('to-read', 'currently-reading')
    const books = parseGoodreadsCsv(csv)
    expect(books).toHaveLength(3)
    expect(books[2].readingStatus).toBe('currently-reading')
  })

  it('strips = and quotes from ISBN fields', () => {
    const books = parseGoodreadsCsv(GOODREADS_CSV)
    expect(books[0].isbn).toBe('9780743224543')
    expect(books[0].isbn).not.toContain('=')
    expect(books[0].isbn).not.toContain('"')
  })
})

describe('parseStorygraphCsv', () => {
  it('parses read and currently-reading books from StoryGraph CSV', () => {
    const books = parseStorygraphCsv(STORYGRAPH_CSV)
    expect(books).toHaveLength(2) // skips to-read
    expect(books[0].title).toBe('Band of Brothers')
    expect(books[1].readingStatus).toBe('currently-reading')
    expect(books[0].source).toBe('storygraph')
  })

  it('maps rating correctly', () => {
    const books = parseStorygraphCsv(STORYGRAPH_CSV)
    expect(books[0].rating).toBe(5)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/lib/parseCsv.test.ts
```

Expected: FAIL

**Step 3: Implement parsers**

`src/lib/parseCsv.ts`:

```typescript
import Papa from 'papaparse'
import { v4 as uuid } from 'uuid'
import { Book } from '@/types/book'

type RawRow = Record<string, string>

function cleanIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  // Goodreads wraps ISBNs in ="..." format
  return raw.replace(/^=?"?|"?$/g, '').trim() || undefined
}

function parseRating(raw: string | undefined): number | undefined {
  const n = Number(raw)
  return n >= 1 && n <= 5 ? Math.round(n) : undefined
}

function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  // Goodreads: "2024/01/15" → "2024-01-15"
  // StoryGraph: "2024-01-01 to 2024-01-15" → take end date
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
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/lib/parseCsv.test.ts
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add src/lib/parseCsv.ts src/lib/parseCsv.test.ts
git commit -m "feat: add Goodreads and StoryGraph CSV parsers"
```

---

### Task 8: CSV import UI

**Files:**
- Create: `src/components/ImportModal.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Implement ImportModal**

`src/components/ImportModal.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { parseGoodreadsCsv, parseStorygraphCsv } from '@/lib/parseCsv'
import { extractEras } from '@/actions/extractEras'
import { Book } from '@/types/book'

interface Props {
  onImport: (books: Book[]) => void
  onClose: () => void
}

type Source = 'goodreads' | 'storygraph'
type Phase = 'select' | 'importing' | 'done'

export function ImportModal({ onImport, onClose }: Props) {
  const [source, setSource] = useState<Source>('goodreads')
  const [phase, setPhase] = useState<Phase>('select')
  const [progress, setProgress] = useState({ processed: 0, total: 0 })
  const [imported, setImported] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = source === 'goodreads'
      ? parseGoodreadsCsv(text)
      : parseStorygraphCsv(text)

    if (parsed.length === 0) {
      alert('No books found. Make sure you selected the right file and source.')
      return
    }

    setPhase('importing')
    setProgress({ processed: 0, total: parsed.length })

    // Batch era extraction: 15 books per call
    const BATCH = 15
    const enriched: Book[] = []

    for (let i = 0; i < parsed.length; i += BATCH) {
      const batch = parsed.slice(i, i + BATCH)
      const eras = await extractEras(batch.map(b => ({
        title: b.title,
        author: b.author,
        description: b.description,
      })))

      batch.forEach((book, j) => {
        const era = eras[j]
        enriched.push({
          ...book,
          id: uuid(),
          startYear: era?.startYear ?? null,
          endYear: era?.endYear ?? null,
          eraLabel: era?.eraLabel ?? null,
          eraSource: 'auto',
          hasHistoricalEra: era?.hasHistoricalEra ?? false,
        })
      })

      setProgress(p => ({ ...p, processed: Math.min(i + BATCH, parsed.length) }))
    }

    onImport(enriched)
    setImported(enriched.filter(b => b.hasHistoricalEra).length)
    setPhase('done')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Import library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {phase === 'select' && (
          <>
            <div className="flex gap-2 mb-4">
              {(['goodreads', 'storygraph'] as Source[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 py-2 text-sm rounded-lg border capitalize ${
                    source === s
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {source === 'goodreads'
                ? 'Export from Goodreads: My Books → Import/Export → Export Library'
                : 'Export from StoryGraph: Profile → Import/Export → Export your data'}
            </p>

            <input
              type="file"
              accept=".csv"
              ref={fileRef}
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            >
              Choose CSV file
            </button>
          </>
        )}

        {phase === 'importing' && (
          <div className="text-center py-4">
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className="bg-gray-900 h-2 rounded-full transition-all"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Extracting historical eras... {progress.processed} / {progress.total}
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-medium">Import complete</p>
            <p className="text-sm text-gray-600 mt-1">
              {imported} books placed on the timeline
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm rounded-lg"
            >
              View timeline
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Add import button to page.tsx**

In `src/app/page.tsx`, add import button to the nav and wire up the ImportModal (follow same pattern as AddBookModal).

**Step 3: Verify manually**

Export a CSV from Goodreads or create a sample CSV matching the format. Upload it. Verify the progress bar appears and books are added.

**Step 4: Commit**

```bash
git add src/components/ImportModal.tsx src/app/page.tsx
git commit -m "feat: add CSV import modal with batch era extraction and progress bar"
```

---

## Phase 4: Timeline

---

### Task 9: Timeline shell -- horizontal scroll container + year axis

**Files:**
- Create: `src/components/Timeline.tsx`
- Create: `src/lib/timeline.ts`
- Create: `src/lib/timeline.test.ts`

**Step 1: Write year-to-pixel math tests**

`src/lib/timeline.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { yearToPixel, pixelToYear, formatYear } from './timeline'

describe('yearToPixel', () => {
  it('maps timeline start to 0', () => {
    expect(yearToPixel(-3000, -3000, 2026, 1)).toBe(0)
  })

  it('maps timeline end to full width', () => {
    const width = yearToPixel(2026, -3000, 2026, 1)
    expect(width).toBe(5026) // (2026 - (-3000)) * 1
  })

  it('scales correctly with pixelsPerYear', () => {
    const px = yearToPixel(0, -3000, 2026, 2)
    expect(px).toBe(6000) // (0 - (-3000)) * 2
  })

  it('handles BCE years (negative)', () => {
    const px = yearToPixel(-500, -3000, 2026, 1)
    expect(px).toBe(2500) // (-500 - (-3000)) * 1
  })
})

describe('pixelToYear', () => {
  it('converts pixel back to year', () => {
    const year = pixelToYear(2500, -3000, 1)
    expect(year).toBe(-500)
  })
})

describe('formatYear', () => {
  it('formats CE years', () => {
    expect(formatYear(1944)).toBe('1944')
  })

  it('formats BCE years', () => {
    expect(formatYear(-500)).toBe('500 BCE')
  })

  it('formats year 0 as 1 BCE', () => {
    expect(formatYear(0)).toBe('1 BCE')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/lib/timeline.test.ts
```

**Step 3: Implement timeline math**

`src/lib/timeline.ts`:

```typescript
import { TIMELINE_START_YEAR, TIMELINE_END_YEAR, ZOOM_LEVELS } from './constants'

export function yearToPixel(
  year: number,
  startYear = TIMELINE_START_YEAR,
  endYear = TIMELINE_END_YEAR,
  pixelsPerYear = ZOOM_LEVELS.century
): number {
  return (year - startYear) * pixelsPerYear
}

export function pixelToYear(
  pixel: number,
  startYear = TIMELINE_START_YEAR,
  pixelsPerYear = ZOOM_LEVELS.century
): number {
  return Math.round(pixel / pixelsPerYear + startYear)
}

export function formatYear(year: number): string {
  if (year > 0) return String(year)
  if (year === 0) return '1 BCE'
  return `${Math.abs(year)} BCE`
}

export function timelineWidth(pixelsPerYear = ZOOM_LEVELS.century): number {
  return yearToPixel(TIMELINE_END_YEAR, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pixelsPerYear)
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/lib/timeline.test.ts
```

Expected: All 6 tests PASS.

**Step 5: Build Timeline shell**

`src/components/Timeline.tsx`:

```typescript
'use client'

import { useRef, useEffect } from 'react'
import { Book } from '@/types/book'
import { ERA_BANDS, TIMELINE_START_YEAR, TIMELINE_END_YEAR, ZOOM_LEVELS } from '@/lib/constants'
import { yearToPixel, formatYear, timelineWidth } from '@/lib/timeline'

interface Props {
  books: Book[]
  zoom: 'century' | 'decade'
}

const AXIS_HEIGHT = 48
const TRACK_HEIGHT = 500
const TOTAL_HEIGHT = AXIS_HEIGHT + TRACK_HEIGHT

export function Timeline({ books, zoom }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pxPerYear = ZOOM_LEVELS[zoom]
  const width = timelineWidth(pxPerYear)

  // Scroll to present on first render
  useEffect(() => {
    if (!scrollRef.current) return
    const presentX = yearToPixel(new Date().getFullYear(), TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
    scrollRef.current.scrollLeft = presentX - scrollRef.current.clientWidth * 0.75
  }, [pxPerYear])

  const historicalBooks = books.filter(b => b.hasHistoricalEra && b.startYear !== null)

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto overflow-y-hidden relative select-none"
      style={{ height: TOTAL_HEIGHT }}
    >
      <div className="relative" style={{ width, height: TOTAL_HEIGHT }}>
        {/* Era band backgrounds */}
        {ERA_BANDS.map(band => {
          const x = yearToPixel(band.start, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
          const w = yearToPixel(band.end, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear) - x
          return (
            <div
              key={band.label}
              className="absolute top-0 bottom-0 border-r border-gray-200"
              style={{ left: x, width: w, backgroundColor: band.color }}
            >
              <span className="absolute top-2 left-2 text-xs text-gray-400 font-medium pointer-events-none">
                {band.label}
              </span>
            </div>
          )
        })}

        {/* Year axis */}
        <YearAxis pxPerYear={pxPerYear} width={width} />

        {/* Book cards -- added in Task 11 */}
        <div className="absolute" style={{ top: AXIS_HEIGHT, left: 0, right: 0, bottom: 0 }}>
          {/* Book cards rendered here */}
        </div>
      </div>
    </div>
  )
}

function YearAxis({ pxPerYear, width }: { pxPerYear: number; width: number }) {
  // Calculate sensible tick interval based on zoom
  const tickInterval = pxPerYear >= 4 ? 100 : 500 // every 100yr zoomed in, 500yr zoomed out
  const ticks: number[] = []
  for (let y = Math.ceil(TIMELINE_START_YEAR / tickInterval) * tickInterval; y <= TIMELINE_END_YEAR; y += tickInterval) {
    ticks.push(y)
  }

  return (
    <div className="absolute top-0 left-0 right-0 border-b border-gray-300 bg-white/80 backdrop-blur-sm" style={{ height: AXIS_HEIGHT }}>
      {ticks.map(year => {
        const x = yearToPixel(year, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
        return (
          <div key={year} className="absolute top-0 bottom-0 flex flex-col justify-end pb-1" style={{ left: x }}>
            <div className="w-px h-3 bg-gray-300 mb-1" />
            <span className="text-xs text-gray-500 -translate-x-1/2 whitespace-nowrap">
              {formatYear(year)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

**Step 6: Add Timeline to page.tsx**

Import and render `<Timeline books={books} zoom="century" />` in `src/app/page.tsx`.

**Step 7: Verify visually**

```bash
npm run dev
```

Expected: A wide scrollable area with colored era bands and a year axis. Should auto-scroll near present.

**Step 8: Commit**

```bash
git add src/components/Timeline.tsx src/lib/timeline.ts src/lib/timeline.test.ts src/app/page.tsx
git commit -m "feat: add Timeline shell with era bands, year axis, and scroll-to-present"
```

---

### Task 10: Book card component + positioning

**Files:**
- Create: `src/components/BookCard.tsx`
- Create: `src/lib/stackBooks.ts`
- Create: `src/lib/stackBooks.test.ts`
- Modify: `src/components/Timeline.tsx`

**Step 1: Write stacking logic tests**

`src/lib/stackBooks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { stackBooks } from './stackBooks'
import { bandOfBrothers, sapiens } from '@/test/book.fixtures'

describe('stackBooks', () => {
  it('places non-overlapping books on the same row', () => {
    const wwii = { ...bandOfBrothers, startYear: 1942, endYear: 1945 }
    const modern = { ...bandOfBrothers, id: 'test-4', title: 'Other', startYear: 1960, endYear: 1970 }
    const stacked = stackBooks([wwii, modern], 0.8)
    expect(stacked[0].row).toBe(0)
    expect(stacked[1].row).toBe(0) // no overlap, both on row 0
  })

  it('stacks overlapping books on different rows', () => {
    const book1 = { ...bandOfBrothers, startYear: 1942, endYear: 1945 }
    const book2 = { ...bandOfBrothers, id: 'test-5', startYear: 1943, endYear: 1946 }
    const stacked = stackBooks([book1, book2], 0.8)
    expect(stacked[0].row).toBe(0)
    expect(stacked[1].row).toBe(1)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/lib/stackBooks.test.ts
```

**Step 3: Implement stacking**

`src/lib/stackBooks.ts`:

```typescript
import { Book } from '@/types/book'
import { yearToPixel, TIMELINE_START_YEAR, TIMELINE_END_YEAR } from './timeline'

export interface StackedBook {
  book: Book
  x: number
  width: number
  row: number
}

const CARD_WIDTH = 96   // px, fixed width for book cards
const CARD_GAP = 8      // px gap between cards on the same row

export function stackBooks(books: Book[], pxPerYear: number): StackedBook[] {
  const historicalBooks = books.filter(b => b.hasHistoricalEra && b.startYear !== null)

  // Sort by start year
  const sorted = [...historicalBooks].sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0))

  // For each book, find the lowest row where it doesn't overlap
  const rowEndX: number[] = [] // tracks where each row currently ends
  const result: StackedBook[] = []

  for (const book of sorted) {
    const x = yearToPixel(book.startYear!, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
    // For span books (startYear != endYear), width spans the era; for point books, fixed CARD_WIDTH
    const endX = book.endYear && book.endYear !== book.startYear
      ? yearToPixel(book.endYear, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
      : x + CARD_WIDTH
    const width = Math.max(endX - x, CARD_WIDTH)

    let row = 0
    while (rowEndX[row] !== undefined && rowEndX[row] > x) {
      row++
    }
    rowEndX[row] = x + width + CARD_GAP

    result.push({ book, x, width, row })
  }

  return result
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/lib/stackBooks.test.ts
```

**Step 5: Build BookCard**

`src/components/BookCard.tsx`:

```typescript
'use client'

import Image from 'next/image'
import { Book } from '@/types/book'

interface Props {
  book: Book
  width: number
  onClick: (book: Book) => void
}

const CARD_HEIGHT = 120

export function BookCard({ book, width, onClick }: Props) {
  const isCurrentlyReading = book.readingStatus === 'currently-reading'

  return (
    <button
      onClick={() => onClick(book)}
      className={`
        absolute flex flex-col items-center rounded-lg overflow-hidden bg-white shadow-sm
        border-2 transition-transform hover:scale-105 hover:shadow-md hover:z-10
        ${isCurrentlyReading
          ? 'border-amber-400 animate-pulse-slow'
          : 'border-transparent hover:border-gray-200'
        }
      `}
      style={{ width, height: CARD_HEIGHT }}
      title={book.title}
    >
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          className="object-cover"
        />
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
```

Add to `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    animation: {
      'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }
  }
}
```

**Step 6: Wire book cards into Timeline**

In `src/components/Timeline.tsx`:

```typescript
// Add to imports
import { stackBooks } from '@/lib/stackBooks'
import { BookCard } from './BookCard'

// Inside Timeline component, before return:
const stacked = stackBooks(books, pxPerYear)
const ROW_HEIGHT = 136 // CARD_HEIGHT + gap

// Replace the book cards comment with:
{stacked.map(({ book, x, width, row }) => (
  <BookCard
    key={book.id}
    book={book}
    width={width}
    onClick={setSelectedBook} // add selectedBook state to Timeline
    style={{ position: 'absolute', left: x, top: row * ROW_HEIGHT }}
  />
))}
```

**Step 7: Verify visually**

Add a few books manually. They should appear on the timeline at their correct historical position, stacking when they overlap.

**Step 8: Commit**

```bash
git add src/components/BookCard.tsx src/lib/stackBooks.ts src/lib/stackBooks.test.ts src/components/Timeline.tsx
git commit -m "feat: add book cards with stacking layout on timeline"
```

---

### Task 11: Book detail panel

**Files:**
- Create: `src/components/BookDetailPanel.tsx`
- Modify: `src/components/Timeline.tsx`

**Step 1: Implement detail panel**

`src/components/BookDetailPanel.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Book } from '@/types/book'
import { formatYear } from '@/lib/timeline'

interface Props {
  book: Book
  onClose: () => void
  onUpdate: (id: string, changes: Partial<Book>) => void
}

export function BookDetailPanel({ book, onClose, onUpdate }: Props) {
  const [editingEra, setEditingEra] = useState(false)
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
            <p className="text-xs text-gray-500 mt-1">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</p>
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
```

**Step 2: Wire into Timeline**

Add `selectedBook` state to `src/app/page.tsx`, pass `onBookClick` down to `Timeline`, render `<BookDetailPanel>` alongside the timeline.

**Step 3: Commit**

```bash
git add src/components/BookDetailPanel.tsx src/components/Timeline.tsx src/app/page.tsx
git commit -m "feat: add book detail panel with era editing"
```

---

## Phase 5: Sidebar + Controls

---

### Task 12: Sidebar (non-historical books)

**Files:**
- Create: `src/components/Sidebar.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Implement Sidebar**

`src/components/Sidebar.tsx`:

```typescript
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
```

**Step 2: Wire into page.tsx**

Render `<Sidebar>` in `src/app/page.tsx`. When `onAssignEra` is called, open the `BookDetailPanel` for that book with `editingEra` pre-opened.

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/app/page.tsx
git commit -m "feat: add sidebar listing non-historical books"
```

---

### Task 13: Timeline controls (jump-to + zoom)

**Files:**
- Create: `src/components/TimelineControls.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Implement controls**

`src/components/TimelineControls.tsx`:

```typescript
'use client'

import { ZOOM_LEVELS } from '@/lib/constants'
import { yearToPixel, TIMELINE_START_YEAR, TIMELINE_END_YEAR } from '@/lib/timeline'

const JUMP_POINTS = [
  { label: 'Ancient',   year: -2500 },
  { label: 'Medieval',  year:  900  },
  { label: 'Industrial', year: 1800 },
  { label: 'WWII',      year: 1939  },
  { label: 'Present',   year: new Date().getFullYear() },
] as const

interface Props {
  zoom: 'century' | 'decade'
  onZoomChange: (z: 'century' | 'decade') => void
  scrollRef: React.RefObject<HTMLDivElement>
}

export function TimelineControls({ zoom, onZoomChange, scrollRef }: Props) {
  function jumpTo(year: number) {
    if (!scrollRef.current) return
    const x = yearToPixel(year, TIMELINE_START_YEAR, TIMELINE_END_YEAR, ZOOM_LEVELS[zoom])
    scrollRef.current.scrollTo({ left: x - scrollRef.current.clientWidth / 2, behavior: 'smooth' })
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full shadow-lg border px-3 py-2 z-30">
      {JUMP_POINTS.map(({ label, year }) => (
        <button
          key={label}
          onClick={() => jumpTo(year)}
          className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-full hover:bg-gray-100"
        >
          {label}
        </button>
      ))}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button
        onClick={() => onZoomChange(zoom === 'century' ? 'decade' : 'century')}
        className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-full hover:bg-gray-100"
      >
        {zoom === 'century' ? 'Zoom in' : 'Zoom out'}
      </button>
    </div>
  )
}
```

**Step 2: Wire into page.tsx**

Add `zoom` state, pass `scrollRef` from Timeline up to page, render `<TimelineControls>`.

**Step 3: Commit**

```bash
git add src/components/TimelineControls.tsx src/app/page.tsx
git commit -m "feat: add jump-to navigation and zoom controls"
```

---

## Phase 6: Polish + Deploy

---

### Task 14: Empty state + loading states

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Timeline.tsx`

**Step 1: Add empty state**

When `books.length === 0`, show a welcome message in the timeline area:

```typescript
{books.length === 0 && (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-2">
      Your history starts here
    </h2>
    <p className="text-gray-500 text-sm mb-6 max-w-sm">
      Add non-fiction books to see where in history you've been as a reader.
    </p>
    <div className="flex gap-3">
      <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">
        Add a book
      </button>
      <button onClick={() => setShowImportModal(true)} className="px-4 py-2 border text-sm rounded-lg">
        Import from Goodreads
      </button>
    </div>
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx src/components/Timeline.tsx
git commit -m "feat: add empty state and loading indicators"
```

---

### Task 15: Vercel deploy

**Step 1: Create `.env.example`**

```bash
# Optional: required for Vercel deployment (local dev uses claude-agent-sdk instead)
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Step 2: Create GitHub repo**

```bash
gh repo create chronicle --public --source=. --remote=origin --push
```

**Step 3: Deploy to Vercel**

```bash
npx vercel
```

Follow prompts: link to your Vercel account, deploy. Accept defaults.

**Step 4: Set environment variable on Vercel (for production AI calls)**

```bash
npx vercel env add ANTHROPIC_API_KEY production
```

Paste your Anthropic API key when prompted.

**Step 5: Redeploy with env var**

```bash
npx vercel --prod
```

**Step 6: Verify**

Open the production URL. Add a book. Confirm it appears on the timeline.

**Step 7: Commit**

```bash
git add .env.example .vercelignore
git commit -m "chore: add Vercel deploy config and env example"
```

---

## Summary

| Phase | Tasks | What you get |
|---|---|---|
| Foundation | 1-3 | Next.js scaffold, types, localStorage hook |
| Server Actions | 4-5 | Book lookup + era extraction via Claude |
| Add Flow | 6-8 | Manual add, CSV parsers, import UI |
| Timeline | 9-11 | Scrollable river, era bands, book cards, detail panel |
| Sidebar + Controls | 12-13 | Non-historical sidebar, jump-to, zoom |
| Polish + Deploy | 14-15 | Empty state, Vercel live |

**Run all tests:**
```bash
npm run test:run
```

Expected: All tests pass before deploying.
