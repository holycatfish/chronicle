import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useLibrary } from './useLibrary'
import { bandOfBrothers, atomicHabits } from '@/test/book.fixtures'

beforeEach(() => {
  localStorage.clear()
})

describe('useLibrary', () => {
  it('starts with an empty library', () => {
    const { result } = renderHook(() => useLibrary())
    expect(result.current.books).toEqual([])
  })

  it('adds a book', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    expect(result.current.books).toHaveLength(1)
    expect(result.current.books[0].title).toBe('Band of Brothers')
  })

  it('persists books to localStorage', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    const stored = JSON.parse(localStorage.getItem('chronicle-books') ?? '[]')
    expect(stored).toHaveLength(1)
  })

  it('removes a book by id', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    act(() => result.current.removeBook(bandOfBrothers.id))
    expect(result.current.books).toHaveLength(0)
  })

  it('updates a book', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    act(() => result.current.updateBook(bandOfBrothers.id, { eraSource: 'manual', startYear: 1940 }))
    expect(result.current.books[0].eraSource).toBe('manual')
    expect(result.current.books[0].startYear).toBe(1940)
  })

  it('adds multiple books at once', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBooks([bandOfBrothers, atomicHabits]))
    expect(result.current.books).toHaveLength(2)
  })

  it('does not add duplicate books (same isbn)', () => {
    const { result } = renderHook(() => useLibrary())
    act(() => result.current.addBook(bandOfBrothers))
    act(() => result.current.addBook(bandOfBrothers))
    expect(result.current.books).toHaveLength(1)
  })

  it('loads existing books from localStorage on mount', () => {
    localStorage.setItem('chronicle-books', JSON.stringify([bandOfBrothers]))
    const { result } = renderHook(() => useLibrary())
    expect(result.current.books).toHaveLength(1)
  })
})
