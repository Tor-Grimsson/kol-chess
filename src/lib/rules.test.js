import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Chess as Legacy } from 'chess.js'
import { Chess, epdOf, INITIAL_FEN } from './rules.js'

const PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[White "alice"]
[Black "bob"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. e5 Qxe5 8. d3 Bh6 9. Nc3 Ne7 10. Bd2 Nbc6 11. Rae1 Qf5 12. Nd5 Kd8 13. Bc3 Rg8 14. Bg7 1-0`

test('plays SAN and reports position like chess.js', () => {
  const mine = new Chess()
  const theirs = new Legacy()
  for (const san of ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6']) {
    mine.move(san)
    theirs.move(san)
    assert.equal(mine.fen(), theirs.fen(), `fen diverged at ${san}`)
    assert.equal(mine.turn(), theirs.turn())
  }
  assert.deepEqual(mine.history(), theirs.history())
})

test('legal move list matches chess.js exactly', () => {
  const mine = new Chess()
  const theirs = new Legacy()
  for (const san of ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7']) {
    assert.deepEqual(
      mine.moves().slice().sort(),
      theirs.moves().slice().sort(),
      `move list diverged before ${san}`
    )
    mine.move(san)
    theirs.move(san)
  }
})

test('loadPgn gives the same headers, history and final position', () => {
  const mine = new Chess().loadPgn(PGN)
  const theirs = new Legacy()
  theirs.loadPgn(PGN)
  assert.equal(mine.header().White, 'alice')
  assert.equal(mine.header().Result, '1-0')
  assert.deepEqual(mine.history(), theirs.history())
  assert.equal(mine.fen(), theirs.fen())

  const mv = mine.history({ verbose: true })
  const tv = theirs.history({ verbose: true })
  assert.equal(mv.length, tv.length)
  for (let i = 0; i < mv.length; i++) {
    assert.equal(mv[i].san, tv[i].san, `san at ply ${i}`)
    assert.equal(mv[i].before, tv[i].before, `before at ply ${i}`)
    assert.equal(mv[i].after, tv[i].after, `after at ply ${i}`)
    assert.equal(mv[i].from, tv[i].from)
    assert.equal(mv[i].to, tv[i].to)
  }
})

test('loadPgn throws on junk, so callers can catch it', () => {
  assert.throws(() => new Chess().loadPgn('not a pgn at all'))
})

test('board() matches chess.js shape and material sums equal', () => {
  const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
  const mine = new Chess(fen).board()
  const theirs = new Legacy(fen).board()
  assert.equal(mine.length, 8)
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const a = mine[r][f]
      const b = theirs[r][f]
      if (!a || !b) {
        assert.equal(Boolean(a), Boolean(b), `square ${r},${f}`)
        continue
      }
      assert.equal(a.type, b.type)
      assert.equal(a.color, b.color)
      assert.equal(a.square, b.square)
    }
  }
})

test('promotion produces the right SAN for all four pieces', () => {
  const fen = '8/P6k/8/8/8/8/6K1/8 w - - 0 1'
  for (const [piece, san] of [['q', 'a8=Q'], ['r', 'a8=R'], ['b', 'a8=B'], ['n', 'a8=N']]) {
    const made = new Chess(fen).move({ from: 'a7', to: 'a8', promotion: piece })
    assert.equal(made.san, san)
  }
})

test('checkmate and draw agree with chess.js', () => {
  const mate = new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3')
  assert.equal(mate.isCheckmate(), true)
  assert.equal(mate.isGameOver(), true)
  const stale = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
  assert.equal(stale.isStalemate(), true)
  assert.equal(stale.isDraw(), true)
  assert.equal(stale.isCheckmate(), false)
})

/* THE REASON THIS MODULE EXISTS. chess.js 1.4.0 offers no castle here at all. */
test('Chess960: the king castles onto its own rook', () => {
  const fen = '4k3/8/8/8/8/8/8/RK6 w A - 0 1'
  /* Here the king on b1 can BOTH step to c1 and castle (landing on c1), so the
   * landing square is ambiguous and the castle must be published on the rook
   * square. Both moves stay reachable and mean different things. */
  const offered = new Chess(fen).dests().get('b1')
  assert.ok(offered.includes('a1'), 'the castle is offered on the rook square')
  assert.ok(offered.includes('c1'), 'the plain king step is still offered')

  const mine = new Chess(fen)
  const castle = mine.move({ from: 'b1', to: 'a1' })
  assert.equal(castle.san, 'O-O-O')
  assert.equal(castle.to, 'a1', 'unambiguous form is preserved')
  assert.equal(mine.fen(), '4k3/8/8/8/8/8/8/2KR4 b - - 1 1')

  const step = new Chess(fen).move({ from: 'b1', to: 'c1' })
  assert.equal(step.san, 'Kc1', 'the same square as a plain move stays a plain move')

  /* chess.js cannot even LOAD this position — Shredder-FEN castling rights are
   * rejected outright. If this stops throwing, chess.js gained 960 and the
   * migration is worth revisiting. */
  assert.throws(() => new Legacy(fen), /castling availability is invalid/)
})

/* A KNOWN, ACCEPTED DIFFERENCE. chessops resolves SAN by piece and target and
 * ignores a spurious capture flag; chess.js rejects the token. The resulting
 * position is identical — it is the move the notation meant — and leniency is
 * what 27k scraped chess.com PGNs want. Documented so it is not read as a bug. */
test('sloppy SAN: chessops recovers where chess.js refuses', () => {
  const fen = '4k3/8/8/8/8/8/8/4K2R w K - 0 1'
  /* h8 is empty, so the capture flag is wrong — the intended move is plainly Rh8 */
  assert.equal(new Chess(fen).move('Rxh8').san, 'Rh8+')
  assert.throws(() => new Legacy(fen).move('Rxh8'))
})

test('castling reports the king square, not the rook square', () => {
  const c = new Chess()
  for (const san of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']) c.move(san)
  const short = c.dests().get('e1')
  assert.ok(short.includes('g1'), 'the board must be offered g1')
  assert.ok(!short.includes('h1'), 'h1 is chessops internals and must not leak')
  const made = c.move({ from: 'e1', to: 'g1' })
  assert.equal(made.san, 'O-O')
  assert.equal(made.to, 'g1')
  assert.equal(made.lan, 'e1g1')
})

test('Chess960: a shuffled start position is playable', () => {
  const fen = 'bqnbnrkr/pppppppp/8/8/8/8/PPPPPPPP/BQNBNRKR w KQkq - 0 1'
  const c = new Chess(fen)
  assert.equal(c.turn(), 'w')
  assert.ok(c.moves().length > 0)
  c.move('e4')
  assert.equal(c.turn(), 'b')
  assert.ok(c.fen().includes('bqnbnrkr'))
})

test('dests is the Map<from, to[]> the board seam needs', () => {
  const d = new Chess().dests()
  assert.equal(d.get('e2').sort().join(','), 'e3,e4')
  assert.deepEqual(d.get('g1').sort(), ['f3', 'h3'])
  assert.equal(d.has('e7'), false, 'only the side to move has dests')
})

test('an illegal move throws rather than returning null', () => {
  assert.throws(() => new Chess().move('e5'))
  assert.throws(() => new Chess().move({ from: 'e2', to: 'e5' }))
})

test('epdOf strips the counters', () => {
  assert.equal(epdOf(INITIAL_FEN), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -')
})

/* THE SEAM THE BOARD NOW CONSUMES (kol-chess 0.10.0). `dests()` is handed
 * straight to `<ChessBoard dests>`, so its shape is a contract with the DS, not
 * an internal detail — a Map keyed by square with an array of target squares. */
test('dests() is the Map<from, to[]> the board contract expects', () => {
  const d = new Chess().dests()
  assert.ok(d instanceof Map)
  const [from, tos] = [...d.entries()][0]
  assert.match(from, /^[a-h][1-8]$/)
  assert.ok(Array.isArray(tos))
  assert.ok(tos.every((t) => /^[a-h][1-8]$/.test(t)))
})

test('a 960 castle appears in dests — the whole point of the seam', () => {
  const fen = '4k3/8/8/8/8/8/8/RK6 w A - 0 1'
  const offered = new Chess(fen).dests().get('b1')
  assert.ok(offered.includes('a1'), 'the castle, on the rook square')
  /* chess.js cannot even load this position, which is why the board asking it
     for legality made 960 impossible rather than merely unimplemented. */
  assert.throws(() => new Legacy(fen))
})
