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

export const OPPONENTS = [
  { key: 'me', label: 'Me — Biskupstunga', note: '27,200 chess.com games', rated: true },
  { key: 'fischer', label: 'Bobby Fischer', note: '827 games · 1.e4 by test', rated: false },
  { key: 'tal', label: 'Mikhail Tal', note: '2,431 games · the attack', rated: false },
  { key: 'capablanca', label: 'José Raúl Capablanca', note: '597 games · the machine', rated: false },
  { key: 'alekhine', label: 'Alexander Alekhine', note: '1,654 games', rated: false },
  { key: 'petrosian', label: 'Tigran Petrosian', note: '1,893 games · iron prophylaxis', rated: false },
  { key: 'botvinnik', label: 'Mikhail Botvinnik', note: '891 games · the patriarch', rated: false },
  { key: 'keres', label: 'Paul Keres', note: '1,571 games', rated: false },
  { key: 'larsen', label: 'Bent Larsen', note: '2,268 games · 1.c4 and worse', rated: false },
  { key: 'olafsson', label: 'Friðrik Ólafsson', note: "892 games · Iceland's first GM", rated: false },
  /* No book at all — straight Stockfish at the chosen Elo. The control group:
     it is what the others sound like with the style removed. */
  { key: 'engine', label: 'Engine only', note: 'no book — Stockfish at the set Elo', rated: true }
]

export const findOpponent = (key) => OPPONENTS.find((o) => o.key === key) ?? OPPONENTS[0]

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
