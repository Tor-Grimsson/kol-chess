import { Chess } from 'chess.js'

// Parse one UCI `info` line → {depth, multipv, cp, mate, pv} or null for anything else.
// Scores are from the side-to-move's perspective (UCI convention).
export const parseInfoLine = (line) => {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null
  const tokens = line.split(/\s+/)
  const result = { depth: null, multipv: 1, cp: null, mate: null, pv: [] }
  for (let i = 1; i < tokens.length; i++) {
    switch (tokens[i]) {
      case 'depth':
        result.depth = Number(tokens[++i])
        break
      case 'multipv':
        result.multipv = Number(tokens[++i])
        break
      case 'score': {
        const kind = tokens[++i]
        const value = Number(tokens[++i])
        if (kind === 'cp') result.cp = value
        else if (kind === 'mate') result.mate = value
        break
      }
      case 'pv':
        result.pv = tokens.slice(i + 1)
        i = tokens.length
        break
      default:
        break
    }
  }
  if (result.depth === null || (result.cp === null && result.mate === null)) return null
  return result
}

// Side-to-move score → white-perspective centipawns (mate folded to ±10000).
export const toWhiteCp = ({ cp, mate }, sideToMove) => {
  const raw = mate !== null && mate !== undefined ? Math.sign(mate) * 10000 : cp
  return sideToMove === 'w' ? raw : -raw
}

// UCI move list → SAN line, stopping at the first illegal token.
export const uciToSan = (fen, uciMoves, limit = 8) => {
  const chess = new Chess(fen)
  const sans = []
  for (const uci of uciMoves.slice(0, limit)) {
    try {
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined
      })
      sans.push(move.san)
    } catch {
      break
    }
  }
  return sans
}

// Eval swing (mover's perspective) → classification tag.
export const classifyMove = (prevWhiteCp, currWhiteCp, moverIsWhite) => {
  const loss = moverIsWhite ? prevWhiteCp - currWhiteCp : currWhiteCp - prevWhiteCp
  if (loss >= 300) return 'blunder'
  if (loss >= 100) return 'mistake'
  if (loss >= 50) return 'inaccuracy'
  return null
}

/* ────────────────────────── Game review math ──────────────────────────
 * Lichess win%/accuracy model, constants cribbed from Chesskit
 * (GuillaumeSD/Chesskit src/lib/engine/helpers — itself sourcing lila).
 * Review lines are WHITE-perspective: { cp, mate, pv } with cp/mate
 * already normalized (mate kept separate, NOT folded to ±10000).
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// White-perspective line → win% for white. Mate is exact 100/0.
export const winPctOfLine = ({ cp, mate }) => {
  if (mate !== null && mate !== undefined) return mate > 0 ? 100 : 0
  const winChances = 2 / (1 + Math.exp(-0.00368208 * clamp(cp, -1000, 1000))) - 1
  return 50 + 50 * winChances
}

// Per-move accuracy from consecutive white-perspective win%s (index 0 = start).
// Lichess AccuracyPercent.scala formula, + Chesskit's +1 bonus, clamped [0,100].
export const moveAccuracies = (winPcts) =>
  winPcts.slice(1).map((winPct, index) => {
    const isWhiteMove = index % 2 === 0
    const winDiff = isWhiteMove
      ? Math.max(0, winPcts[index] - winPct)
      : Math.max(0, winPct - winPcts[index])
    const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411
    return clamp(raw + 1, 0, 100)
  })

// Volatility weights: stddev of win% over a sliding window, clamped [0.5, 12].
export const accuracyWeights = (winPcts) => {
  const windowSize = clamp(Math.ceil(winPcts.length / 10), 2, 8)
  const half = Math.round(windowSize / 2)
  const weights = []
  for (let i = 1; i < winPcts.length; i++) {
    const window =
      i - half < 0
        ? winPcts.slice(0, windowSize)
        : i + half > winPcts.length
          ? winPcts.slice(-windowSize)
          : winPcts.slice(i - half, i + half)
    const mean = window.reduce((a, b) => a + b, 0) / window.length
    const std = Math.sqrt(window.reduce((a, x) => a + (x - mean) ** 2, 0) / window.length)
    weights.push(clamp(std, 0.5, 12))
  }
  return weights
}

// Per-side game accuracy: mean of volatility-weighted mean + harmonic mean.
export const gameAccuracy = (winPcts) => {
  const accuracies = moveAccuracies(winPcts)
  const weights = accuracyWeights(winPcts)
  const forSide = (remainder) => {
    const acc = accuracies.filter((_, i) => i % 2 === remainder)
    const w = weights.filter((_, i) => i % 2 === remainder)
    if (!acc.length) return null
    const weightSum = w.reduce((a, b) => a + b, 0)
    const weightedMean = acc.reduce((a, x, i) => a + x * w[i], 0) / weightSum
    const harmonicMean = acc.length / acc.reduce((a, x) => a + 1 / Math.max(x, 10), 0)
    return (weightedMean + harmonicMean) / 2
  }
  return { white: forSide(0), black: forSide(1) }
}

/* ── Brilliant/great support (ported from Chesskit src/lib/chess.ts) ── */

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const uciMoveParams = (uci) => ({
  from: uci.slice(0, 2),
  to: uci.slice(2, 4),
  promotion: uci.slice(4, 5) || undefined
})

// White-minus-black material in pawns.
export const materialDiff = (fen) => {
  const board = new Chess(fen).board().flat()
  return board.reduce((acc, square) => {
    if (!square) return acc
    const value = PIECE_VALUE[square.type]
    return square.color === 'w' ? acc + value : acc - value
  }, 0)
}

// Played move sheds material along the forced capture sequence → sacrifice.
export const isPieceSacrifice = (fen, playedUci, bestLinePvToPlay) => {
  if (!bestLinePvToPlay.length) return false
  const game = new Chess(fen)
  const whiteToPlay = game.turn() === 'w'
  const startingDiff = materialDiff(fen)

  let moves = [playedUci, ...bestLinePvToPlay]
  if (moves.length % 2 === 1) moves = moves.slice(0, -1)

  let nonCapturingBudget = 1
  const captured = { w: [], b: [] }
  for (const uci of moves) {
    try {
      const move = game.move(uciMoveParams(uci))
      if (move.captured) {
        captured[move.color].push(move.captured)
        nonCapturingBudget = 1
      } else if (--nonCapturingBudget < 0) break
    } catch {
      return false
    }
  }

  // Cancel out even exchanges; a pawn-only imbalance of ≤1 isn't a sacrifice.
  for (const piece of captured.w.slice(0)) {
    const i = captured.b.indexOf(piece)
    if (i !== -1) {
      captured.b.splice(i, 1)
      captured.w.splice(captured.w.indexOf(piece), 1)
    }
  }
  if (
    Math.abs(captured.w.length - captured.b.length) <= 1 &&
    captured.w.concat(captured.b).every((p) => p === 'p')
  ) {
    return false
  }

  const diff = materialDiff(game.fen()) - startingDiff
  return (whiteToPlay ? diff : -diff) < 0
}

// Two consecutive moves land on the same occupied square → simple recapture.
export const isSimpleRecapture = (fenTwoMovesAgo, [firstUci, secondUci]) => {
  const first = uciMoveParams(firstUci)
  const second = uciMoveParams(secondUci)
  if (first.to !== second.to) return false
  return Boolean(new Chess(fenTwoMovesAgo).get(first.to))
}

/* ── Full review classification (ported from Chesskit moveClassification.ts) ── */

const isLosingOrAlternateWinning = (winPct, altWinPct, isWhiteMove) => {
  const isLosing = isWhiteMove ? winPct < 50 : winPct > 50
  const altWinning = isWhiteMove ? altWinPct > 97 : altWinPct < 3
  return isLosing || altWinning
}

// positions: [{ lines: [{cp, mate, pv}], bestMove }] white-perspective, index-aligned
// with fens/inBook (index 0 = start). uciMoves[i] produced positions[i+1].
// Returns one classification per move: 'book' | 'forced' | 'brilliant' | 'great' |
// 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'.
export const classifyReviewMoves = (positions, uciMoves, fens, inBook) => {
  const winPcts = positions.map((p) => winPctOfLine(p.lines[0]))

  return uciMoves.map((playedMove, moveIdx) => {
    const index = moveIdx + 1
    if (inBook[index]) return 'book'

    const prev = positions[index - 1]
    if (prev.lines.length === 1) return 'forced'

    const isWhiteMove = fens[index - 1].split(' ')[1] === 'w'
    const lastWinPct = winPcts[index - 1]
    const winPct = winPcts[index]
    const winDiff = (winPct - lastWinPct) * (isWhiteMove ? 1 : -1)

    const altLine = prev.lines.filter((line) => line.pv[0] !== playedMove)[0]
    const altWinPct = altLine ? winPctOfLine(altLine) : undefined

    if (altWinPct !== undefined && winDiff >= -2) {
      const acceptable = !isLosingOrAlternateWinning(winPct, altWinPct, isWhiteMove)

      // brilliant: a sound piece sacrifice
      if (
        acceptable &&
        isPieceSacrifice(fens[index - 1], playedMove, positions[index].lines[0]?.pv ?? [])
      ) {
        return 'brilliant'
      }

      // great: turned the game around, or the only good move (skip simple recaptures)
      const isRecapture =
        index > 1 && isSimpleRecapture(fens[index - 2], [uciMoves[moveIdx - 1], playedMove])
      if (acceptable && !isRecapture) {
        const changedOutcome =
          winDiff > 10 && (lastWinPct - 50) * (winPct - 50) < 0
        const onlyGoodMove = (winPct - altWinPct) * (isWhiteMove ? 1 : -1) > 10
        if (changedOutcome || onlyGoodMove) return 'great'
      }
    }

    if (playedMove === prev.bestMove) return 'best'

    if (winDiff < -20) return 'blunder'
    if (winDiff < -10) return 'mistake'
    if (winDiff < -5) return 'inaccuracy'
    if (winDiff < -2) return 'good'
    return 'excellent'
  })
}
