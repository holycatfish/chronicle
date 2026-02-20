'use client'

import { useState, useRef } from 'react'
import { useLibrary } from '@/hooks/useLibrary'
import { AddBookModal } from '@/components/AddBookModal'
import { ImportModal } from '@/components/ImportModal'
import { Timeline } from '@/components/Timeline'
import { BookDetailPanel } from '@/components/BookDetailPanel'
import { Sidebar } from '@/components/Sidebar'
import { TimelineControls } from '@/components/TimelineControls'
import { Book } from '@/types/book'

export default function Home() {
  const { books, addBook, addBooks, updateBook } = useLibrary()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [zoom, setZoom] = useState<'century' | 'decade'>('century')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedBookEditMode, setSelectedBookEditMode] = useState(false)
  const timelineScrollRef = useRef<HTMLDivElement>(null)

  function handleImport(imported: Book[]) {
    addBooks(imported)
  }

  function handleBookClick(book: Book) {
    setSelectedBook(book)
    setSelectedBookEditMode(false)
  }

  function handleAssignEra(book: Book) {
    setSelectedBook(book)
    setSelectedBookEditMode(true)
  }

  function handleBookUpdate(id: string, changes: Partial<Book>) {
    updateBook(id, changes)
    // Reflect the update in the detail panel immediately
    setSelectedBook(prev => prev && prev.id === id ? { ...prev, ...changes } : prev)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-6 z-40">
        <h1 className="font-semibold text-gray-900">Chronicle</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-1.5 border text-sm rounded-lg hover:bg-gray-50"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
          >
            + Add book
          </button>
        </div>
      </nav>

      <Sidebar books={books} onAssignEra={handleAssignEra} />

      <div className="pt-14">
        <Timeline
          books={books}
          zoom={zoom}
          scrollRef={timelineScrollRef}
          onBookClick={handleBookClick}
        />
      </div>

      {selectedBook && (
        <BookDetailPanel
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdate={handleBookUpdate}
          startInEditMode={selectedBookEditMode}
        />
      )}

      <TimelineControls
        zoom={zoom}
        onZoomChange={setZoom}
        scrollRef={timelineScrollRef}
      />

      {showAddModal && (
        <AddBookModal
          onAdd={addBook}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </main>
  )
}
