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

const BATCH = 15

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

    // Batch era extraction: 15 books per call to stay within prompt limits
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
