import { useEffect, useMemo, useRef, useState } from 'react'
import { useChessControls, NotationPanel } from '@kolkrabbi/kol-chess'
import { Badge } from '@kolkrabbi/kol-component'
import { runGameReview, buildReview } from './reviewRunner'
import { loadOpeningIndex } from '../openings/openings'

/* Same semantics as the live badges (inaccuracy/mistake/blunder unchanged);
 * the honor tiers lean on success, the quiet tiers stay secondary/outline. */
const BADGE_VARIANT = {
  brilliant: 'success',
  great: 'success',
  best: 'success',
  excellent: 'secondary',
  good: 'secondary',
  book: 'outline',
  forced: 'outline',
  inaccuracy: 'info',
  mistake: 'warning',
  blunder: 'critical'
}

const COUNT_ORDER = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'blunder'
]

const formatAccuracy = (value) => (value === null ? '—' : value.toFixed(1))

// Game review: sequential d14 pass over the loaded game. Selecting the
// Review tab IS the intent (direct-intent law) — `active` auto-starts the
// pass, no inner Run button. No own padding — the rail's spine provides it.
const GameReview = ({ active = false }) => {
  const { snapshots, selectedGame, selectPly, moveIndex, notationPairs } = useChessControls()
  const [state, setState] = useState({ status: 'idle' })
  const abortRef = useRef(null)

  const gameKey = selectedGame?.id ?? selectedGame?.pgn ?? null

  /* Game switch invalidates a running or finished review. */
  useEffect(() => {
    abortRef.current?.abort()
    setState({ status: 'idle' })
  }, [gameKey])

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setState({ status: 'running', done: 0, total: snapshots.length })
    try {
      const [positions, openingIndex] = await Promise.all([
        runGameReview(
          snapshots.map((s) => s.fen),
          {
            signal: controller.signal,
            onProgress: (done, total) => setState({ status: 'running', done, total })
          }
        ),
        loadOpeningIndex()
      ])
      setState({ status: 'done', review: buildReview(snapshots, positions, openingIndex) })
    } catch (err) {
      if (!controller.signal.aborted) setState({ status: 'error', message: err.message })
    }
  }

  const review = state.status === 'done' ? state.review : null
  const byPly = useMemo(
    () => new Map((review?.moves ?? []).map((move) => [move.ply, move])),
    [review]
  )

  /* Direct intent: the tab being active starts the pass. Game switch resets
   * to idle (above), so a new game re-reviews while the tab stays selected.
   * 'error' is not 'idle' — no retry loop. */
  useEffect(() => {
    if (active && state.status === 'idle' && snapshots.length >= 2) start()
  }, [active, state.status, gameKey, snapshots.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="kol-helper-12 text-fg-80">REVIEW</span>
        {review && (
          <span className="kol-mono-14">
            White {formatAccuracy(review.accuracy.white)} · Black{' '}
            {formatAccuracy(review.accuracy.black)}
          </span>
        )}
      </div>
      {state.status === 'running' && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-sm border border-fg-08 bg-neutral-900">
            <div
              className="h-full bg-white transition-[width]"
              style={{ width: `${(state.done / state.total) * 100}%` }}
            />
          </div>
          <span className="kol-mono-12 text-fg-secondary">
            {state.done}/{state.total}
          </span>
        </div>
      )}
      {state.status === 'error' && (
        <span className="kol-mono-12 text-fg-secondary">{state.message}</span>
      )}
      {state.status === 'idle' && snapshots.length < 2 && (
        <span className="kol-mono-12 text-fg-secondary">Load a game to review.</span>
      )}
      {review && (
        <>
          <div className="flex flex-wrap gap-1">
            {COUNT_ORDER.filter(
              (c) => (review.counts.w[c] ?? 0) + (review.counts.b[c] ?? 0) > 0
            ).map((c) => (
              <Badge key={c} variant={BADGE_VARIANT[c]} size="sm">
                {c} {review.counts.w[c] ?? 0}–{review.counts.b[c] ?? 0}
              </Badge>
            ))}
          </div>
          <NotationPanel
            notationPairs={notationPairs}
            activePly={moveIndex}
            onSelectPly={selectPly}
            decorate={(entry) => {
              const r = byPly.get(entry.ply)
              return r && r.classification !== 'excellent' ? (
                <Badge variant={BADGE_VARIANT[r.classification]} size="sm">
                  {r.classification}
                </Badge>
              ) : null
            }}
          />
        </>
      )}
    </div>
  )
}

export default GameReview
