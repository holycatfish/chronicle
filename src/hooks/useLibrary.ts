'use client'

import { useState, useEffect, useCallback } from 'react'
import { Book } from '@/types/book'
import { STORAGE_KEY } from '@/lib/constants'

function loadFromStorage(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Book[]) : []
  } catch {
    return []
  }
}

function saveToStorage(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    setBooks(loadFromStorage())
  }, [])

  const persist = useCallback((next: Book[]) => {
    setBooks(next)
    saveToStorage(next)
  }, [])

  const addBook = useCallback((book: Book) => {
    setBooks(prev => {
      // Deduplicate by ISBN if present, otherwise by id
      const isDupe = prev.some(b =>
        book.isbn ? b.isbn === book.isbn : b.id === book.id
      )
      if (isDupe) return prev
      const next = [...prev, book]
      saveToStorage(next)
      return next
    })
  }, [])

  const addBooks = useCallback((incoming: Book[]) => {
    setBooks(prev => {
      const existingIsbns = new Set(prev.map(b => b.isbn).filter(Boolean))
      const existingIds = new Set(prev.map(b => b.id))
      const filtered = incoming.filter(b =>
        !(b.isbn && existingIsbns.has(b.isbn)) && !existingIds.has(b.id)
      )
      const next = [...prev, ...filtered]
      saveToStorage(next)
      return next
    })
  }, [])

  const removeBook = useCallback((id: string) => {
    setBooks(prev => {
      const next = prev.filter(b => b.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

  const updateBook = useCallback((id: string, changes: Partial<Book>) => {
    setBooks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...changes } : b)
      saveToStorage(next)
      return next
    })
  }, [])

  return { books, addBook, addBooks, removeBook, updateBook, persist }
}
