// Run: node --test src/insights/autopsy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from '../lib/rules.js'
import { walkLine, epdOf } from './autopsy.js'

/* Build the two books by replaying real moves, so the fixtures are keyed the
 * same way the builder keys them rather than by hand-written FENs. */
const mk = (moves) => {
  const book = { p: {} }
  const reply = { p: {} }
  const c = new Chess()
  for (const [san, n, scorePct, side] of moves) {
    const target = side === 'mine' ? book : reply
    const epd = epdOf(c.fen())
    target.p[epd] = target.p[epd] || {}
    target.p[epd][san] = { n, s: Math.round((scorePct / 100) * n * 2) }
    c.move(san)
  }
  return { book, reply }
}

const KG = { key: 'kg', label: "King's Gambit", side: 'white', prefix: ['e4', 'e5', 'f4'] }

test('walks alternating books and marks which moves are mine', () => {
  const { book, reply } = mk([
    ['e4', 100, 50, 'mine'],
    ['e5', 100, 50, 'theirs'],
    ['f4', 100, 50, 'mine'],
    ['exf4', 90, 55, 'theirs'],
    ['Nf3', 80, 54, 'mine']
  ])
  const r = walkLine(Chess, book, reply, KG, { minGames: 10 })
  assert.ok(r.reachable)
  const sans = r.nodes.map((n) => n.san)
  assert.deepEqual(sans, ['exf4', 'Nf3'])
  assert.equal(r.nodes[0].mine, false, 'exf4 is the opponent')
  assert.equal(r.nodes[1].mine, true, 'Nf3 is mine')
})

test('drop is measured against the node before it', () => {
  const { book, reply } = mk([
    ['e4', 100, 50, 'mine'],
    ['e5', 100, 50, 'theirs'],
    ['f4', 100, 50, 'mine'],
    ['exf4', 90, 60, 'theirs'],
    ['Nf3', 80, 50, 'mine']
  ])
  const r = walkLine(Chess, book, reply, KG, { minGames: 10 })
  const nf3 = r.nodes.find((n) => n.san === 'Nf3')
  assert.equal(Math.round(nf3.drop), -10)
  assert.equal(r.worst.san, 'Nf3')
})

test('a better sibling is surfaced only when it clears the margin', () => {
  const c = new Chess()
  c.move('e4'); c.move('e5'); c.move('f4'); c.move('exf4')
  const epd = epdOf(c.fen())
  const book = { p: { [epd]: {
    Nf3: { n: 100, s: 100 },      // 50%
    Bc4: { n: 50, s: 60 },        // 60% — clears +3
    Qh5: { n: 40, s: 41 }         // 51.25% — inside the margin, not "better"
  } } }
  const reply = { p: {} }
  // seed the opponent reply so the walk reaches my move
  const c2 = new Chess(); c2.move('e4'); c2.move('e5'); c2.move('f4')
  reply.p[epdOf(c2.fen())] = { exf4: { n: 90, s: 90 } }

  const r = walkLine(Chess, book, reply, KG, { minGames: 10 })
  const mine = r.nodes.find((n) => n.mine)
  assert.equal(mine.san, 'Nf3', 'the most-played move is the main road')
  assert.ok(mine.betterSibling, 'a 60% alternative should surface')
  assert.equal(mine.betterSibling.san, 'Bc4')
  assert.ok(!mine.siblings.some((s) => s.san === 'Qh5' && s === mine.betterSibling))
})

test('a thin node stops the walk rather than reporting noise', () => {
  const { book, reply } = mk([
    ['e4', 100, 50, 'mine'],
    ['e5', 100, 50, 'theirs'],
    ['f4', 100, 50, 'mine'],
    ['exf4', 3, 55, 'theirs'] // below minGames
  ])
  const r = walkLine(Chess, book, reply, KG, { minGames: 15 })
  assert.equal(r.nodes.length, 0)
  assert.equal(r.worst, null)
})

test('an unreachable prefix reports itself instead of throwing', () => {
  const bad = { key: 'x', label: 'X', side: 'white', prefix: ['e4', 'e4'] }
  const r = walkLine(Chess, { p: {} }, { p: {} }, bad)
  assert.equal(r.reachable, false)
  assert.deepEqual(r.nodes, [])
})

test('an empty book yields an empty walk, not a crash', () => {
  const r = walkLine(Chess, { p: {} }, { p: {} }, KG)
  assert.equal(r.nodes.length, 0)
  assert.equal(r.missed.length, 0)
})
