import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from '../lib/rules.js'

/* PlayPage's promotion path, verbatim, on a position a real game has never
 * reached in the browser (no test game has got a pawn to the 8th). These are the
 * exact three steps `onMove` and `completePromotion` take, so a rules-engine
 * change that breaks promotion fails here rather than in someone's game.
 *
 * ponytail: no test renderer. The picker itself is static JSX over this data —
 * what can actually break is the engine contract below. */

const FEN = '4k3/P6P/8/8/8/8/8/4K3 w - - 0 1'

/* step 1 — onMove: is this from/to a promotion? */
const detect = (fen, from, to) => {
  const probe = new Chess(fen)
  return probe.moves({ verbose: true }).find((m) => m.from === from && m.to === to)
}

test('onMove recognises a promoting move and defers to the picker', () => {
  const legal = detect(FEN, 'a7', 'a8')
  assert.ok(legal, 'a7a8 must be legal')
  assert.ok(legal.promotion, 'and must be flagged as a promotion so the picker opens')
})

test('onMove does NOT flag an ordinary move as a promotion', () => {
  const legal = detect(FEN, 'e1', 'e2')
  assert.ok(legal)
  assert.equal(legal.promotion, undefined)
})

test('completePromotion commits each of the four pieces with the right SAN', () => {
  /* Q and R on a8 give check along the 8th rank; B and N do not. */
  for (const [piece, san] of [['q', 'a8=Q+'], ['r', 'a8=R+'], ['b', 'a8=B'], ['n', 'a8=N']]) {
    const probe = new Chess(FEN)
    const made = probe.move({ from: 'a7', to: 'a8', promotion: piece })
    assert.equal(made.san, san)
    assert.equal(probe.get('a8').type, piece, `${piece} must actually be on a8`)
    assert.equal(probe.turn(), 'b', 'and the turn must pass')
  }
})

test('a promoting capture is offered and commits', () => {
  const fen = 'r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1'
  const legal = detect(fen, 'b7', 'a8')
  assert.ok(legal?.promotion, 'bxa8=Q must be offered as a promotion')
  const made = new Chess(fen).move({ from: 'b7', to: 'a8', promotion: 'q' })
  assert.equal(made.san, 'bxa8=Q+')
})

test('completePromotion swallows an illegal piece instead of throwing', () => {
  /* PlayPage wraps this in try/catch and clears the picker — prove it throws so
   * that catch is not dead code. */
  assert.throws(() => new Chess(FEN).move({ from: 'a7', to: 'a8', promotion: 'k' }))
})

test('black promotes too, and underpromotion is reachable', () => {
  const fen = '4k3/8/8/8/8/8/6p1/4K3 b - - 0 1'
  const made = new Chess(fen).move({ from: 'g2', to: 'g1', promotion: 'n' })
  assert.equal(made.san, 'g1=N') // a knight on g1 does not attack e1
})
