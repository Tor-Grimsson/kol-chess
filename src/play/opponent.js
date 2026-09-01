/* The opponent's move: book first, engine second.
 *
 * A one-shot engine ask, deliberately NOT `useEngine`. That hook is an
 * ANALYSIS driver — it streams deepening lines for a position the user is
 * looking at, and keeps searching until the position changes. Playing a move is
 * the opposite shape: one question, one answer, worker gone. Reusing the hook
 * here would mean holding a permanent analysis worker for a page that wants a
 * single bestmove per turn, and reading its top line at an arbitrary moment
 * rather than when the engine has finished.
 *
 * STRENGTH IS THE ENGINE'S JOB OUT OF BOOK. `UCI_LimitStrength` + `UCI_Elo` are
 * both present in the bundled Stockfish 18 lite (verified 2026-08-30), so the
 * fallback plays at a stated rating instead of at full power. Without this the
 * bot is "me for six moves, then a grandmaster", which is not a model of anyone.
 */

const ENGINE_URL = '/engine/stockfish-18-lite-single.js'

/* Stockfish's own floor/ceiling for UCI_Elo. Asking outside the range is
 * silently ignored by the engine, which would hand back a full-strength move
 * while the UI claimed 1200 — so it is clamped here where it is visible. */
export const ELO_MIN = 1320
export const ELO_MAX = 3190

export const clampElo = (elo) => Math.max(ELO_MIN, Math.min(ELO_MAX, Math.round(elo)))

/* One move from the engine at a stated strength. Resolves to a UCI move string
 * ('e2e4', 'e7e8q') or null if the engine has nothing (mate/stalemate). */
export const engineMove = (fen, { elo = 1600, movetime = 500, signal } = {}) =>
  new Promise((resolve, reject) => {
    let worker
    try {
      worker = new Worker(ENGINE_URL)
    } catch (err) {
      reject(err)
      return
    }

    let settled = false
    const done = (value, err) => {
      if (settled) return
      settled = true
      worker.terminate()
      if (err) reject(err)
      else resolve(value)
    }

    /* An aborted turn must not leave a worker searching in the background —
       every new game and every unmount goes through here. */
    const onAbort = () => done(null)
    signal?.addEventListener('abort', onAbort, { once: true })

    worker.onerror = (e) => done(null, new Error(e.message || 'engine worker failed'))

    worker.onmessage = ({ data }) => {
      const line = typeof data === 'string' ? data : data?.data
      if (typeof line !== 'string') return

      if (line === 'uciok') {
        /* Strength must be set BEFORE the search, and LimitStrength must come
           before Elo — the engine ignores an Elo it is not limiting to. */
        worker.postMessage('setoption name UCI_LimitStrength value true')
        worker.postMessage(`setoption name UCI_Elo value ${clampElo(elo)}`)
        worker.postMessage('isready')
        return
      }
      if (line === 'readyok') {
        worker.postMessage(`position fen ${fen}`)
        /* movetime, not depth: a fixed depth at a limited Elo still thinks for
           wildly different wall-clock times per position, and this is a live
           opponent — the human is watching a clock, not a node count. */
        worker.postMessage(`go movetime ${movetime}`)
        return
      }
      if (line.startsWith('bestmove')) {
        const uci = line.split(/\s+/)[1]
        done(!uci || uci === '(none)' ? null : uci)
      }
    }

    worker.postMessage('uci')
  })

/* A UCI move string → the {from, to, promotion} the rules adapter wants. */
export const uciToMove = (uci) =>
  uci && uci.length >= 4
    ? { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
    : null
