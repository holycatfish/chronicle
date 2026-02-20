import { describe, it, expect } from 'vitest'
import { parseGoodreadsCsv, parseStorygraphCsv } from './parseCsv'

const GOODREADS_CSV = `Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies
1,Band of Brothers,Stephen E. Ambrose,"Ambrose, Stephen E.",,="0743224540",="9780743224543",5,4.47,Simon & Schuster,Paperback,336,2001,1992,2024/01/15,2024/01/01,,shelf1,read,,,,1,0
2,Atomic Habits,James Clear,"Clear, James",,="0735211299",="9780735211292",4,4.38,Avery,Hardcover,320,2018,2018,2023/06/20,2023/06/01,,shelf2,read,,,,1,0
3,To Kill a Mockingbird,Harper Lee,"Lee, Harper",,="0061935020",="9780061935022",5,4.27,Harper Perennial,Paperback,336,2002,1960,,,, ,to-read,,,,0,0`

const STORYGRAPH_CSV = `Title,Authors,Read Status,Star Rating,Review,Tags,Number of Pages,Publication Year,ISBN/UID,Read Dates,Owned?
Band of Brothers,Stephen E. Ambrose,read,5.0,,history,336,2001,9780743224543,2024-01-01 to 2024-01-15,false
Atomic Habits,James Clear,currently-reading,,,self-help,320,2018,9780735211292,,false
The Hobbit,J.R.R. Tolkien,to-read,,,,310,1937,9780547928227,,false`

describe('parseGoodreadsCsv', () => {
  it('parses read books from Goodreads CSV', () => {
    const books = parseGoodreadsCsv(GOODREADS_CSV)
    expect(books).toHaveLength(2) // only 'read' shelf, not 'to-read'
    expect(books[0].title).toBe('Band of Brothers')
    expect(books[0].author).toBe('Stephen E. Ambrose')
    expect(books[0].isbn).toBe('9780743224543')
    expect(books[0].rating).toBe(5)
    expect(books[0].dateRead).toBe('2024-01-15')
    expect(books[0].readingStatus).toBe('read')
    expect(books[0].source).toBe('goodreads')
  })

  it('handles currently-reading status', () => {
    // Replace 'to-read' with 'currently-reading' to test that shelf is included
    const csv = GOODREADS_CSV.replace('to-read', 'currently-reading')
    const books = parseGoodreadsCsv(csv)
    expect(books).toHaveLength(3)
    expect(books[2].readingStatus).toBe('currently-reading')
  })

  it('strips = and quotes from ISBN fields', () => {
    const books = parseGoodreadsCsv(GOODREADS_CSV)
    expect(books[0].isbn).toBe('9780743224543')
    expect(books[0].isbn).not.toContain('=')
    expect(books[0].isbn).not.toContain('"')
  })
})

describe('parseStorygraphCsv', () => {
  it('parses read and currently-reading books from StoryGraph CSV', () => {
    const books = parseStorygraphCsv(STORYGRAPH_CSV)
    expect(books).toHaveLength(2) // skips to-read
    expect(books[0].title).toBe('Band of Brothers')
    expect(books[1].readingStatus).toBe('currently-reading')
    expect(books[0].source).toBe('storygraph')
  })

  it('maps rating correctly', () => {
    const books = parseStorygraphCsv(STORYGRAPH_CSV)
    expect(books[0].rating).toBe(5)
  })
})
