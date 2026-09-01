// Run: node --test src/stats/namedOpenings.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeNamedOpening, NAMED_OPENINGS } from './aggregate.js'

const KG = NAMED_OPENINGS.find((o) => o.key === 'kings-gambit')
const DUTCH = NAMED_OPENINGS.find((o) => o.key === 'dutch')

const url = (slug) => `https://www.chess.com/openings/${slug}`

const game = (slug, playerColor, playerResult, rating = 1500, month = '2019-03') => ({
  eco: url(slug),
  playerColor,
  playerResult,
  month,
  player: { rating }
})

test('splits games I played from games played AT me', () => {
  const games = [
    game('Kings-Gambit-Accepted-Bishops-Gambit', 'white', 'win'),
    game('Kings-Gambit-Accepted-Bishops-Gambit', 'white', 'loss'),
    // the opponent playing a King's Gambit at us — a different question, not merged
    game('Kings-Gambit-Accepted-Bishops-Gambit', 'black', 'win')
  ]
  const r = computeNamedOpening(games, KG)
  assert.equal(r.mine.games, 2)
  assert.equal(r.against.games, 1)
  assert.equal(r.mine.scorePct, 50)
})

test('a draw is half a point, not a loss', () => {
  const games = [
    game('Dutch-Defense', 'black', 'draw'),
    game('Dutch-Defense', 'black', 'draw'),
    game('Dutch-Defense', 'black', 'loss'),
    game('Dutch-Defense', 'black', 'loss')
  ]
  const r = computeNamedOpening(games, DUTCH)
  assert.equal(r.mine.games, 4)
  assert.equal(r.mine.scorePct, 25)
})

test('variation label drops the family words, bare line reads as Main line', () => {
  const games = [
    game('Dutch-Defense', 'black', 'win'),
    game('Dutch-Defense-Classical-Rubinstein-Variation-3...Nf6', 'black', 'win')
  ]
  const r = computeNamedOpening(games, DUTCH)
  const labels = r.variations.map((v) => v.label)
  assert.ok(labels.includes('Main line'), `bare slug should be "Main line", got ${labels}`)
  assert.ok(
    labels.some((l) => l.startsWith('Classical Rubinstein')),
    `family words should be stripped, got ${labels}`
  )
})

test('best/worst ignore small samples — a 2-game 100% is noise, not a strength', () => {
  const games = [
    // 30 games of a mediocre line
    ...Array.from({ length: 30 }, (_, i) =>
      game('Dutch-Defense-Classical', 'black', i < 15 ? 'win' : 'loss')
    ),
    // 2 games of a "perfect" line — must not win `best`
    game('Dutch-Defense-Leningrad', 'black', 'win'),
    game('Dutch-Defense-Leningrad', 'black', 'win')
  ]
  const r = computeNamedOpening(games, DUTCH)
  assert.ok(r.best, 'expected a qualifying best line')
  assert.equal(r.best.games, 30)
  assert.ok(!r.best.label.includes('Leningrad'), 'a 2-game line must not qualify as best')
})

test('a non-matching opening contributes nothing', () => {
  const games = [game('French-Defense-Exchange-Variation', 'black', 'win')]
  const r = computeNamedOpening(games, DUTCH)
  assert.equal(r.mine.games, 0)
  assert.equal(r.against.games, 0)
  assert.equal(r.best, null)
})

test('rating bands round to the hundred and carry their own score', () => {
  const games = [
    game('Dutch-Defense', 'black', 'win', 1749),
    game('Dutch-Defense', 'black', 'loss', 1751)
  ]
  const r = computeNamedOpening(games, DUTCH)
  const bands = Object.fromEntries(r.byBand.map((b) => [b.band, b.games]))
  assert.equal(bands[1700], 1, '1749 rounds to 1700')
  assert.equal(bands[1800], 1, '1751 rounds to 1800')
})

test('a missing eco is skipped rather than crashing', () => {
  const games = [{ eco: null, playerColor: 'black', playerResult: 'win', month: '2019-03', player: {} }]
  const r = computeNamedOpening(games, DUTCH)
  assert.equal(r.mine.games, 0)
})
