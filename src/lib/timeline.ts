import { TIMELINE_START_YEAR, TIMELINE_END_YEAR, ZOOM_LEVELS } from './constants'

// Re-export so stackBooks and others can import from one place
export { TIMELINE_START_YEAR, TIMELINE_END_YEAR }

export function yearToPixel(
  year: number,
  startYear: number = TIMELINE_START_YEAR,
  endYear: number = TIMELINE_END_YEAR,
  pixelsPerYear: number = ZOOM_LEVELS.century
): number {
  void endYear // endYear is accepted for API symmetry but the math only needs startYear
  return (year - startYear) * pixelsPerYear
}

export function pixelToYear(
  pixel: number,
  startYear: number = TIMELINE_START_YEAR,
  pixelsPerYear: number = ZOOM_LEVELS.century
): number {
  return Math.round(pixel / pixelsPerYear + startYear)
}

export function formatYear(year: number): string {
  if (year > 0) return String(year)
  if (year === 0) return '1 BCE'
  return `${Math.abs(year)} BCE`
}

export function timelineWidth(pixelsPerYear: number = ZOOM_LEVELS.century): number {
  return yearToPixel(TIMELINE_END_YEAR, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pixelsPerYear)
}
