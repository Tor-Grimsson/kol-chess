/* Who you can play against.
 *
 * Every book-backed opponent — me and the nine masters — is the SAME artifact
 * shape, because they all came out of `scripts/build-style-book.mjs`. That is
 * why this file is a list rather than a set of adapters: picking Tal instead of
 * me changes which JSON is fetched and nothing else in the move logic.
 *
 * Books are imported lazily and cached. A master book is 0.6–2.6 MB raw
 * (0.1–0.3 gzipped) and nobody should download Tal to play me.
 */

/* WHY FETCH AND NOT `import`.
 *
 * These were `import('./books/x.json')`, which Vite compiles into a JS CHUNK —
 * measured: the style book became 4.0 MB of JavaScript. Data that size is then
 * parsed by the JS engine rather than by `JSON.parse`, which is the slower path
 * by a wide margin, and it lands in the bundle graph where it does not belong.
 *
 * From `public/` they are copied, not bundled: fetched on demand, parsed as
 * JSON, and cached by the browser as their own files. The build no longer
 * carries 19 MB of game data through Rollup either.
 */
const BOOK_URL = (key) => `${import.meta.env.BASE_URL}books/${key === 'me' ? 'style-book' : key}.json`

/* 120×120 webp in `public/masters/`, square-cropped from each master's
 * Wikimedia Commons lead portrait; `me` is the studio portrait from the
 * website's B2 asset library (both fetched 2026-09-01). `engine` carries
 * none — the roster falls back to initials. */
const PORTRAIT = (key) => `${import.meta.env.BASE_URL}masters/${key}.webp`

export const OPPONENTS = [
  { key: 'me', label: 'Me — Biskupstunga', note: '27,200 chess.com games', rated: true, portrait: PORTRAIT('me') },
  { key: 'fischer', label: 'Bobby Fischer', note: '827 games · 1.e4 by test', rated: false, portrait: PORTRAIT('fischer') },
  { key: 'tal', label: 'Mikhail Tal', note: '2,431 games · the attack', rated: false, portrait: PORTRAIT('tal') },
  { key: 'capablanca', label: 'José Raúl Capablanca', note: '597 games · the machine', rated: false, portrait: PORTRAIT('capablanca') },
  { key: 'alekhine', label: 'Alexander Alekhine', note: '1,654 games', rated: false, portrait: PORTRAIT('alekhine') },
  { key: 'petrosian', label: 'Tigran Petrosian', note: '1,893 games · iron prophylaxis', rated: false, portrait: PORTRAIT('petrosian') },
  { key: 'botvinnik', label: 'Mikhail Botvinnik', note: '891 games · the patriarch', rated: false, portrait: PORTRAIT('botvinnik') },
  { key: 'keres', label: 'Paul Keres', note: '1,571 games', rated: false, portrait: PORTRAIT('keres') },
  { key: 'larsen', label: 'Bent Larsen', note: '2,268 games · 1.c4 and worse', rated: false, portrait: PORTRAIT('larsen') },
  { key: 'olafsson', label: 'Friðrik Ólafsson', note: "892 games · Iceland's first GM", rated: false, portrait: PORTRAIT('olafsson') },
  /* No book at all — straight Stockfish at the chosen Elo. The control group:
     it is what the others sound like with the style removed. */
  { key: 'engine', label: 'Engine only', note: 'no book — Stockfish at the set Elo', rated: true }
]

export const findOpponent = (key) => OPPONENTS.find((o) => o.key === key) ?? OPPONENTS[0]

/* Initials for a roster tile or player bar — "José Raúl Capablanca" → JC,
   "Me — …" → ME, a single word ("You") → its first two letters. Lives here
   because both the lobby roster and the play page's player bars draw it. */
export const initialsOf = (label) => {
  const clean = label.replace(/\s*—.*$/, '').trim()
  if (clean.toLowerCase() === 'me') return 'ME'
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length === 1) return clean.slice(0, 2).toUpperCase()
  return ((words[0]?.[0] ?? '') + (words[words.length - 1]?.[0] ?? '')).toUpperCase()
}

const cache = new Map()

export const loadBook = async (key) => {
  if (key === 'engine') return null
  if (cache.has(key)) return cache.get(key)
  const res = await fetch(BOOK_URL(key))
  if (!res.ok) throw new Error(`book ${key}: HTTP ${res.status}`)
  const book = await res.json()
  cache.set(key, book)
  return book
}
