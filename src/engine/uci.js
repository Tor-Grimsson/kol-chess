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
