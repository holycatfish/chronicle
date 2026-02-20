import { EraResult } from '@/types/book'

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
