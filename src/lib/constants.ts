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
