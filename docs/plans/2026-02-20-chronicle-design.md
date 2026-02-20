# Chronicle -- Design Document
*2026-02-20*

## Concept

A personal historical reading map. Import your book library (manually, Goodreads CSV, or StoryGraph CSV), and see your non-fiction books plotted on an interactive horizontal timeline based on the historical era each book covers -- not when you read it, not when it was published, but when it *takes place*.

The core question it answers: **"Where in history have I actually been as a reader?"**

---

## Architecture

```
Browser (React / Next.js App Router)
  localStorage ──► Book Library (all books)
  UI Components ──► Timeline, Sidebar, Add/Import

  calls Server Actions for:
    • ISBN/title lookup (Open Library API proxy)
    • Era extraction (claude-agent-sdk → Haiku)

Server (Node.js / Vercel)
  lookupBook(isbn | title+author)
    └── Open Library API → title, cover, description, subjects

  extractEras(books[])
    └── claude-agent-sdk → Haiku → {startYear, endYear, eraLabel, hasHistoricalEra}
```

**Key decisions:**
- Server is stateless -- no database, just a pass-through for API calls
- All data lives in the browser (localStorage, key: `chronicle-books`)
- Two server actions only: book lookup and era extraction
- Batch era extraction (up to 15 books per Claude call)
- No auth, no accounts for V1
- Deploy: Vercel

---

## Data Model

```typescript
interface Book {
  id: string                    // generated UUID
  title: string
  author: string
  isbn?: string
  coverUrl?: string             // from Open Library
  description?: string          // from Open Library, used for era extraction

  // Era (set by Claude, editable by user)
  startYear: number | null      // negative = BCE (e.g. -44 = 44 BCE)
  endYear: number | null
  eraLabel: string | null       // "World War II", "Ancient Rome", "Victorian Era"
  eraSource: 'auto' | 'manual' // Claude-determined or user-overridden
  hasHistoricalEra: boolean     // false = self-help/business, shown in sidebar only

  // Reading metadata
  dateRead?: string             // ISO date string
  rating?: number               // 1-5
  readingStatus: 'read' | 'currently-reading'

  // Housekeeping
  source: 'manual' | 'goodreads' | 'storygraph'
  addedAt: string               // ISO timestamp
}
```

BCE years stored as negative integers -- makes timeline math simple (`-3000` = 3000 BCE).

---

## Era Extraction Flow

```
User adds book
      │
      ▼
Step 1: Book Lookup (Server Action)
  ISBN provided?
    Yes → Open Library /api/books/ISBN:{id}
    No  → Open Library /search?title=&author=
  Returns: title, author, cover, description, subjects

      │
      ▼
Step 2: Era Extraction (Server Action)
  Batch up to 15 books per Claude call
  Model: claude-haiku, effort: low, persistSession: false
  Returns per book:
    { hasHistoricalEra, startYear, endYear, eraLabel }

  Examples:
    "Band of Brothers"  → { true,  1944,    1945,  "World War II" }
    "Atomic Habits"     → { false, null,    null,  null }
    "Sapiens"           → { true,  -300000, 2015,  "Human Prehistory" }

      │
      ▼
Step 3: Stored + placed
  hasHistoricalEra = true  → placed on river timeline
  hasHistoricalEra = false → sidebar list
  User can always edit era manually (sets eraSource: 'manual')
```

For CSV import: books batch immediately after parsing, ~7 Claude calls for 100 books, resolves in seconds.

---

## Import Flows

### Manual Entry
1. User types title/author or pastes ISBN
2. App queries Open Library → shows preview card (cover, title, author)
3. User confirms → era extraction → book added
4. If Open Library finds nothing → user fills in manually, era extraction still runs

### Goodreads CSV
1. Export from Goodreads: My Books → Import/Export → Export Library
2. Upload CSV in app → parsed client-side
3. Reads: Title, Author, ISBN13, My Rating, Date Read, Exclusive Shelf
4. Imports: `read` + `currently-reading` shelves only (skips `to-read`)
5. Batch era extraction → all books added

### StoryGraph CSV
1. Export from StoryGraph: Profile → Import/Export → Export your data
2. Same client-side flow, different column name mapping

---

## Timeline UX

### Main view: horizontal scrolling river

```
◄──────────────────────── scroll ────────────────────────►

│ 3000 BCE │ 500 BCE │   500   │  1500  │  1800  │  2000  │
│ Ancient  │Classical│Medieval │Renaiss.│Industrl│ Modern │
│──────────┼─────────┼─────────┼────────┼────────┼────────│
│          │         │         │        │  ████  │        │
│  [Book]  │         │  [Book] │        │ [Book] │[📖Now] │
│          │ [Book]  │         │ [Book] │        │        │
│          │         │         │        │ [Book] │        │
```

- Loads anchored to present, scroll left to go back in time
- Era bands as subtle colored background regions
- Each book = cover thumbnail + title card
- Cards stack vertically when books share the same era
- Wide-span books (e.g. Sapiens) shown as a horizontal bar across their full range
- Currently reading: soft pulsing outline or open-book badge
- Click any card: expands to show full details + "Edit era" button

### Sidebar
- Lists books with no historical era (self-help, business, etc.)
- Small count badge: "14 books without a historical era"
- Click to manually assign an era and move it to the timeline

### Controls
- Jump-to buttons: Ancient | Medieval | WWII | Present
- Zoom toggle: Century view / Decade view
- "Add book" button always visible

---

## Tech Stack

- **Framework**: Next.js 14+ App Router (TypeScript)
- **Styling**: Tailwind CSS
- **AI**: `@anthropic-ai/claude-agent-sdk` (piggybacks Claude Code login, no API cost)
- **Book metadata**: Open Library API (free, no key required)
- **Storage**: localStorage (key: `chronicle-books`)
- **Deploy**: Vercel

---

## Out of Scope for V1

- User accounts / auth
- Database / server-side persistence
- Social features / sharing
- Fiction books on timeline
- Export
- Categories / filtering / tags
- StoryGraph live sync (CSV only)
