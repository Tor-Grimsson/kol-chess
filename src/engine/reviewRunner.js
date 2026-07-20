import { Chess } from 'chess.js'
import {
  parseInfoLine,
  winPctOfLine,
  moveAccuracies,
  gameAccuracy,
  classifyReviewMoves
} from './uci.js'
import { epdOf } from '../openings/openingBook.js'

// Same lite single-threaded build the live panel uses (public/engine, re-copy on bump).
const ENGINE_URL = '/engine/stockfish-18-lite-single.js'

// Snapshot move → UCI string; promotion recovered from SAN ("e8=Q+" → "e7e8q").
export const uciOfMove = (move) => {
  const eq = move.san.indexOf('=')
  const promotion = eq === -1 ? '' : move.san[eq + 1].toLowerCase()
  return `${move.from}${move.to}${promotion}`
}

// Side-to-move UCI score → white perspective, mate kept separate (not folded to cp).
const normalizeLine = (info, sideToMove) => ({
  cp: info.cp === null ? null : sideToMove === 'w' ? info.cp : -info.cp,
  mate: info.mate === null ? null : sideToMove === 'w' ? info.mate : -info.mate,
  pv: info.pv
})

// Terminal position (engine answers `bestmove (none)` with no pv lines) — synthesize.
const terminalLines = (fen) => {
  const chess = new Chess(fen)
  if (chess.isCheckmate()) return [{ cp: null, mate: chess.turn() === 'w' ? -1 : 1, pv: [] }]
  return [{ cp: 0, mate: null, pv: [] }]
}

// Sequential engine pass over every position, one worker, fixed depth.
// Resolves [{ lines: [{cp, mate, pv}] white-perspective, bestMove }].
export const runGameReview = (fens, { depth = 14, multipv = 2, onProgress, signal } = {}) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(ENGINE_URL)
    const positions = []
    let lines = []
    let index = 0

    const finish = (err, result) => {
      worker.terminate()
      if (err) reject(err)
      else resolve(result)
    }

    signal?.addEventListener('abort', () => finish(new Error('review cancelled')))

    const searchNext = () => {
      if (signal?.aborted) return
      if (index >= fens.length) {
        finish(null, positions)
        return
      }
      lines = []
      worker.postMessage(`position fen ${fens[index]}`)
      worker.postMessage(`go depth ${depth}`)
    }

    worker.onmessage = (event) => {
      const line = String(event.data)
      if (line === 'uciok') {
        worker.postMessage(`setoption name MultiPV value ${multipv}`)
        worker.postMessage('isready')
      } else if (line === 'readyok') {
        searchNext()
      } else if (line.startsWith('bestmove')) {
        const sideToMove = fens[index].split(' ')[1]
        const bestUci = line.split(/\s+/)[1]
        const collected = lines.filter(Boolean).map((info) => normalizeLine(info, sideToMove))
        positions.push({
          lines: collected.length ? collected : terminalLines(fens[index]),
          bestMove: bestUci && bestUci !== '(none)' ? bestUci : null
        })
        index += 1
        onProgress?.(index, fens.length)
        searchNext()
      } else {
        const info = parseInfoLine(line)
        if (info) lines[info.multipv - 1] = info
      }
    }
    worker.onerror = (event) => finish(event.error ?? new Error('engine worker failed'))

    worker.postMessage('uci')
  })

// Pure assembly: engine positions + snapshots + opening index → the review.
export const buildReview = (snapshots, positions, openingIndex) => {
  const fens = snapshots.map((s) => s.fen)
  const uciMoves = snapshots.slice(1).map((s) => uciOfMove(s.move))
  const inBook = fens.map((fen, i) => i > 0 && Boolean(openingIndex?.has(epdOf(fen))))

  const classifications = classifyReviewMoves(positions, uciMoves, fens, inBook)
  const winPcts = positions.map((p) => winPctOfLine(p.lines[0]))
  const accuracies = moveAccuracies(winPcts)

  const moves = snapshots.slice(1).map((s, i) => ({
    ply: s.ply,
    san: s.move.san,
    color: s.move.color,
    classification: classifications[i],
    accuracy: accuracies[i]
  }))

  const counts = { w: {}, b: {} }
  moves.forEach((m) => {
    counts[m.color][m.classification] = (counts[m.color][m.classification] ?? 0) + 1
  })

  return { accuracy: gameAccuracy(winPcts), moves, counts, winPcts }
}
