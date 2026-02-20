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
