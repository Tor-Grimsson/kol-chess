/* The style book — how /play decides what "I" would play in a position.
 *
 * The artifact is built by `scripts/build-style-book.mjs`; this file is the
 * read side. Shape:
 *
 *   { meta, p: { "<epd>": { "<san>": { n, s, y, b, o, t } } } }
 *
 *   n  times I played this move from this position
 *   s  my score from those games in HALF-POINTS (2 win, 1 draw, 0 loss)
 *   y  count by year          b  count by MY rating band
 *   o  count by OPPONENT band t  count by time class
 *   (o/t are absent on historical books — those PGNs carry no Elo or clock)
 *
 * THE THREE LAYERS (user ruling 2026-08-30). The mistake this design replaces
 * was hard-filtering the corpus to one rating bucket and calling the remainder
 * the model — which throws away 26,771 of 27,200 games to honour a label, and
 * leaves a 1900 book that runs out after three moves.
 *
 *   STYLE     the base weight is `n` over the WHOLE corpus. Never filtered away.
 *   PERIOD    year/band are a re-WEIGHTING of the same entries, blended against
 *             the base by `fidelity`. At fidelity 1 a thin slice still falls
 *             back to my overall preference instead of going silent, so the
 *             1900 model plays 1900-ish and never runs dry. That blend is the
 *             deliberate liberty; `fidelity` is what exposes it as a choice.
 *   STRENGTH  `sharpness` biases toward my better-SCORING moves. 0 = play me as
 *             I am, warts included. Higher = play my best self. It is not the
 *             engine dial (that is UCI_Elo, applied out of book) — this one
 *             picks between moves I actually played.
 */

const HALF_POINTS_PER_GAME = 2

/* FEN minus the halfmove/fullmove counters. Same key the builder writes and the
 * same one `src/openings/openingBook.js` uses — transpositions collapse onto one
 * entry, which is why the book is keyed by position and never by opening name. */
export const epdOf = (fen) => fen.split(' ').slice(0, 4).join(' ')

/* Score rate in [0,1] — s is half-points, so the denominator is 2 per game. */
export const scoreRate = (e) => (e.n > 0 ? e.s / (e.n * HALF_POINTS_PER_GAME) : 0)

/* How much of this move's history sits inside the requested slice.
 *
 * Four independent marginals, never a joint distribution — the builder stores
 * `y` (year), `b` (my rating), `o` (OPPONENT rating) and `t` (time class)
 * separately, not their cross product. So the joint is unknowable and the
 * honest bound is the SMALLEST marginal: a move cannot have been played inside
 * every requested slice more often than it was played inside the rarest one.
 *
 * `o` is the one that fixes a real distortion. Without it a move's weight —
 * and its score — is averaged over whoever happened to be across the board, so
 * a line played mostly against weaker opposition looks stronger than it is.
 * Asking for an opponent band makes the bot play "me against someone your
 * strength" rather than me against everyone. */
const MARGINAL = { year: 'y', band: 'b', oppBand: 'o', timeClass: 't' }

const sliceCount = (e, opts) => {
  const asked = Object.entries(MARGINAL).filter(([k]) => opts[k] !== null && opts[k] !== undefined)
  if (!asked.length) return e.n
  let smallest = Infinity
  for (const [k, field] of asked) smallest = Math.min(smallest, e[field]?.[opts[k]] ?? 0)
  return smallest === Infinity ? e.n : smallest
}

/* One move's weight. The blend is what stops a thin slice from silencing the
 * book: `fidelity` 0 ignores the slice entirely (pure style), 1 leans on it as
 * hard as the data allows while still carrying a floor of base preference. */
export const weightOf = (e, opts = {}) => {
  const { fidelity = 0.7, sharpness = 0 } = opts
  const base = e.n
  const slice = sliceCount(e, opts)
  const periodic = (1 - fidelity) * base + fidelity * slice
  /* the floor: even at fidelity 1, a move keeps a whisper of its base weight so
     a slice with no data degrades to style rather than to nothing */
  const w = Math.max(periodic, base * 0.02)
  if (!sharpness) return w
  /* sharpness biases by score rate; ^sharpness keeps 0 a no-op and grows
     monotonically. A move I never scored with can still be picked at
     sharpness 0, which is the point of "play me as I am". */
  return w * Math.pow(0.05 + scoreRate(e), sharpness)
}

/* The score rate is the WHOLE-history one: `s` is only stored in total, not per
 * marginal, so a slice re-weights which moves get picked but cannot restate what
 * they scored inside that slice. Said here rather than implied, because a number
 * labelled "62%" next to an opponent-band filter would otherwise read as "62%
 * against that band", which the data cannot support. */

/* Every candidate for a position, weighted and ordered. Returns [] off-book. */
export const candidates = (bookPositions, fen, opts = {}) => {
  const entry = bookPositions?.[epdOf(fen)]
  if (!entry) return []
  return Object.entries(entry)
    .map(([san, e]) => ({
      san,
      n: e.n,
      scorePct: scoreRate(e) * 100,
      /* `d` — mean think-time as basis points of the base clock, from the
         `[%clk]` records. Absent on books built from PGN with no clocks (every
         master), and on the handful of my own games that carry none. */
      d: e.d,
      weight: weightOf(e, opts)
    }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight)
}

/* Weighted pick. `rand` is injectable so the choice is testable — a bot that
 * always plays its top move is a different (and duller) opponent than one that
 * plays the distribution, and the distribution IS the style. */
export const pickMove = (bookPositions, fen, opts = {}, rand = Math.random) => {
  const list = candidates(bookPositions, fen, opts)
  if (!list.length) return null
  const total = list.reduce((a, c) => a + c.weight, 0)
  let r = rand() * total
  for (const c of list) {
    r -= c.weight
    if (r <= 0) return c
  }
  return list[list.length - 1]
}

/* What the page shows about book state: how deep I am in my own history, and
 * how much of it is behind the current position. */
export const bookDepth = (bookPositions, fens) => {
  let plies = 0
  for (const fen of fens) {
    if (!bookPositions?.[epdOf(fen)]) break
    plies++
  }
  return plies
}
