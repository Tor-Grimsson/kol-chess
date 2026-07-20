// Run: node --test src/stats/aggregate.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  openingFamily,
  computeTotals,
  computeColourSplit,
  computeRatingSeries,
  computeRatingRecords,
  computeOpponents,
  computeOpenings,
  computeTimeClasses,
  computeActivity,
  computeStreaks,
  computeTerminations,
  computeStats
} from './aggregate.js'

const ECO = 'https://www.chess.com/openings/'

const game = (over = {}) => ({
  endTime: 1500000000,
  month: '2017-07',
  rated: true,
  timeClass: 'blitz',
  eco: `${ECO}Scandinavian-Defense-2.exd5`,
  playerColor: 'white',
  playerResult: 'win',
  player: { username: 'Me', rating: 1200 },
  opponent: { username: 'A', rating: 1100 },
  terminationCategory: 'win-resignation',
  ...over
})

// 6-game fixture with known answers
const FIX = [
  game({ endTime: 1, month: '2017-02', playerResult: 'win', opponent: { username: 'A', rating: 1000 }, player: { username: 'Me', rating: 1100 } }),
  game({ endTime: 2, month: '2017-02', playerResult: 'win', opponent: { username: 'A', rating: 1010 }, player: { username: 'Me', rating: 1110 }, playerColor: 'black', eco: `${ECO}Queens-Gambit-Accepted-3.Nf3`, terminationCategory: 'win-checkmate' }),
  game({ endTime: 3, month: '2017-03', playerResult: 'win', opponent: { username: 'B', rating: 1500 }, player: { username: 'Me', rating: 1120 } }),
  game({ endTime: 4, month: '2017-03', playerResult: 'loss', opponent: { username: 'A', rating: 1020 }, player: { username: 'Me', rating: 1090 }, terminationCategory: 'loss-time', timeClass: 'bullet' }),
  game({ endTime: 5, month: '2017-04', playerResult: 'draw', opponent: { username: 'C', rating: 1600 }, player: { username: 'Me', rating: 1095 }, playerColor: 'black', terminationCategory: 'draw-stalemate' }),
  game({ endTime: 6, month: '2017-04', playerResult: 'loss', opponent: { username: 'A', rating: 1030 }, player: { username: 'Me', rating: 1060 }, rated: false, terminationCategory: 'loss-resignation' })
]

test('openingFamily — family cut at move token / terminator, Accepted rides along', () => {
  assert.equal(openingFamily(`${ECO}Scandinavian-Defense-Mieses-Kotrc-Variation-3.Nc3`), 'Scandinavian Defense')
  assert.equal(openingFamily(`${ECO}Queens-Gambit-Accepted-3.Nf3`), 'Queens Gambit Accepted')
  assert.equal(openingFamily(`${ECO}Queens-Gambit-Declined-Modern-Variation`), 'Queens Gambit Declined')
  assert.equal(openingFamily(`${ECO}Four-Knights-Game-Spanish-Variation-Classical-Variation`), 'Four Knights Game')
  assert.equal(openingFamily(`${ECO}Kings-Fianchetto-Opening-1...e5-2.Bg2-d5`), 'Kings Fianchetto Opening')
  assert.equal(openingFamily(null), null)
  assert.equal(openingFamily('https://elsewhere.com/nope'), null)
})

test('computeTotals — W/L/D, rated count, win%', () => {
  const t = computeTotals(FIX)
  assert.equal(t.games, 6)
  assert.deepEqual([t.win, t.loss, t.draw], [3, 2, 1])
  assert.equal(t.rated, 5)
  assert.equal(t.winPct, 50)
  assert.equal(t.scorePct, (3.5 / 6) * 100)
})

test('computeColourSplit — per-colour records', () => {
  const s = computeColourSplit(FIX)
  assert.equal(s.white.games, 4)
  assert.deepEqual([s.white.win, s.white.loss, s.white.draw], [2, 2, 0])
  assert.equal(s.black.games, 2)
  assert.equal(s.black.winPct, 50)
})

test('computeRatingSeries — monthly closing rating + peak, class-filtered, rated-only', () => {
  const r = computeRatingSeries(FIX, 'blitz')
  // blitz rated games: endTime 1,2,3,5 (4 is bullet, 6 unrated)
  assert.deepEqual(r.series, [
    { x: '2017-02', y: 1110 },
    { x: '2017-03', y: 1120 },
    { x: '2017-04', y: 1095 }
  ])
  assert.deepEqual(r.peak, { rating: 1120, month: '2017-03' })
  assert.equal(r.games, 4)
})

test('computeRatingRecords — best win, highest faced, avg opponent (rated only)', () => {
  const r = computeRatingRecords(FIX)
  assert.equal(r.bestWin.opponent.rating, 1500) // beat B (1500); C (1600) was a draw
  assert.equal(r.highestFaced.opponent.rating, 1600)
  assert.equal(r.avgOpponentRating, Math.round((1000 + 1010 + 1500 + 1020 + 1600) / 5))
})

test('computeOpponents — frequency, matchup records with min sample', () => {
  const o = computeOpponents(FIX, { top: 2, minGames: 4 })
  assert.equal(o.unique, 3)
  assert.equal(o.frequent[0].username, 'A')
  assert.equal(o.frequent[0].games, 4)
  assert.equal(o.frequent[0].scorePct, 50) // 2W 2L vs A
  // only A has ≥4 games → both best and worst
  assert.equal(o.bestMatchup.username, 'A')
  assert.equal(o.worstMatchup.username, 'A')
})

test('computeOpenings — per-colour families, best needs min sample', () => {
  const o = computeOpenings(FIX, { top: 3, minGames: 3 })
  assert.equal(o.white.played[0].family, 'Scandinavian Defense')
  assert.equal(o.white.played[0].games, 4)
  assert.equal(o.black.played[0].games, 1)
  assert.equal(o.white.best.family, 'Scandinavian Defense') // 4 ≥ 3
  assert.equal(o.black.best, null) // no black family reaches 3
})

test('computeTimeClasses — sorted by volume', () => {
  const t = computeTimeClasses(FIX)
  assert.equal(t[0].timeClass, 'blitz')
  assert.equal(t[0].games, 5)
  assert.equal(t[1].timeClass, 'bullet')
})

test('computeActivity — year rows × 12 month cols', () => {
  const a = computeActivity(FIX)
  assert.deepEqual(a.years, ['2017'])
  assert.equal(a.grid[0][1], 2) // Feb
  assert.equal(a.grid[0][2], 2) // Mar
  assert.equal(a.grid[0][3], 2) // Apr
  assert.equal(a.grid[0][0], 0) // Jan
  assert.deepEqual(a.busiestMonth[1], 2)
})

test('computeStreaks — longest win and loss runs in time order', () => {
  const s = computeStreaks(FIX)
  assert.equal(s.win.length, 3)
  assert.deepEqual([s.win.start, s.win.end], ['2017-02', '2017-03'])
  assert.equal(s.loss.length, 1)
  // draw breaks a streak
  const broken = computeStreaks([
    game({ endTime: 1, playerResult: 'win' }),
    game({ endTime: 2, playerResult: 'draw' }),
    game({ endTime: 3, playerResult: 'win' })
  ])
  assert.equal(broken.win.length, 1)
})

test('computeTerminations — by method, wins/losses split', () => {
  const t = computeTerminations(FIX)
  assert.deepEqual(t.byMethod[0], { method: 'resignation', count: 3 })
  assert.deepEqual(t.wins, [{ method: 'resignation', count: 2 }, { method: 'checkmate', count: 1 }])
  assert.deepEqual(t.losses, [{ method: 'time', count: 1 }, { method: 'resignation', count: 1 }])
})

test('computeStats — assembles with dominant class + span', () => {
  const s = computeStats(FIX)
  assert.equal(s.dominantClass, 'blitz')
  assert.equal(s.totals.games, 6)
  assert.deepEqual(s.span, { from: '2017-02', to: '2017-04' })
  assert.equal(s.rating.peak.rating, 1120)
})
