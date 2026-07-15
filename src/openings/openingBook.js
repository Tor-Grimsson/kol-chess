import { Chess } from 'chess.js'

// Position key: FEN without move counters (EPD), so transpositions match.
export const epdOf = (fen) => fen.split(' ').slice(0, 4).join(' ')

// TSV line format (lichess-org/chess-openings): eco \t name \t pgn
// Returns Map<epd, {eco, name}> keyed by each line's FINAL position.
// ponytail: ~3,800 PGN replays ≈ under a second, built once, lazily — precompute
// to JSON at build time if init cost ever matters.
export const buildOpeningIndex = (tsv) => {
  const index = new Map()
  const chess = new Chess()
  for (const line of tsv.split('\n')) {
    if (!line) continue
    const [eco, name, pgn] = line.split('\t')
    if (!pgn) continue
    try {
      chess.loadPgn(pgn)
    } catch {
      continue
    }
    index.set(epdOf(chess.fen()), { eco, name })
  }
  return index
}

// Deepest named position in snapshots[0..upTo] → {eco, name, ply} or null.
export const deepestOpening = (index, snapshots, upTo) => {
  let hit = null
  for (let i = 0; i <= upTo && i < snapshots.length; i++) {
    const entry = index.get(epdOf(snapshots[i].fen))
    if (entry) hit = { ...entry, ply: i }
  }
  return hit
}
