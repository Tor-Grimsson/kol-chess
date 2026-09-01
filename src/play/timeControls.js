/* Time controls — the ladder lichess and chess.com both use, and the clock
 * arithmetic behind it.
 *
 * The buckets are not arbitrary: a control's CLASS comes from its estimated
 * duration, base + 40 × increment, which is the formula lichess uses to decide
 * whether a game is bullet, blitz, rapid or classical. Writing the same rule
 * here means "3+2 is blitz" is derived rather than asserted, and a custom
 * control the user types gets classified by the same rule as a preset.
 */

export const classify = (baseSec, incSec = 0) => {
  const estimate = baseSec + 40 * incSec
  if (estimate < 29) return 'ultrabullet'
  if (estimate < 179) return 'bullet'
  if (estimate < 479) return 'blitz'
  if (estimate < 1499) return 'rapid'
  return 'classical'
}

/* The presets both sites put on their front page. `base` in seconds,
 * `inc` added after each move the player completes. */
export const PRESETS = [
  { id: '1+0', base: 60, inc: 0 },
  { id: '2+1', base: 120, inc: 1 },
  { id: '3+0', base: 180, inc: 0 },
  { id: '3+2', base: 180, inc: 2 },
  { id: '5+0', base: 300, inc: 0 },
  { id: '5+3', base: 300, inc: 3 },
  { id: '10+0', base: 600, inc: 0 },
  { id: '10+5', base: 600, inc: 5 },
  { id: '15+10', base: 900, inc: 10 },
  { id: '30+0', base: 1800, inc: 0 },
  { id: '30+20', base: 1800, inc: 20 }
].map((p) => ({ ...p, klass: classify(p.base, p.inc) }))

export const UNLIMITED = { id: 'Unlimited', base: null, inc: 0, klass: 'unlimited' }

export const ALL_CONTROLS = [UNLIMITED, ...PRESETS]

export const findControl = (id) => ALL_CONTROLS.find((c) => c.id === id) ?? UNLIMITED

/* mm:ss, and under ten seconds the tenths appear — the convention every clock
 * uses, because that is the range where a tenth changes what you do. */
export const formatClock = (ms) => {
  if (ms === null || ms === undefined) return '∞'
  const safe = Math.max(0, ms)
  const total = safe / 1000
  const m = Math.floor(total / 60)
  const s = total - m * 60
  if (safe < 10000) return `${m}:${s.toFixed(1).padStart(4, '0')}`
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`
}

/* How long the engine should think, given the control. A fixed 500 ms was fine
 * for an untimed page, but it makes a 1+0 bullet opponent unbearably slow in
 * relative terms and a 30+20 opponent absurdly shallow. Roughly a fortieth of
 * the base, clamped to something that still feels like a game on both ends. */
export const engineMovetime = (control) => {
  if (!control || control.base === null) return 500
  return Math.max(120, Math.min(2000, Math.round((control.base * 1000) / 40)))
}

/* HOW LONG THE BOOK SAT ON THIS MOVE (2026-08-31).
 *
 * `d` is the mean time the move actually cost, in basis points of the base
 * clock — 14 on `e4` (0.14% of the clock: he never thinks about it), 141 on
 * `c4` (he does). Scaling by the CHOSEN base is the whole point of storing a
 * ratio: the same move takes proportionally as long on whatever clock you set.
 *
 * Unlimited has no base to scale by, so it borrows a 3-minute one — otherwise
 * the one control with all the time in the world would be the only one where
 * the opponent never pauses.
 *
 * Clamped hard at both ends. Below ~150 ms a delay is not perceptible and just
 * feels like lag; above ~4 s nobody is enjoying a bot's introspection, however
 * faithful the 45-second think it came from.
 */
const NOMINAL_BASE = 180
export const MIN_THINK_MS = 150
export const MAX_THINK_MS = 4000

export const thinkTimeMs = (d, control) => {
  if (!Number.isFinite(d) || d <= 0) return null
  const base = control?.base ?? NOMINAL_BASE
  const ms = (d / 10000) * base * 1000
  return Math.round(Math.max(MIN_THINK_MS, Math.min(MAX_THINK_MS, ms)))
}
