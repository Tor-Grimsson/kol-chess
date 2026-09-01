import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from '../lib/rules.js'
import { encodeBoard, moveKey, normaliseRating, N_PLANES } from './personality.js'

/* THE CROSS-LANGUAGE CHECK.
 *
 * `train/encoding.py` builds the tensors the model is trained on;
 * `personality.js` builds the tensor it is asked with. Nothing errors if they
 * disagree — the model just receives a board from a world it never saw. The
 * fixture holds positions encoded BY PYTHON, so this compares the two encoders
 * plane by plane rather than trusting them to have been written the same way.
 *
 * Regenerate with: train/.venv39/bin/python train/emit_js.py
 */
const fixture = JSON.parse(readFileSync(new URL('./__fixtures__/encoding.json', import.meta.url)))
const moves = JSON.parse(readFileSync(new URL('../../public/models/moves.json', import.meta.url)))

test('the fixture matches this build of the encoder', () => {
  assert.equal(fixture.nPlanes, N_PLANES)
  assert.ok(fixture.cases.length >= 6)
})

for (const c of fixture.cases) {
  test(`board planes match Python — ${c.fen.split(' ').slice(0, 2).join(' ')}`, () => {
    const planes = encodeBoard(new Chess(c.fen))
    assert.equal(planes.length, c.planes.length, 'plane count')
    let firstBad = -1
    for (let i = 0; i < planes.length; i++) {
      if (planes[i] !== Number(c.planes[i])) {
        firstBad = i
        break
      }
    }
    assert.equal(
      firstBad,
      -1,
      firstBad < 0 ? '' : `plane ${Math.floor(firstBad / 64)} square ${firstBad % 64} differs`
    )
  })

  test(`legal-move indices match Python — ${c.fen.split(' ').slice(0, 2).join(' ')}`, () => {
    const chess = new Chess(c.fen)
    const flip = chess.turn() === 'b'
    const mine = chess
      .moves({ verbose: true })
      .map((m) => moves.indexOf(moveKey(m, flip)))
      .filter((i) => i >= 0)
    assert.deepEqual([...new Set(mine)].sort((a, b) => a - b), c.legal)
  })
}

test('every legal move in the fixture resolves to a real vocabulary entry', () => {
  for (const c of fixture.cases) {
    const chess = new Chess(c.fen)
    const flip = chess.turn() === 'b'
    for (const m of chess.moves({ verbose: true })) {
      assert.ok(moves.includes(moveKey(m, flip)), `${moveKey(m, flip)} missing from vocabulary`)
    }
  }
})

test('rating normalisation spans the band the model was conditioned on', () => {
  assert.equal(normaliseRating(1100), 0)
  assert.equal(normaliseRating(1900), 1)
  assert.equal(normaliseRating(1500), 0.5)
  assert.equal(normaliseRating(800), 0, 'clamped below')
  assert.equal(normaliseRating(2400), 1, 'clamped above')
})
