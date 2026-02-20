import { describe, it, expect } from 'vitest'
import { buildEraPrompt, parseEraResponse } from '@/lib/eraPrompt'

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
