import { Chess } from 'chess.js'

// Accepts chess.com game URLs in their common shapes:
//   chess.com/game/live/123, /game/daily/123, /live/game/123, /analysis/game/live/123
export const parseChessComUrl = (input) => {
  const match = input.match(
    /chess\.com\/(?:analysis\/)?(?:game\/(?:live|daily)|live\/game|game)\/(\d+)/i
  )
  return match ? match[1] : null
}

const headerOr = (headers, key, fallback) => headers[key] || fallback

// Pasted PGN → the externalGame shape ChessControlsProvider expects.
export const resolvePgn = (pgn) => {
  const chess = new Chess()
  chess.loadPgn(pgn) // throws on invalid PGN
  const headers = chess.header()
  return {
    id: `pasted-${Date.now()}`,
    pgn,
    player: { username: headerOr(headers, 'White', 'White') },
    opponent: { username: headerOr(headers, 'Black', 'Black') },
    timeClass: headers.TimeClass ?? null,
    timeControl: headers.TimeControl ?? null,
    opening: headers.Opening ? { name: headers.Opening } : null,
    eco: headers.ECO ?? null,
    playerColor: 'white',
    termination: headers.Termination ?? null
  }
}

// URL of one of the user's own games → archive lookup via the data adapter.
export const resolveOwnGameUrl = async (gameId, chessData) => {
  const games = await chessData.loadFullDataset()
  const match = games.find((g) => {
    const id = g.url ? parseChessComUrl(g.url) : null
    return id === gameId
  })
  if (!match) {
    throw new Error(
      'Game not found in your archive. Only your own chess.com games resolve by URL — paste the PGN instead (Share → PGN on chess.com).'
    )
  }
  const pgn = await chessData.getGamePgnByIdAsync(match.id, match.month)
  if (!pgn) {
    throw new Error('Found the game but its PGN failed to load from the CDN.')
  }
  return { ...match, pgn }
}

// Single entry point: URL or PGN, returns an externalGame or throws with a user-facing message.
export const resolveGameInput = async (raw, chessData) => {
  const input = raw.trim()
  if (!input) {
    throw new Error('Paste a chess.com game URL or a PGN.')
  }
  if (/chess\.com\//i.test(input)) {
    const gameId = parseChessComUrl(input)
    if (!gameId) {
      throw new Error('That chess.com URL has no game ID I can read.')
    }
    return resolveOwnGameUrl(gameId, chessData)
  }
  try {
    return resolvePgn(input)
  } catch {
    throw new Error('Could not parse that as PGN. Copy it from chess.com via Share → PGN.')
  }
}
