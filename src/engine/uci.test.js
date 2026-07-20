// Run: node --test src/engine/uci.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import {
  parseInfoLine,
  toWhiteCp,
  uciToSan,
  classifyMove,
  winPctOfLine,
  moveAccuracies,
  gameAccuracy,
  materialDiff,
  isPieceSacrifice,
  isSimpleRecapture,
  classifyReviewMoves
} from './uci.js'
import { uciOfMove, buildReview } from './reviewRunner.js'

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

/* ── review math ── */

test('winPctOfLine — logistic on cp, exact 100/0 on mate, clamped', () => {
  assert.equal(winPctOfLine({ cp: 0, mate: null }), 50)
  assert.equal(winPctOfLine({ cp: null, mate: 3 }), 100)
  assert.equal(winPctOfLine({ cp: null, mate: -2 }), 0)
  // symmetric around 50
  const up = winPctOfLine({ cp: 150, mate: null })
  const down = winPctOfLine({ cp: -150, mate: null })
  assert.ok(Math.abs(up + down - 100) < 1e-9)
  assert.ok(up > 60 && up < 70)
  // clamp: beyond ±1000 is flat
  assert.equal(winPctOfLine({ cp: 5000, mate: null }), winPctOfLine({ cp: 1000, mate: null }))
})

test('moveAccuracies — flat evals near 100, a big drop punished for the mover', () => {
  const flat = moveAccuracies([50, 50, 50, 50])
  assert.equal(flat.length, 3)
  flat.forEach((a) => assert.ok(a > 99))
  // white move (index 0) drops white 50 → 10: low accuracy
  const [whiteBlunder] = moveAccuracies([50, 10])
  assert.ok(whiteBlunder > 10 && whiteBlunder < 20)
  // black move (index 1) that RAISES white's win% is a black error
  const accs = moveAccuracies([50, 50, 90])
  assert.ok(accs[1] < 25)
  // a gain for the mover never scores above 100
  const [gain] = moveAccuracies([50, 90])
  assert.equal(gain, 100)
})

test('gameAccuracy — per-side split, null for a side with no moves', () => {
  const flat = gameAccuracy([50, 50, 50, 50, 50])
  assert.ok(flat.white > 99 && flat.black > 99)
  // one-move game: black never moved
  const single = gameAccuracy([50, 45])
  assert.equal(single.black, null)
  assert.ok(single.white > 0)
  // white blunders both moves, black plays clean → black scores higher
  const lopsided = gameAccuracy([50, 20, 20, 2, 2])
  assert.ok(lopsided.black > lopsided.white)
})

test('materialDiff — white-minus-black in pawns', () => {
  assert.equal(materialDiff(START), 0)
  assert.equal(materialDiff('k7/8/8/8/8/8/3Q4/K7 w - - 0 1'), 9)
  assert.equal(materialDiff('k7/8/4p3/3n4/8/8/3Q4/K7 w - - 0 1'), 5)
})

test('isPieceSacrifice — QxN defended is a sac, QxQ trade is not', () => {
  // white Qd2 takes Nd5 defended by the e6 pawn: sheds Q for N
  const sacFen = 'k7/8/4p3/3n4/8/8/3Q4/K7 w - - 0 1'
  assert.equal(isPieceSacrifice(sacFen, 'd2d5', ['e6d5']), true)
  // even queen trade: not a sacrifice
  const tradeFen = 'k7/8/8/3q4/8/8/3Q4/K7 w - - 0 1'
  assert.equal(isPieceSacrifice(tradeFen, 'd2d5', ['a8b8']), false)
  assert.equal(isPieceSacrifice(sacFen, 'd2d5', []), false)
})

test('isSimpleRecapture — both moves land on the same occupied square', () => {
  // 1.e4 d5 → 2.exd5 Qxd5
  const beforeExd5 = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2'
  assert.equal(isSimpleRecapture(beforeExd5, ['e4d5', 'd8d5']), true)
  assert.equal(isSimpleRecapture(beforeExd5, ['e4d5', 'g8f6']), false)
})

// Synthetic position: two engine lines (best + one alternative), white perspective.
const pos = (cp, bestPv, altCp = cp - 40, best = null) => ({
  lines: [
    { cp, mate: null, pv: [bestPv] },
    { cp: altCp, mate: null, pv: ['h7h6'] }
  ],
  bestMove: best ?? bestPv
})

const E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

test('classifyReviewMoves — book, forced, best, and the loss tiers', () => {
  const fens = [START, E4_FEN]
  // book flag wins outright
  assert.deepEqual(
    classifyReviewMoves([pos(20, 'e2e4'), pos(20, 'e7e5')], ['e2e4'], fens, [false, true]),
    ['book']
  )
  // single legal reply → forced
  const forced = [{ lines: [{ cp: 0, mate: null, pv: ['e2e4'] }], bestMove: 'e2e4' }, pos(0, 'e7e5')]
  assert.deepEqual(classifyReviewMoves(forced, ['e2e4'], fens, [false, false]), ['forced'])
  // played the engine move, nothing dramatic → best
  assert.deepEqual(
    classifyReviewMoves([pos(20, 'e2e4'), pos(20, 'e7e5')], ['e2e4'], fens, [false, false]),
    ['best']
  )
  // win% collapse tiers (played ≠ best so the tier ladder applies)
  const drop = (cpAfter) => [
    pos(0, 'd2d4'),
    { lines: [{ cp: cpAfter, mate: null, pv: ['e7e5'] }], bestMove: 'e7e5' }
  ]
  assert.deepEqual(classifyReviewMoves(drop(-400), ['e2e4'], fens, [false, false]), ['blunder'])
  assert.deepEqual(classifyReviewMoves(drop(-150), ['e2e4'], fens, [false, false]), ['mistake'])
  assert.deepEqual(classifyReviewMoves(drop(-70), ['e2e4'], fens, [false, false]), ['inaccuracy'])
  assert.deepEqual(classifyReviewMoves(drop(-30), ['e2e4'], fens, [false, false]), ['good'])
  assert.deepEqual(classifyReviewMoves(drop(-5), ['e2e4'], fens, [false, false]), ['excellent'])
})

test('classifyReviewMoves — great when the only good move, brilliant on a sound sac', () => {
  // only good move: alternative collapses to -200 while the played move holds +200
  const great = [pos(200, 'e2e4', -200), pos(200, 'e7e5')]
  assert.deepEqual(
    classifyReviewMoves(great, ['e2e4'], [START, E4_FEN], [false, false]),
    ['great']
  )
  // sound queen sac: Qd2xNd5 (defended), eval holds
  const sacFen = 'k7/8/4p3/3n4/8/8/3Q4/K7 w - - 0 1'
  const afterSac = 'k7/8/4p3/3Q4/8/8/8/K7 b - - 0 1'
  const brilliant = [
    pos(80, 'd2d5', 30),
    { lines: [{ cp: 80, mate: null, pv: ['e6d5'] }], bestMove: 'e6d5' }
  ]
  assert.deepEqual(
    classifyReviewMoves(brilliant, ['d2d5'], [sacFen, afterSac], [false, false]),
    ['brilliant']
  )
})

test('uciOfMove — promotion recovered from SAN', () => {
  assert.equal(uciOfMove({ san: 'Nf3', from: 'g1', to: 'f3' }), 'g1f3')
  assert.equal(uciOfMove({ san: 'e8=Q+', from: 'e7', to: 'e8' }), 'e7e8q')
})

test('buildReview — assembles accuracy, counts, and per-ply moves', () => {
  const chess = new Chess()
  const snapshots = [{ fen: chess.fen(), move: null, ply: 0 }]
  for (const san of ['e4', 'e5']) {
    const move = chess.move(san)
    snapshots.push({
      fen: chess.fen(),
      move: { san: move.san, color: move.color, from: move.from, to: move.to },
      ply: snapshots.length
    })
  }
  const positions = [pos(20, 'e2e4'), pos(20, 'e7e5'), pos(15, 'g1f3')]
  const review = buildReview(snapshots, positions, new Set())
  assert.equal(review.moves.length, 2)
  assert.deepEqual(review.moves.map((m) => m.classification), ['best', 'best'])
  assert.equal(review.counts.w.best, 1)
  assert.equal(review.counts.b.best, 1)
  assert.ok(review.accuracy.white > 90 && review.accuracy.black > 90)
  // opening index flags the book move
  const bookIndex = new Set([snapshots[1].fen.split(' ').slice(0, 4).join(' ')])
  const booked = buildReview(snapshots, positions, bookIndex)
  assert.equal(booked.moves[0].classification, 'book')
})
