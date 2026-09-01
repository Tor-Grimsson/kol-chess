/* The engine tier: where in a game do I actually lose the thread?
 *
 * THE BUDGET, MEASURED NOT GUESSED (2026-08-30, this machine, Stockfish 18
 * lite single-threaded): one d14 search averages **376 ms**. That makes a
 * 60-ply game ~23 seconds, and the full 27,200-game archive **about 7 days** of
 * continuous CPU. So a complete sweep is not a thing that can happen in a
 * browser tab, and no amount of care in the code changes that.
 *
 * What fits is a SAMPLE, and the useful unit is a position rather than a game.
 * Spending the budget on 300 positions spread over many games buys wider
 * coverage than the same seconds spent finishing five games — and the question
 * is per-phase, so scattering across games is what the question wants anyway.
 *
 * Phases are ply bands, not engine judgements: opening is where the book
 * usually still applies, endgame is where material has thinned. The boundaries
 * are stated in PHASES and are deliberately crude — a sharper split would need
 * material counting, and the extra precision would not change the answer to
 * "which third of the game leaks".
 */

import { Chess } from '../lib/rules.js'

export const PHASES = [
  { key: 'opening', label: 'Opening', from: 0, to: 20 },
  { key: 'middlegame', label: 'Middlegame', from: 20, to: 50 },
  { key: 'endgame', label: 'Endgame', from: 50, to: Infinity }
]

export const phaseOf = (ply) => PHASES.find((p) => ply >= p.from && ply < p.to)?.key ?? 'endgame'

/* One sampled position: the FEN to search, whose move it was, and which phase
 * it belongs to. Built from a PGN without an engine, so this half is free. */
export const positionsFromPgn = (pgn, me) => {
  const chess = new Chess()
  try {
    chess.loadPgn(pgn)
  } catch {
    return []
  }
  const h = chess.header()
  const iAmWhite = h.White === me
  if (!iAmWhite && h.Black !== me) return []

  return chess
    .history({ verbose: true })
    .map((m, ply) => ({
      fenBefore: m.before,
      fenAfter: m.after,
      san: m.san,
      ply,
      mine: m.color === (iAmWhite ? 'w' : 'b'),
      phase: phaseOf(ply)
    }))
    .filter((p) => p.mine)
}

/* Take `count` positions spread as evenly as the pool allows across phases, so
 * a long game cannot dominate the endgame bucket on its own. `rand` is
 * injectable to keep the selection testable. */
export const stratify = (pool, count, rand = Math.random) => {
  const byPhase = new Map(PHASES.map((p) => [p.key, []]))
  for (const p of pool) byPhase.get(p.phase)?.push(p)

  const want = Math.max(1, Math.floor(count / PHASES.length))
  const picked = []
  for (const { key } of PHASES) {
    const list = byPhase.get(key) ?? []
    /* shuffle by sorting on a random key — the pool is small enough that the
       cost is irrelevant and the intent is obvious */
    const shuffled = [...list].sort(() => rand() - 0.5)
    picked.push(...shuffled.slice(0, want))
  }
  /* if a phase was short, top up from whatever is left rather than under-sample */
  if (picked.length < count) {
    const chosen = new Set(picked)
    const rest = pool.filter((p) => !chosen.has(p)).sort(() => rand() - 0.5)
    picked.push(...rest.slice(0, count - picked.length))
  }
  return picked.slice(0, count)
}

/* Fold the engine's per-position win% into a per-phase reading.
 *
 * `winPcts[i]` is the win probability (white's perspective) BEFORE my move i,
 * and `winPctsAfter[i]` the same after it. The drop across my own move, signed
 * to my colour, is what I gave away — averaged per phase, that is the leak.
 */
export const summarise = (samples, drops) => {
  const acc = new Map(PHASES.map((p) => [p.key, { n: 0, total: 0, worst: null }]))
  samples.forEach((s, i) => {
    const d = drops[i]
    if (!Number.isFinite(d)) return
    const bucket = acc.get(s.phase)
    if (!bucket) return
    bucket.n += 1
    bucket.total += d
    if (!bucket.worst || d > bucket.worst.loss) bucket.worst = { ...s, loss: d }
  })
  return PHASES.map((p) => {
    const b = acc.get(p.key)
    return {
      key: p.key,
      label: p.label,
      samples: b.n,
      avgLoss: b.n ? b.total / b.n : null,
      worst: b.worst
    }
  })
}
