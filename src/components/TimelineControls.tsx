'use client'

import { ZOOM_LEVELS } from '@/lib/constants'
import { yearToPixel, TIMELINE_START_YEAR, TIMELINE_END_YEAR } from '@/lib/timeline'

const JUMP_POINTS = [
  { label: 'Ancient',    year: -2500 },
  { label: 'Medieval',   year:  900  },
  { label: 'Industrial', year: 1800  },
  { label: 'WWII',       year: 1939  },
  { label: 'Present',    year: new Date().getFullYear() },
] as const

interface Props {
  zoom: 'century' | 'decade'
  onZoomChange: (z: 'century' | 'decade') => void
  scrollRef: React.RefObject<HTMLDivElement | null>
}

export function TimelineControls({ zoom, onZoomChange, scrollRef }: Props) {
  function jumpTo(year: number) {
    if (!scrollRef.current) return
    const x = yearToPixel(year, TIMELINE_START_YEAR, TIMELINE_END_YEAR, ZOOM_LEVELS[zoom])
    scrollRef.current.scrollTo({ left: x - scrollRef.current.clientWidth / 2, behavior: 'smooth' })
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full shadow-lg border px-3 py-2 z-30">
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
