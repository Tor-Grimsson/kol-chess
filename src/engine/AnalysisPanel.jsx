import { useEffect, useState } from 'react'
import { useChessControls } from '@kolkrabbi/kol-chess'
import { Badge, Button } from '@kolkrabbi/kol-component'
import { useEngineState } from './EngineContext'
import GameReview from './ReviewPanel'
import { toWhiteCp, uciToSan } from './uci'
import { loadOpeningIndex } from '../openings/openings'
import { deepestOpening, epdOf } from '../openings/openingBook'

/* Split (2026-07-28 restructure): EngineControls renders in the page toolbar,
 * EngineReadout in the strip above the board — same engine, one EngineProvider
 * (see EngineContext.jsx). This file keeps the presentational halves. */

const CLASSIFICATION_VARIANT = { blunder: 'critical', mistake: 'warning', inaccuracy: 'info' }

const formatEval = (line, sideToMove) => {
  if (line.mate !== null) {
    const mate = sideToMove === 'w' ? line.mate : -line.mate
    return `#${mate}`
  }
  const pawns = toWhiteCp(line, sideToMove) / 100
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`
}

const OpeningStrip = () => {
  const { snapshots, moveIndex } = useChessControls()
  const [index, setIndex] = useState(null)
  const fen = snapshots[moveIndex]?.fen ?? null

  useEffect(() => {
    loadOpeningIndex().then(setIndex)
  }, [])

  if (!index || !fen) return null
  const opening = deepestOpening(index, snapshots, moveIndex)
  const inBook = index.has(epdOf(fen))
  const bookText =
    moveIndex === 0
      ? 'start position'
      : inBook
        ? 'in book'
        : opening
          ? `novelty land — left named theory at move ${Math.ceil((opening.ply + 1) / 2)}`
          : 'out of book'

  return (
    <div className="kol-mono-12 text-fg-secondary truncate">
      {opening && (
        <span>
          {opening.eco} {opening.name}
        </span>
      )}
      {opening && <span> · </span>}
      <span>{bookText}</span>
    </div>
  )
}

/* The toolbar half: engine toggle + live eval strip (or the opening strip
 * while the engine is off). Bounded widths — it shares a row with page nav. */
export const EngineControls = () => {
  const { engineOn, setEngineOn, snapshot, sideToMove, live, best, classification, barPct } = useEngineState()

  return (
    <div className="flex min-w-0 items-center gap-3">
      {!engineOn && <OpeningStrip />}
      {engineOn && (
        <>
          {classification && snapshot?.move?.san && (
            <Badge variant={CLASSIFICATION_VARIANT[classification]} size="sm">
              {snapshot.move.san} {classification}
            </Badge>
          )}
          <span className="kol-mono-14 w-12 text-right">{best ? formatEval(best, sideToMove) : '…'}</span>
          <div className="h-2 w-40 overflow-hidden rounded-sm border border-fg-08 bg-neutral-900">
            <div className="h-full bg-white transition-[width]" style={{ width: `${barPct}%` }} />
          </div>
          <span className="kol-mono-12 text-fg-secondary w-10">{live ? `d${live.depth}` : ''}</span>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        iconLeft="atomic-atom"
        selected={engineOn}
        onClick={() => setEngineOn((on) => !on)}
        aria-label="Toggle engine analysis"
      >
        Engine
      </Button>
    </div>
  )
}

/* The board-strip half: engine lines + opening strip while live, and the
 * Game Review block. Renders in the stage's panel position. */
export const EngineReadout = () => {
  const { engineOn, fen, sideToMove, live } = useEngineState()

  return (
    <div className="flex flex-shrink-0 flex-col gap-2">
      {engineOn && live && (
        <div className="flex flex-col gap-0.5">
          {live.lines.map((line) => (
            <div key={line.multipv} className="kol-mono-12 text-fg-secondary truncate">
              <span className="inline-block w-12 text-right">{formatEval(line, sideToMove)}</span>
              <span className="ml-3">{uciToSan(fen, line.pv).join(' ')}</span>
            </div>
          ))}
        </div>
      )}
      {engineOn && <OpeningStrip />}
      <GameReview />
    </div>
  )
}
