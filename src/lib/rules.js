/* The rules engine, behind one door.
 *
 * chessops replaced chess.js here (2026-08-31) because chess.js 1.4.0 has no
 * Chess960 castling and no variant rules, and 960 is a standing requirement.
 * See `.kol/llm-plan/03-chessops-migration.md`.
 *
 * The surface below is deliberately chess.js's, so the call sites migrate by
 * changing one import rather than their logic. What is genuinely new is
 * `dests()` (the board seam) and the `rules` option (960 and the variants).
 *
 * ponytail: only the methods this repo actually calls live here. If you reach
 * for a chess.js method that is missing, add it — do not import chess.js again.
 */

import { Chess as Standard, normalizeMove, castlingSide } from 'chessops/chess'
import { setupPosition } from 'chessops/variant'
import { parseFen, makeFen, INITIAL_FEN } from 'chessops/fen'
import { makeSan, parseSan } from 'chessops/san'
import { chessgroundDests } from 'chessops/compat'
import { parseSquare, makeSquare, makeUci, parseUci, roleToChar, charToRole, kingCastlesTo } from 'chessops/util'
import { parsePgn, startingPosition } from 'chessops/pgn'

export { INITIAL_FEN }

/* chess.js speaks 'w'/'b' and single-char piece types; chessops speaks
 * 'white'/'black' and role names. Every crossing goes through these four. */
const toShortColor = (c) => (c === 'white' ? 'w' : 'b')
const toShortRole = (r) => roleToChar(r)
const toLongRole = (c) => charToRole(c)

export const epdOf = (fen) => fen.split(' ').slice(0, 4).join(' ')

/* A pawn landing on the far rank is four moves, not one. chessops reports the
 * destination square; the promotion piece is ours to enumerate. */
const PROMOTIONS = ['queen', 'rook', 'bishop', 'knight']

const isPromotion = (pos, from, to) => {
  const piece = pos.board.get(from)
  if (!piece || piece.role !== 'pawn') return false
  const rank = Math.floor(to / 8)
  return piece.color === 'white' ? rank === 7 : rank === 0
}

export class Chess {
  /* `rules` is the variant key chessops uses — 'chess' (default), 'chess960' is
   * NOT a separate ruleset there (960 is standard chess with a shuffled setup
   * and castling encoded in the FEN), but 'atomic', 'crazyhouse', 'antichess',
   * 'kingofthehill', '3check', 'racingkings' and 'horde' are. */
  constructor(fen = INITIAL_FEN, { rules = 'chess' } = {}) {
    this._rules = rules
    this._history = []
    this.load(fen)
  }

  load(fen) {
    const setup = parseFen(fen).unwrap()
    this._pos =
      this._rules === 'chess'
        ? Standard.fromSetup(setup).unwrap()
        : setupPosition(this._rules, setup).unwrap()
    this._history = []
    return this
  }

  clone() {
    const next = Object.create(Chess.prototype)
    next._rules = this._rules
    next._pos = this._pos.clone()
    next._history = this._history.slice()
    return next
  }

  fen() {
    return makeFen(this._pos.toSetup())
  }

  epd() {
    return epdOf(this.fen())
  }

  turn() {
    return toShortColor(this._pos.turn)
  }

  isCheck() {
    return this._pos.isCheck()
  }

  isCheckmate() {
    return this._pos.isCheckmate()
  }

  isStalemate() {
    return this._pos.isStalemate()
  }

  isDraw() {
    return this._pos.isEnd() && !this._pos.isCheckmate()
  }

  isGameOver() {
    return this._pos.isEnd()
  }

  /* Map<fromSquare, toSquare[]> — the shape the board wants for `dests`, and the
   * whole reason this module exists. Promotions collapse to their target square;
   * the board asks which piece separately. */
  dests() {
    const raw = chessgroundDests(this._pos)
    /* Same normalisation as _describe: offer the square the king actually lands
     * on. A 960 board that wants king-onto-rook targets can still play them —
     * move() accepts both — but the default matches every other consumer. */
    const out = new Map()
    for (const [from, tos] of raw) {
      const fromSq = parseSquare(from)
      out.set(
        from,
        tos.map((to) => makeSquare(this._reportedTo({ from: fromSq, to: parseSquare(to) })))
      )
    }
    return out
  }

  /* Every legal move as a chessops move object, promotions expanded. */
  _legal() {
    const out = []
    for (const [from, tos] of this._pos.allDests()) {
      for (const to of tos) {
        if (isPromotion(this._pos, from, to)) {
          for (const promotion of PROMOTIONS) out.push({ from, to, promotion })
        } else {
          out.push({ from, to })
        }
      }
    }
    return out
  }

  moves({ verbose = false } = {}) {
    const legal = this._legal()
    if (!verbose) return legal.map((m) => makeSan(this._pos, m))
    return legal.map((m) => this._describe(m))
  }

  /* chessops encodes EVERY castle as king-onto-rook — `to` is h1, not g1 — which
   * is the 960 convention leaking into standard chess, where every consumer (the
   * board, the engine, the chess.js-shaped call sites) expects g1.
   *
   * But the king's landing square is NOT always safe to publish: in 960 the king
   * frequently reaches c1/g1 as an ordinary one-square move as well, and from/to
   * alone then cannot say whether a castle or a king step was meant. Where the
   * two collide, the rook square — the unambiguous 960 convention — wins.
   *
   * Input accepts both forms regardless; only the report is normalised. */
  _reportedTo(move) {
    const side = castlingSide(this._pos, move)
    if (!side) return move.to
    const lands = kingCastlesTo(this._pos.turn, side)
    const ambiguous = lands !== move.to && this._pos.dests(move.from).has(lands)
    return ambiguous ? move.to : lands
  }

  _describe(move) {
    const piece = this._pos.board.get(move.from)
    const captured = castlingSide(this._pos, move) ? undefined : this._pos.board.get(move.to)
    const to = this._reportedTo(move)
    return {
      from: makeSquare(move.from),
      to: makeSquare(to),
      promotion: move.promotion ? toShortRole(move.promotion) : undefined,
      san: makeSan(this._pos, move),
      color: toShortColor(this._pos.turn),
      piece: piece ? toShortRole(piece.role) : undefined,
      captured: captured ? toShortRole(captured.role) : undefined,
      lan: makeUci({ from: move.from, to, promotion: move.promotion })
    }
  }

  /* Accepts SAN ('Nf3'), a UCI string ('g1f3'), or {from, to, promotion}.
   * Throws on an illegal move, exactly as chess.js 1.x does. */
  move(input) {
    const move = this._resolve(input)
    if (!move) throw new Error(`Invalid move: ${JSON.stringify(input)}`)
    const before = this.fen()
    const described = this._describe(move)
    this._pos.play(move)
    const entry = { ...described, before, after: this.fen() }
    this._history.push(entry)
    return entry
  }

  _resolve(input) {
    if (typeof input === 'string') {
      const san = parseSan(this._pos, input)
      if (san) return san
      const uci = parseUci(input)
      return uci ? this._verify(normalizeMove(this._pos, uci)) : undefined
    }
    if (!input || typeof input !== 'object') return undefined
    const from = parseSquare(input.from)
    const to = parseSquare(input.to)
    if (from === undefined || to === undefined) return undefined
    const move = { from, to }
    if (input.promotion) move.promotion = toLongRole(input.promotion)
    /* 960 castles by moving the king onto its own rook. normalizeMove turns
     * that into the castle chessops expects; without it every 960 castle reads
     * as a self-capture and is refused. */
    return this._verify(normalizeMove(this._pos, move))
  }

  _verify(move) {
    return this._pos.isLegal(move) ? move : undefined
  }

  history({ verbose = false } = {}) {
    return verbose ? this._history.slice() : this._history.map((m) => m.san)
  }

  undo() {
    if (!this._history.length) return null
    const entry = this._history[this._history.length - 1]
    const replay = this._history.slice(0, -1)
    this.load(entry.before)
    this._history = replay
    return entry
  }

  /* chess.js order: rank 8 first, file a first, null for an empty square. */
  board() {
    const rows = []
    for (let rank = 7; rank >= 0; rank--) {
      const row = []
      for (let file = 0; file < 8; file++) {
        const square = rank * 8 + file
        const piece = this._pos.board.get(square)
        row.push(
          piece
            ? { square: makeSquare(square), type: toShortRole(piece.role), color: toShortColor(piece.color) }
            : null
        )
      }
      rows.push(row)
    }
    return rows
  }

  get(square) {
    const piece = this._pos.board.get(parseSquare(square))
    return piece ? { type: toShortRole(piece.role), color: toShortColor(piece.color) } : undefined
  }

  /* Replaces the position with the PGN's mainline played out. Throws on a PGN
   * that will not parse or whose moves are not legal — resolveGame relies on it
   * throwing rather than returning a half-played game. */
  loadPgn(pgn) {
    const games = parsePgn(pgn)
    if (!games.length) throw new Error('No game in PGN')
    const game = games[0]
    /* chessops' parser never fails — junk in gives a game with default headers
     * and zero moves. resolveGame relies on a throw to reject non-PGN input, so
     * the emptiness check is ours to make. */
    if (!game.moves.children.length && !/\[\s*\w+\s+"/.test(pgn)) {
      throw new Error('Not a PGN')
    }
    this._headers = Object.fromEntries(game.headers)
    const start = startingPosition(game.headers)
    if (start.isErr) throw new Error('Unplayable starting position')
    this._pos = start.unwrap()
    this._rules = 'chess'
    this._history = []
    for (const node of game.moves.mainline()) {
      this.move(node.san) // throws on an illegal SAN, which is what callers catch
      /* PGN comments ride the move they follow. chess.com writes `[%clk …]` on
       * every one, which is the only record of how long a move actually took —
       * the book builder reads it from here. chess.js exposed no such thing. */
      if (node.comments?.length) this._history[this._history.length - 1].comments = node.comments
    }
    return this
  }

  header() {
    return this._headers ?? {}
  }
}

export default Chess
