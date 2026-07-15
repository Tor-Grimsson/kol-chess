// Run: node --test src/lib/resolveGame.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseChessComUrl, resolvePgn, resolveGameInput } from './resolveGame.js'

const PGN = `[White "Biskupstunga"]
[Black "DARTH-ZANE"]
[TimeControl "600"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *`

test('parseChessComUrl handles the common URL shapes', () => {
  assert.equal(parseChessComUrl('https://www.chess.com/game/live/1960894102'), '1960894102')
  assert.equal(parseChessComUrl('https://chess.com/game/daily/42'), '42')
  assert.equal(parseChessComUrl('https://www.chess.com/live/game/987?move=3'), '987')
  assert.equal(parseChessComUrl('https://www.chess.com/analysis/game/live/55'), '55')
  assert.equal(parseChessComUrl('https://www.chess.com/openings/Sicilian'), null)
})

test('resolvePgn builds an externalGame from headers', () => {
  const game = resolvePgn(PGN)
  assert.equal(game.player.username, 'Biskupstunga')
  assert.equal(game.opponent.username, 'DARTH-ZANE')
  assert.equal(game.eco, 'C50')
  assert.ok(game.pgn.includes('1. e4'))
})

test('resolveGameInput routes URL → archive lookup and attaches pgn', async () => {
  const chessData = {
    loadFullDataset: async () => [
      { id: 'uuid-1', url: 'https://www.chess.com/game/live/111', month: '2020-11' }
    ],
    getGamePgnByIdAsync: async (id, month) =>
      id === 'uuid-1' && month === '2020-11' ? PGN : null
  }
  const game = await resolveGameInput('https://www.chess.com/game/live/111', chessData)
  assert.equal(game.id, 'uuid-1')
  assert.equal(game.pgn, PGN)
  await assert.rejects(
    () => resolveGameInput('https://www.chess.com/game/live/999', chessData),
    /not found in your archive/
  )
})

test('resolveGameInput rejects garbage with a usable message', async () => {
  await assert.rejects(() => resolveGameInput('not a game', {}), /Could not parse/)
  await assert.rejects(() => resolveGameInput('   ', {}), /Paste a chess\.com/)
})
