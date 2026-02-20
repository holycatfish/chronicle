import { describe, it, expect } from 'vitest'
import { stackBooks } from './stackBooks'
import { bandOfBrothers, sapiens } from '@/test/book.fixtures'

describe('stackBooks', () => {
  it('places non-overlapping books on the same row', () => {
    // Use books ~1400 years apart -- well beyond the 120-year footprint of a min-width card at 0.8 px/year
    const ancient = { ...bandOfBrothers, startYear: -500, endYear: 0 }
    const modern = { ...bandOfBrothers, id: 'test-4', title: 'Other', startYear: 1900, endYear: 1910 }
    const stacked = stackBooks([ancient, modern], 0.8)
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

  it('ignores books without a historical era', () => {
    // sapiens has hasHistoricalEra: true, startYear set
    // bandOfBrothers also has hasHistoricalEra: true
    const noEra = { ...bandOfBrothers, id: 'no-era', hasHistoricalEra: false, startYear: null }
    const stacked = stackBooks([noEra], 0.8)
    expect(stacked).toHaveLength(0)
  })

  it('returns x positions based on pxPerYear', () => {
    const book = { ...bandOfBrothers, startYear: 1942, endYear: 1945 }
    const stacked1 = stackBooks([book], 0.8)
    const stacked8 = stackBooks([book], 8)
    expect(stacked8[0].x).toBeGreaterThan(stacked1[0].x)
  })
})
