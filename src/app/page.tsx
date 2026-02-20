'use client'

import { useState } from 'react'
import { useLibrary } from '@/hooks/useLibrary'
import { AddBookModal } from '@/components/AddBookModal'
import { ImportModal } from '@/components/ImportModal'
import { Book } from '@/types/book'

export default function Home() {
  const { books, addBook, addBooks } = useLibrary()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  function handleImport(imported: Book[]) {
    addBooks(imported)
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

      <div className="pt-14 p-6">
        <p className="text-gray-500 text-sm">{books.length} books in library</p>
        {/* Timeline added in Task 9 */}
      </div>

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
