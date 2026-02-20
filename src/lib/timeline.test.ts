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
