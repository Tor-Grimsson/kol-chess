import { useEffect, useState } from 'react'
import { useChessControls } from '@kolkrabbi/kol-chess'
import { Badge, Button } from '@kolkrabbi/kol-component'
import { useEngine } from './useEngine'
import { toWhiteCp, uciToSan, classifyMove } from './uci'
import { loadOpeningIndex } from '../openings/openings'
import { deepestOpening, epdOf } from '../openings/openingBook'

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

// Renders inside ChessControlsProvider via ChessAnalysisLayout's `panel` slot.
// Engine is opt-in per session — the worker only exists while toggled on.
const AnalysisPanel = () => {
  const { snapshots, moveIndex } = useChessControls()
  const [engineOn, setEngineOn] = useState(false)
  const snapshot = snapshots[moveIndex]
  const fen = snapshot?.fen ?? null
  const analysis = useEngine(fen, { enabled: engineOn })
  const [evalByFen, setEvalByFen] = useState({})

  const sideToMove = fen?.split(' ')[1] ?? 'w'
  const live = analysis && analysis.fen === fen ? analysis : null
  const best = live?.lines?.[0]
  const whiteCp = best ? toWhiteCp(best, sideToMove) : null

  useEffect(() => {
    if (live && live.depth >= 12 && whiteCp !== null) {
      setEvalByFen((prev) => (prev[fen] === whiteCp ? prev : { ...prev, [fen]: whiteCp }))
    }
  }, [live, whiteCp, fen])

  const prevFen = moveIndex > 0 ? snapshots[moveIndex - 1]?.fen : null
  const classification =
    prevFen && evalByFen[prevFen] !== undefined && evalByFen[fen] !== undefined
      ? classifyMove(evalByFen[prevFen], evalByFen[fen], moveIndex % 2 === 1)
      : null

  const barPct =
    whiteCp === null
      ? 50
      : Math.min(97, Math.max(3, 50 + 50 * (2 / (1 + Math.exp(-whiteCp / 400)) - 1)))

  return (
    <div className="flex flex-shrink-0 flex-col gap-2">
      <div className="flex items-center gap-3">
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
        {engineOn && (
          <>
            <span className="kol-mono-14 w-12 text-right">{best ? formatEval(best, sideToMove) : '…'}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-sm border border-fg-08 bg-neutral-900">
              <div className="h-full bg-white transition-[width]" style={{ width: `${barPct}%` }} />
            </div>
            <span className="kol-mono-12 text-fg-secondary w-10">{live ? `d${live.depth}` : ''}</span>
            {classification && snapshot?.move?.san && (
              <Badge variant={CLASSIFICATION_VARIANT[classification]} size="sm">
                {snapshot.move.san} {classification}
              </Badge>
            )}
          </>
        )}
        {!engineOn && <OpeningStrip />}
      </div>
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
    </div>
  )
}

export default AnalysisPanel
