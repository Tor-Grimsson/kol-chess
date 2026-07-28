import { createContext, useContext, useEffect, useState } from 'react'
import { useChessControls } from '@kolkrabbi/kol-chess'
import { useEngine } from './useEngine'
import { toWhiteCp, classifyMove } from './uci'

/* Engine state, lifted out of the old AnalysisPanel so the CONTROLS (toolbar
 * row) and the READOUT (strip above the board) can render in different places
 * while sharing one worker + one eval history. Must mount inside
 * ChessControlsProvider. */

const EngineStateContext = createContext(null)

export const useEngineState = () => {
  const ctx = useContext(EngineStateContext)
  if (!ctx) throw new Error('useEngineState requires <EngineProvider>')
  return ctx
}

export const EngineProvider = ({ children }) => {
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
    <EngineStateContext.Provider
      value={{ engineOn, setEngineOn, snapshot, fen, sideToMove, live, best, classification, barPct }}
    >
      {children}
    </EngineStateContext.Provider>
  )
}
