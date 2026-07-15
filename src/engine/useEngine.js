import { useEffect, useRef, useState } from 'react'
import { parseInfoLine } from './uci'

// ponytail: single-threaded lite build — no COOP/COEP headers needed anywhere.
// Files are copied from node_modules/stockfish/bin into public/engine (re-copy on bump).
const ENGINE_URL = '/engine/stockfish-18-lite-single.js'

// Drives one Stockfish worker: analyse `fen`, stream {fen, depth, lines} as it deepens.
// Position changes mid-search: stop → (bestmove drains) → next search starts.
export const useEngine = (fen, { multipv = 3, depth = 18, enabled = true } = {}) => {
  const stateRef = useRef({ ready: false, searching: false, pendingFen: null, currentFen: null })
  const startRef = useRef(null)
  const requestRef = useRef(null)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setAnalysis(null)
      return undefined
    }
    const worker = new Worker(ENGINE_URL)
    const state = stateRef.current
    let lines = []

    startRef.current = (nextFen) => {
      state.searching = true
      state.currentFen = nextFen
      lines = []
      worker.postMessage(`position fen ${nextFen}`)
      worker.postMessage(`go depth ${depth}`)
    }

    requestRef.current = (nextFen) => {
      if (state.currentFen === nextFen && state.searching) return
      if (!state.ready || state.searching) {
        state.pendingFen = nextFen
        if (state.searching) worker.postMessage('stop')
        return
      }
      startRef.current(nextFen)
    }

    const drainPending = () => {
      if (!state.pendingFen) return
      const next = state.pendingFen
      state.pendingFen = null
      startRef.current(next)
    }

    worker.onmessage = (event) => {
      const line = String(event.data)
      if (line === 'uciok') {
        worker.postMessage(`setoption name MultiPV value ${multipv}`)
        worker.postMessage('isready')
      } else if (line === 'readyok') {
        state.ready = true
        drainPending()
      } else if (line.startsWith('bestmove')) {
        state.searching = false
        drainPending()
      } else {
        const info = parseInfoLine(line)
        if (!info || !state.searching) return
        lines[info.multipv - 1] = info
        setAnalysis({
          fen: state.currentFen,
          depth: lines[0]?.depth ?? info.depth,
          lines: lines.filter(Boolean)
        })
      }
    }

    worker.postMessage('uci')
    return () => {
      worker.terminate()
      startRef.current = null
      requestRef.current = null
      Object.assign(state, { ready: false, searching: false, pendingFen: null, currentFen: null })
    }
    // multipv/depth are page constants — deliberately not reactive
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (enabled && fen) requestRef.current?.(fen)
  }, [fen, enabled])

  return analysis
}
