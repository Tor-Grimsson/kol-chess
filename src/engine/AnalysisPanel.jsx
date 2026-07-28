import { useEffect, useState } from 'react'
import { useChessControls } from '@kolkrabbi/kol-chess'
import { Badge } from '@kolkrabbi/kol-component'
import { useEngineState } from './EngineContext'
import { toWhiteCp, uciToSan } from './uci'
import { loadOpeningIndex } from '../openings/openings'
import { deepestOpening, epdOf } from '../openings/openingBook'

/* EngineTab (2026-07-28, rail-tabs fix): the whole engine surface lives in
 * the rail's Engine tab — eval bar, lines, opening strip, stacked vertically.
 * Selecting the tab IS the intent: `active` turns the engine on (no inner
 * toggle — direct-intent law); once on it stays on so the readout survives
 * tab switches. State comes from EngineProvider (EngineContext.jsx).
 * No own padding — the rail's column spine provides it. */

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

export const EngineTab = ({ active = false }) => {
  const { engineOn, setEngineOn, snapshot, fen, sideToMove, live, best, classification, barPct } = useEngineState()

  useEffect(() => {
    if (active) setEngineOn(true)
  }, [active, setEngineOn])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="kol-helper-12 text-fg-80">ENGINE</span>
        {engineOn && (
          <div className="flex items-center gap-3">
            <span className="kol-mono-14 text-right">{best ? formatEval(best, sideToMove) : '…'}</span>
            <span className="kol-mono-12 text-fg-secondary w-10">{live ? `d${live.depth}` : ''}</span>
          </div>
        )}
      </div>
      {engineOn && (
        <div className="h-2 w-full overflow-hidden rounded-sm border border-fg-08 bg-neutral-900">
          <div className="h-full bg-white transition-[width]" style={{ width: `${barPct}%` }} />
        </div>
      )}
      {engineOn && classification && snapshot?.move?.san && (
        <div>
          <Badge variant={CLASSIFICATION_VARIANT[classification]} size="sm">
            {snapshot.move.san} {classification}
          </Badge>
        </div>
      )}
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
      <OpeningStrip />
    </div>
  )
}
