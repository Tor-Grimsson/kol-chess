// Run: node --test src/engine/uci.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseInfoLine, toWhiteCp, uciToSan, classifyMove } from './uci.js'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

test('parseInfoLine extracts depth/multipv/score/pv', () => {
  const line =
    'info depth 18 seldepth 24 multipv 2 score cp 34 nodes 1200000 nps 800000 time 1500 pv e2e4 e7e5 g1f3'
  assert.deepEqual(parseInfoLine(line), {
    depth: 18,
    multipv: 2,
    cp: 34,
    mate: null,
    pv: ['e2e4', 'e7e5', 'g1f3']
  })
  assert.equal(parseInfoLine('info depth 5 currmove e2e4'), null)
  assert.equal(parseInfoLine('bestmove e2e4'), null)
  const mate = parseInfoLine('info depth 12 multipv 1 score mate -3 pv e2e4')
  assert.equal(mate.mate, -3)
})

test('toWhiteCp normalizes side-to-move scores', () => {
  assert.equal(toWhiteCp({ cp: 50, mate: null }, 'w'), 50)
  assert.equal(toWhiteCp({ cp: 50, mate: null }, 'b'), -50)
  assert.equal(toWhiteCp({ cp: null, mate: -2 }, 'b'), 10000)
})

test('uciToSan converts and stops at illegal moves', () => {
  assert.deepEqual(uciToSan(START, ['e2e4', 'e7e5', 'g1f3']), ['e4', 'e5', 'Nf3'])
  assert.deepEqual(uciToSan(START, ['e2e4', 'e2e4']), ['e4'])
})

test('classifyMove thresholds from the mover perspective', () => {
  assert.equal(classifyMove(0, -320, true), 'blunder')
  assert.equal(classifyMove(0, -120, true), 'mistake')
  assert.equal(classifyMove(0, -60, true), 'inaccuracy')
  assert.equal(classifyMove(0, -20, true), null)
  assert.equal(classifyMove(0, 320, false), 'blunder')
})
