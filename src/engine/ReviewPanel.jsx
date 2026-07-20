import { useEffect, useMemo, useRef, useState } from 'react'
import { useChessControls } from '@kolkrabbi/kol-chess'
import { Badge, Button } from '@kolkrabbi/kol-component'
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

const MoveCell = ({ entry, byPly, moveIndex, selectPly }) => {
  if (!entry) return <span className="flex-1" />
  const reviewed = byPly.get(entry.ply)
  return (
    <button
      type="button"
      onClick={() => selectPly(entry.ply)}
      className={`kol-mono-12 flex flex-1 items-center gap-1.5 rounded-sm px-1 py-0.5 text-left ${
        moveIndex === entry.ply ? 'bg-fg-08' : ''
      }`}
    >
      <span>{entry.san}</span>
      {reviewed && reviewed.classification !== 'excellent' && (
        <Badge variant={BADGE_VARIANT[reviewed.classification]} size="sm">
          {reviewed.classification}
        </Badge>
      )}
    </button>
  )
}

// One-click game review: sequential d14 pass over the loaded game.
// Renders inside ChessControlsProvider (the panel slot), below the live engine row.
const GameReview = () => {
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={start}
          disabled={state.status === 'running' || snapshots.length < 2}
          selected={state.status === 'done'}
          aria-label="Run game review"
        >
          Review
        </Button>
        {state.status === 'running' && (
          <>
            <div className="h-2 flex-1 overflow-hidden rounded-sm border border-fg-08 bg-neutral-900">
              <div
                className="h-full bg-white transition-[width]"
                style={{ width: `${(state.done / state.total) * 100}%` }}
              />
            </div>
            <span className="kol-mono-12 text-fg-secondary">
              {state.done}/{state.total}
            </span>
          </>
        )}
        {review && (
          <span className="kol-mono-14">
            White {formatAccuracy(review.accuracy.white)} · Black{' '}
            {formatAccuracy(review.accuracy.black)}
          </span>
        )}
        {state.status === 'error' && (
          <span className="kol-mono-12 text-fg-secondary">{state.message}</span>
        )}
      </div>
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
          <div className="max-h-56 overflow-y-auto">
            {notationPairs.map((pair) => (
              <div key={pair.moveNumber} className="flex items-center gap-2">
                <span className="kol-mono-12 text-fg-secondary w-6 text-right">
                  {pair.moveNumber}.
                </span>
                <MoveCell entry={pair.white} byPly={byPly} moveIndex={moveIndex} selectPly={selectPly} />
                <MoveCell entry={pair.black} byPly={byPly} moveIndex={moveIndex} selectPly={selectPly} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default GameReview
