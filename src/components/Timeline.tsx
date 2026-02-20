'use client'

import { useRef, useEffect } from 'react'
import { Book } from '@/types/book'
import { ERA_BANDS, TIMELINE_START_YEAR, TIMELINE_END_YEAR, ZOOM_LEVELS } from '@/lib/constants'
import { yearToPixel, formatYear, timelineWidth } from '@/lib/timeline'

interface Props {
  books: Book[]
  zoom: 'century' | 'decade'
  scrollRef?: React.RefObject<HTMLDivElement | null>
}

const AXIS_HEIGHT = 48
const TRACK_HEIGHT = 500
const TOTAL_HEIGHT = AXIS_HEIGHT + TRACK_HEIGHT

export function Timeline({ books, zoom, scrollRef: externalScrollRef }: Props) {
  const internalRef = useRef<HTMLDivElement>(null)
  const scrollRef = externalScrollRef ?? internalRef
  const pxPerYear = ZOOM_LEVELS[zoom]
  const width = timelineWidth(pxPerYear)

  // Scroll to present on first render
  useEffect(() => {
    if (!scrollRef.current) return
    const presentX = yearToPixel(new Date().getFullYear(), TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
    scrollRef.current.scrollLeft = presentX - scrollRef.current.clientWidth * 0.75
  }, [pxPerYear, scrollRef])

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

        {/* Book cards -- wired in Task 10 */}
        <div className="absolute" style={{ top: AXIS_HEIGHT, left: 0, right: 0, bottom: 0 }}>
          {/* Book cards rendered here in Task 10 */}
        </div>
      </div>
    </div>
  )
}

function YearAxis({ pxPerYear, width: _width }: { pxPerYear: number; width: number }) {
  const tickInterval = pxPerYear >= 4 ? 100 : 500
  const ticks: number[] = []
  for (
    let y = Math.ceil(TIMELINE_START_YEAR / tickInterval) * tickInterval;
    y <= TIMELINE_END_YEAR;
    y += tickInterval
  ) {
    ticks.push(y)
  }

  return (
    <div
      className="absolute top-0 left-0 right-0 border-b border-gray-300 bg-white/80 backdrop-blur-sm"
      style={{ height: AXIS_HEIGHT }}
    >
      {ticks.map(year => {
        const x = yearToPixel(year, TIMELINE_START_YEAR, TIMELINE_END_YEAR, pxPerYear)
        return (
          <div
            key={year}
            className="absolute top-0 bottom-0 flex flex-col justify-end pb-1"
            style={{ left: x }}
          >
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
