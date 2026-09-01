// Run: node --test src/play/styleBook.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candidates, pickMove, weightOf, scoreRate, bookDepth, epdOf } from './styleBook.js'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'
const startFen = `${START} 0 1`

/* e4 played 100× scoring 50%, d4 played 10× scoring 90% */
const positions = {
  [START]: {
    e4: { n: 100, s: 100, y: { 2017: 90, 2024: 10 }, b: { 1400: 90, 1900: 10 } },
    d4: { n: 10, s: 18, y: { 2024: 10 }, b: { 1900: 10 } }
  }
}

test('epdOf drops the move counters so transpositions share a key', () => {
  assert.equal(epdOf(startFen), START)
  assert.equal(epdOf(`${START} 12 34`), epdOf(`${START} 0 1`))
})

test('scoreRate reads half-points as a 0..1 rate', () => {
  assert.equal(scoreRate({ n: 100, s: 100 }), 0.5)
  assert.equal(scoreRate({ n: 10, s: 20 }), 1)
  assert.equal(scoreRate({ n: 0, s: 0 }), 0)
})

test('with no slice, weight is just how often I played it', () => {
  const c = candidates(positions, startFen)
  assert.equal(c[0].san, 'e4')
  assert.equal(c[0].weight, 100)
  assert.equal(c[1].weight, 10)
})

test('a period slice re-weights toward that era', () => {
  // 2024: e4 only 10, d4 all 10 — d4 should close the gap or overtake
  const plain = candidates(positions, startFen)
  const era = candidates(positions, startFen, { year: '2024', fidelity: 1 })
  const ratioPlain = plain.find((c) => c.san === 'd4').weight / plain.find((c) => c.san === 'e4').weight
  const ratioEra = era.find((c) => c.san === 'd4').weight / era.find((c) => c.san === 'e4').weight
  assert.ok(ratioEra > ratioPlain, `2024 should favour d4 more than the whole corpus does (${ratioEra} vs ${ratioPlain})`)
})

test('THE LIBERTY: a slice with no data degrades to style instead of going silent', () => {
  // 1600 appears in neither move's band map — the book must still answer
  const c = candidates(positions, startFen, { band: 1600, fidelity: 1 })
  assert.ok(c.length === 2, 'both moves must survive an empty slice')
  assert.ok(c.every((x) => x.weight > 0), 'weights must stay positive so the book never runs dry')
  assert.equal(c[0].san, 'e4', 'and the fallback ordering is my overall preference')
})

test('fidelity 0 ignores the slice entirely', () => {
  const a = candidates(positions, startFen, { year: '2024', fidelity: 0 })
  const b = candidates(positions, startFen)
  assert.deepEqual(a.map((x) => [x.san, x.weight]), b.map((x) => [x.san, x.weight]))
})

test('sharpness biases toward the better-scoring move', () => {
  const flat = candidates(positions, startFen, { sharpness: 0 })
  const sharp = candidates(positions, startFen, { sharpness: 4 })
  const gap = (list) => list.find((c) => c.san === 'd4').weight / list.find((c) => c.san === 'e4').weight
  assert.ok(gap(sharp) > gap(flat), 'the 90% move should gain ground as sharpness rises')
})

test('sharpness 0 still allows a move I never scored with — play me as I am', () => {
  const withLoser = {
    [START]: {
      e4: { n: 10, s: 10, y: {}, b: {} },
      h4: { n: 5, s: 0, y: {}, b: {} } // never won with it
    }
  }
  const c = candidates(withLoser, startFen, { sharpness: 0 })
  assert.equal(c.length, 2)
  assert.ok(c.find((x) => x.san === 'h4').weight > 0)
})

test('off-book returns nothing rather than guessing', () => {
  assert.deepEqual(candidates(positions, '8/8/8/8/8/8/8/K6k w - - 0 1'), [])
  assert.equal(pickMove(positions, '8/8/8/8/8/8/8/K6k w - - 0 1'), null)
})

test('pickMove samples the distribution, not just the top move', () => {
  // rand just below 1 must fall through to the last (lowest-weight) candidate
  const low = pickMove(positions, startFen, {}, () => 0.999999)
  assert.equal(low.san, 'd4')
  // rand at 0 takes the heaviest
  const high = pickMove(positions, startFen, {}, () => 0)
  assert.equal(high.san, 'e4')
})

test('bookDepth counts leading plies that are in book and stops at the first miss', () => {
  const fens = [startFen, 'off-the-book w - - 0 1', startFen]
  assert.equal(bookDepth(positions, fens), 1)
  assert.equal(bookDepth(positions, []), 0)
})

test('weightOf never returns a negative or NaN weight', () => {
  for (const opts of [{}, { year: '1999' }, { band: 9999 }, { sharpness: 8, fidelity: 1 }]) {
    const w = weightOf({ n: 3, s: 0, y: {}, b: {} }, opts)
    assert.ok(Number.isFinite(w) && w > 0, `bad weight ${w} for ${JSON.stringify(opts)}`)
  }
})

/* ── the conditioning marginals (2026-08-31) ── */

const conditioned = {
  [START]: {
    e4: { n: 100, s: 100, y: {}, b: {}, o: { 1200: 80, 1800: 20 }, t: { blitz: 100 } },
    d4: { n: 20, s: 30, y: {}, b: {}, o: { 1800: 20 }, t: { bullet: 20 } }
  }
}

test('an opponent band re-weights toward what I play against THAT strength', () => {
  const plain = candidates(conditioned, startFen)
  const strong = candidates(conditioned, startFen, { oppBand: 1800, fidelity: 1 })
  const ratio = (l) => l.find((c) => c.san === 'd4').weight / l.find((c) => c.san === 'e4').weight
  assert.ok(ratio(strong) > ratio(plain), 'd4 is my answer to 1800s and should gain there')
})

test('time class conditions independently of rating', () => {
  const bullet = candidates(conditioned, startFen, { timeClass: 'bullet', fidelity: 1 })
  const blitz = candidates(conditioned, startFen, { timeClass: 'blitz', fidelity: 1 })
  assert.equal(blitz[0].san, 'e4', 'blitz is where e4 lives')
  const d4Bullet = bullet.find((c) => c.san === 'd4').weight
  const d4Blitz = blitz.find((c) => c.san === 'd4').weight
  assert.ok(d4Bullet > d4Blitz, 'd4 is bullet-only and should weigh more there')
})

test('combining marginals takes the SMALLEST — an upper bound, never a product', () => {
  // e4: o[1800]=20, t[blitz]=100 -> the joint cannot exceed 20
  const both = candidates(conditioned, startFen, { oppBand: 1800, timeClass: 'blitz', fidelity: 1 })
  const e4 = both.find((c) => c.san === 'e4')
  // fidelity 1 -> weight is the slice itself (or the 2% floor, whichever is larger)
  assert.ok(e4.weight <= 20 + 1e-9, `joint must not exceed the rarest marginal, got ${e4.weight}`)
})

test('a book without o/t still answers — historical books have neither', () => {
  const historical = { [START]: { e4: { n: 50, s: 60 } } }
  const c = candidates(historical, startFen, { oppBand: 1800, timeClass: 'blitz', fidelity: 1 })
  assert.equal(c.length, 1)
  assert.ok(c[0].weight > 0, 'must degrade to style, not go silent')
})
