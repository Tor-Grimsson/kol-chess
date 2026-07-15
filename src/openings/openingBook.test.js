// Run: node --test src/openings/openingBook.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { buildOpeningIndex, deepestOpening, epdOf } from './openingBook.js'

const TSV = [
  'B00\tKing\'s Pawn Game\t1. e4',
  'B01\tScandinavian Defense\t1. e4 d5',
  'B01\tScandinavian Defense: Mieses-Kotroc Variation\t1. e4 d5 2. exd5 Qxd5'
].join('\n')

const snapshotsFor = (sans) => {
  const chess = new Chess()
  const snapshots = [{ fen: chess.fen() }]
  for (const san of sans) {
    chess.move(san)
    snapshots.push({ fen: chess.fen() })
  }
  return snapshots
}

test('buildOpeningIndex keys lines by final position', () => {
  const index = buildOpeningIndex(TSV)
  assert.equal(index.size, 3)
  const chess = new Chess()
  chess.move('e4')
  assert.equal(index.get(epdOf(chess.fen())).name, "King's Pawn Game")
})

test('deepestOpening returns the last named position up to the current ply', () => {
  const index = buildOpeningIndex(TSV)
  const snapshots = snapshotsFor(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3'])
  assert.equal(deepestOpening(index, snapshots, 1).name, "King's Pawn Game")
  assert.equal(deepestOpening(index, snapshots, 2).name, 'Scandinavian Defense')
  assert.equal(
    deepestOpening(index, snapshots, 4).name,
    'Scandinavian Defense: Mieses-Kotroc Variation'
  )
  // past book: still the deepest name seen so far
  assert.equal(deepestOpening(index, snapshots, 5).ply, 4)
  assert.equal(deepestOpening(index, snapshots, 0), null)
})
