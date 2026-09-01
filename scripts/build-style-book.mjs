#!/usr/bin/env node
/**
 * build-style-book — turns 27,200 of my games into a position book the /play
 * page can answer from.
 *
 * WHY THIS IS A SCRIPT AND NOT A HOOK. The move corpus is ~71 MB across 106
 * monthly PGN files on the CDN (measured 2026-08-30: ~2.6 KB/game). That is not
 * something a browser session downloads to find out what I play on move 3. So
 * the whole corpus is walked ONCE here and the result — a few hundred KB — is
 * what ships.
 *
 * THE MODEL HAS THREE LAYERS (user ruling 2026-08-30, correcting an earlier
 * design that hard-filtered to one rating bucket and threw the rest away —
 * "wouldn't the base characteristic be the set as a whole with skill/strength
 * increase?"):
 *
 *   STYLE     every game I have played. The repertoire and the move preference.
 *             This is the base and it is never filtered away.
 *   PERIOD    year and rating band, carried as COUNTS ON EACH MOVE rather than
 *             as separate books. The page re-weights the same entries, so a
 *             thin slice (1900 has 429 games) degrades toward my overall
 *             preference instead of running out of book — which is exactly the
 *             liberty that makes a 1900 model playable at all.
 *   STRENGTH  not stored. A dial the page applies at move time: how sharply to
 *             prefer my better-scoring moves, and what UCI_Elo to hand the
 *             engine once the book runs out.
 *
 * KEYED BY POSITION, NOT BY OPENING NAME. `epdOf` is FEN minus the move
 * counters, so a line reached by a different move order lands on the same entry
 * — transpositions merge for free, which is the correct behaviour and the
 * reason the opening LABEL is never used as a key anywhere in here.
 *
 * Only MY moves are indexed: the key is the position with me to move, the value
 * is what I played from it. The opponent's replies shape which positions I meet,
 * and that is already expressed by the positions themselves.
 *
 * PLAYER-AGNOSTIC (2026-08-30). The same pipeline builds a book for anyone with
 * enough games: my 27,150 off the CDN, or a master's from a PGN file. Nothing in
 * the indexing knows or cares whose games it is reading — which is the reason
 * the master opponents cost a flag rather than a second implementation.
 *
 * Usage:
 *   node scripts/build-style-book.mjs                       # my games off the CDN
 *   node scripts/build-style-book.mjs --pilot 12            # 12 months, stats only
 *   node scripts/build-style-book.mjs \
 *     --pgn _tmp/masters/Fischer.pgn \
 *     --player "Fischer, Robert James" \
 *     --out src/play/books/fischer.json --min-seen 1
 */

import { Chess } from '../src/lib/rules.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const CDN = 'https://b2.kolkrabbi.io/website/data-library/chess-data'
const OUT = path.join(REPO, 'public/books/style-book.json')
const REPLY_OUT = path.join(REPO, 'public/books/reply-book.json')
const CACHE = process.env.PGN_CACHE || path.join(REPO, '_tmp/pgn-cache')

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? fallback : process.argv[i + 1]
}
const PILOT = Number(arg('--pilot', 0))
/* PGN-file mode: any player, any collection. Absent = my games off the CDN. */
const PGN_FILE = arg('--pgn', null)
const OUT_OVERRIDE = arg('--out', null)
/* 30 plies = 15 moves each. Past that a position is effectively unique to its
 * game and would be book weight nobody ever reads — the long tail is what the
 * engine is for. */
const MAX_PLY = Number(arg('--max-ply', 30))
/* A position I reached once is not a preference, it is a coincidence. Pruning
 * singletons is what keeps the artifact small; measured effect is printed. */
const MIN_SEEN = Number(arg('--min-seen', 2))

/* The player whose moves become the book. A PGN header must match this exactly
 * — pgnmentor writes "Fischer, Robert James", chess.com writes a username. */
const ME = arg('--player', 'Biskupstunga')

/* FEN minus the halfmove/fullmove counters — the same key `src/openings/
 * openingBook.js` uses, so the two books speak one dialect. Kept as a local
 * copy rather than an import because this runs in node against the repo root
 * and must not drag the browser module graph in. */
const epdOf = (fen) => fen.split(' ').slice(0, 4).join(' ')

const band = (elo) => (elo ? Math.round(elo / 100) * 100 : null)

/* The lichess/chess.com bucket ladder, off the BASE seconds of a `TimeControl`
 * header ("600", "180+2", "1/259200" for daily). Anything unparseable is null,
 * which is the honest answer for a 1955 tournament game. */
const timeClass = (tcHeader) => {
  if (!tcHeader || tcHeader === '-') return null
  if (tcHeader.includes('/')) return 'daily'
  const base = Number(String(tcHeader).split('+')[0])
  if (!Number.isFinite(base) || base <= 0) return null
  if (base < 180) return 'bullet'
  if (base < 600) return 'blitz'
  if (base < 1800) return 'rapid'
  return 'classical'
}

/* THINK TIME (2026-08-31, user: "bot takes no time to think? if this is based
 * on the dataset its skipping the time records?" — it was).
 *
 * chess.com writes `[%clk H:MM:SS(.s)]` after every move: the clock REMAINING
 * once that move was played. The time a move cost is therefore the previous
 * reading minus this one, plus the increment that was just added back. 135 of
 * 136 games in a sample month carry it; historical collections carry none, so
 * the masters get nothing and fall back to a flat delay at play time.
 *
 * It is stored as a FRACTION OF THE BASE CLOCK, not as seconds. A move that
 * takes 9 s in a 3-minute game is not the same decision as 9 s in a 30-minute
 * one, and storing the ratio means the delay scales to whatever control the
 * player picks rather than being pinned to the one he happened to play. */
const parseControl = (tcHeader) => {
  if (!tcHeader || tcHeader === '-' || String(tcHeader).includes('/')) return null
  const [b, i] = String(tcHeader).split('+')
  const base = Number(b)
  if (!Number.isFinite(base) || base <= 0) return null
  return { base, inc: Number(i) || 0 }
}

const parseClock = (comments) => {
  if (!comments?.length) return null
  const m = /\[%clk\s+(\d+):(\d+):([\d.]+)\]/.exec(comments.join(' '))
  if (!m) return null
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

/* A single move's cost as a fraction of the base clock, or null when the game
 * carries no usable clock. Clamped: a disconnect or a walk-away shows up as
 * most of the clock vanishing on one move, and that is not thinking. */
const MAX_SHARE = 0.25
const thinkShare = (prevClock, thisClock, control) => {
  if (prevClock === null || thisClock === null || !control) return null
  const spent = prevClock - thisClock + control.inc
  if (!Number.isFinite(spent) || spent < 0) return null
  return Math.min(spent / control.base, MAX_SHARE)
}

async function months() {
  const mod = await import(path.join(REPO, 'src/data/lightweight.js'))
  return mod.monthlySummary.map((m) => m.month).filter(Boolean).sort()
}

/* Cached on disk: a full run is 71 MB and this script gets re-run while its
 * output format is still being argued with. */
async function monthPgn(month) {
  const file = path.join(CACHE, `${month}.json`)
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  const res = await fetch(`${CDN}/pgn/by-month/${month}.json`)
  if (!res.ok) return null
  const text = await res.text()
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(file, text)
  return JSON.parse(text)
}

/* One entry per (position, my move). `n` counts, `s` is score in half-points
 * (2 = win, 1 = draw, 0 = loss) so it stays an integer, and `y`/`b` are sparse
 * count maps for the PERIOD overlay. */
const book = new Map()

/* THE REPLY BOOK — positions where the OPPONENT is to move, and what they
 * played. The play page does not want this (the human supplies the replies),
 * which is why it ships as its own artifact rather than doubling the book
 * /play has to download. The opening autopsy DOES need it: walking a line from
 * move 1 means alternating my move, their reply, my move — and without their
 * half the tree cannot be walked past my first move. */
const replies = new Map()

let stats = { games: 0, skipped: 0, plies: 0, asWhite: 0, asBlack: 0, setUp: 0, noElo: 0 }

function ingest(pgn) {
  const chess = new Chess()
  try {
    chess.loadPgn(pgn)
  } catch {
    stats.skipped++
    return
  }
  const h = chess.header()
  const iAmWhite = h.White === ME
  const iAmBlack = h.Black === ME
  if (!iAmWhite && !iAmBlack) {
    stats.skipped++
    return
  }
  const myElo = Number(iAmWhite ? h.WhiteElo : h.BlackElo) || null
  /* OPPONENT STRENGTH (2026-08-30). Without it a move's score is averaged over
   * whoever happened to be across the board — a line played mostly against
   * weaker opposition reads as a better move than it is. This is the marginal
   * that stops that. Historical collections often carry no Elo at all, so it is
   * sparse by nature and simply absent for those games rather than guessed. */
  const oppElo = Number(iAmWhite ? h.BlackElo : h.WhiteElo) || null
  /* TIME CLASS. chess.com writes `TimeControl` in seconds ("600", "180+2");
   * historical PGN usually writes nothing. Bucketed the way both lichess and
   * chess.com bucket it, off the base seconds. */
  const tc = timeClass(h.TimeControl)
  const control = parseControl(h.TimeControl)
  const year = h.Date ? h.Date.slice(0, 4) : h.UTCDate?.slice(0, 4) ?? null
  /* Result is from White's side; convert to MY half-points. */
  const raw = h.Result
  const myScore = raw === '1/2-1/2' ? 1 : raw === (iAmWhite ? '1-0' : '0-1') ? 2 : 0

  /* Each verbose move carries the FEN it was played FROM (`before`), so the
   * position key is read straight off the move rather than re-derived by
   * replaying from the standard start. That is not a shortcut — a manual replay
   * CRASHED on the games chess.com starts from a set-up position
   * (`[SetUp "1"]` + `[FEN]`, found 2024-01), because the standard start is the
   * wrong first position for them. Reading `before` is correct for every game
   * and needs no special case. */
  const history = chess.history({ verbose: true })
  const myBand = band(myElo)
  const oppBand = band(oppElo)
  if (!myElo) stats.noElo++
  if (h.SetUp === '1' || h.FEN) stats.setUp++

  /* The clock before MY first move is the full base. After that it is whatever
     my previous move left. Their moves do not touch it. */
  let prevClock = control ? control.base : null

  for (let ply = 0; ply < history.length && ply < MAX_PLY; ply++) {
    const move = history[ply]
    /* whose move it is comes off the move itself, not off ply parity — a
     * set-up position can have Black to move at ply 0 */
    if (move.color !== (iAmWhite ? 'w' : 'b')) {
      /* their reply, recorded from MY result's point of view so the autopsy can
         read "when they answered this way, I scored X" */
      const rk = `${epdOf(move.before)}|${move.san}`
      let r = replies.get(rk)
      if (!r) {
        r = { n: 0, s: 0 }
        replies.set(rk, r)
      }
      r.n++
      r.s += myScore
      continue
    }
    const key = `${epdOf(move.before)}|${move.san}`
    let e = book.get(key)
    if (!e) {
      e = { n: 0, s: 0, y: {}, b: {}, o: {}, t: {}, dn: 0, ds: 0 }
      book.set(key, e)
    }
    e.n++
    e.s += myScore
    /* `dn`/`ds` accumulate the think-time samples; they collapse to one `d`
       when the book is written. Counted separately from `n` because most
       games in the corpus have a clock and some do not. */
    const clock = parseClock(move.comments)
    const share = thinkShare(prevClock, clock, control)
    if (share !== null) {
      e.dn++
      e.ds += share
    }
    prevClock = clock
    if (year) e.y[year] = (e.y[year] ?? 0) + 1
    if (myBand) e.b[myBand] = (e.b[myBand] ?? 0) + 1
    if (oppBand) e.o[oppBand] = (e.o[oppBand] ?? 0) + 1
    if (tc) e.t[tc] = (e.t[tc] ?? 0) + 1
    stats.plies++
  }
  stats.games++
  if (iAmWhite) stats.asWhite++
  else stats.asBlack++
}

/* A collection file holds hundreds of games back to back. Split on the blank
 * line before each `[Event`, which is the PGN export standard's own separator —
 * the rules adapter parses one game at a time. */
function* gamesInPgnFile(text) {
  const chunks = text.split(/\n\s*\n(?=\[Event )/)
  for (const c of chunks) {
    const t = c.trim()
    if (t) yield t
  }
}

async function main() {
  /* ── PGN-file mode: a master's collection ── */
  if (PGN_FILE) {
    const text = fs.readFileSync(PGN_FILE, 'utf8')
    console.log(`[book] ${path.basename(PGN_FILE)} · player "${ME}" · max ply ${MAX_PLY}, min seen ${MIN_SEEN}`)
    let seen = 0
    for (const pgn of gamesInPgnFile(text)) {
      ingest(pgn)
      seen++
    }
    console.log(`[book] ${seen} games in file`)
    return finish()
  }

  let list = await months()
  if (PILOT) list = list.slice(-PILOT)
  console.log(`[book] ${list.length} months, max ply ${MAX_PLY}, min seen ${MIN_SEEN}`)

  let done = 0
  for (const m of list) {
    const data = await monthPgn(m)
    if (!data) continue
    for (const pgn of Object.values(data)) ingest(pgn)
    if (++done % 20 === 0) console.log(`[book]   ${done}/${list.length} months · ${stats.games} games`)
  }

  return finish()
}

function finish() {
  /* Group flat `epd|san` keys back into one entry per position. */
  const positions = new Map()
  for (const [key, e] of book) {
    const i = key.lastIndexOf('|')
    const epd = key.slice(0, i)
    const san = key.slice(i + 1)
    if (!positions.has(epd)) positions.set(epd, {})
    positions.get(epd)[san] = e
  }

  const before = positions.size
  /* Prune on the POSITION's total, not the move's: a position I reached ten
     times where I tried ten different moves is real preference data (it says I
     have no settled answer there), and dropping every move for being singular
     would delete exactly that fact. */
  for (const [epd, moves] of positions) {
    const total = Object.values(moves).reduce((a, e) => a + e.n, 0)
    if (total < MIN_SEEN) positions.delete(epd)
  }

  /* Collapse the think-time accumulators into ONE integer per move: the mean
     share of the base clock, in basis points (900 = 9% of the clock). Dropping
     `dn`/`ds` keeps the artifact the shape it already was plus one small field,
     and a move nobody ever played on a clock simply has no `d`. */
  let timed = 0
  for (const moves of positions.values()) {
    for (const e of Object.values(moves)) {
      if (e.dn > 0) {
        e.d = Math.round((e.ds / e.dn) * 10000)
        timed++
      }
      delete e.dn
      delete e.ds
    }
  }

  const kept = positions.size
  const moveCount = [...positions.values()].reduce((a, m) => a + Object.keys(m).length, 0)
  console.log(`[book] think-time on ${timed}/${moveCount} moves`)
  console.log(
    `[book] games ${stats.games} (skipped ${stats.skipped}, set-up ${stats.setUp}, no-Elo ${stats.noElo}) · W ${stats.asWhite} / B ${stats.asBlack}`
  )
  console.log(`[book] positions ${before} → ${kept} after prune · ${moveCount} moves`)

  /* Same grouping for the reply book, pruned on the same rule. */
  const replyPositions = new Map()
  for (const [key, e] of replies) {
    const i = key.lastIndexOf('|')
    const epd = key.slice(0, i)
    const san = key.slice(i + 1)
    if (!replyPositions.has(epd)) replyPositions.set(epd, {})
    replyPositions.get(epd)[san] = e
  }
  for (const [epd, moves] of replyPositions) {
    const total = Object.values(moves).reduce((a, e) => a + e.n, 0)
    if (total < MIN_SEEN) replyPositions.delete(epd)
  }
  console.log(`[book] reply positions ${replyPositions.size}`)

  /* EMPTY MARGINALS ARE DROPPED. A historical collection carries no Elo and no
   * TimeControl — 755 of Fischer's 827 games have neither — so `y`/`b`/`o`/`t`
   * would ship as thousands of `{}` literals that mean nothing. The reader
   * already treats a missing marginal as "no data for this slice", so omitting
   * them changes no behaviour and cut the Fischer artifact by more than half. */
  for (const moves of positions.values()) {
    for (const e of Object.values(moves)) {
      for (const k of ['y', 'b', 'o', 't']) {
        if (e[k] && Object.keys(e[k]).length === 0) delete e[k]
      }
    }
  }

  const artifact = {
    meta: {
      games: stats.games,
      asWhite: stats.asWhite,
      asBlack: stats.asBlack,
      positions: kept,
      moves: moveCount,
      maxPly: MAX_PLY,
      minSeen: MIN_SEEN,
      player: ME
    },
    /* `p` is the whole book: epd → { san → {n, s, y, b} } */
    p: Object.fromEntries(positions)
  }
  const json = JSON.stringify(artifact)
  console.log(`[book] artifact ${(json.length / 1024 / 1024).toFixed(2)} MB uncompressed`)

  if (PILOT) {
    console.log('[book] pilot run — nothing written')
    return
  }
  const outPath = OUT_OVERRIDE ? path.resolve(REPO, OUT_OVERRIDE) : OUT
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, json)
  console.log(`[book] wrote ${path.relative(REPO, outPath)}`)

  /* The reply book is only used by the opening autopsy, which is about MY
   * games — a master's replies have no consumer, so writing one would be dead
   * weight in the repo. */
  if (OUT_OVERRIDE) return

  const replyArtifact = {
    meta: { positions: replyPositions.size, maxPly: MAX_PLY, minSeen: MIN_SEEN },
    p: Object.fromEntries(replyPositions)
  }
  const replyJson = JSON.stringify(replyArtifact)
  fs.mkdirSync(path.dirname(REPLY_OUT), { recursive: true })
  fs.writeFileSync(REPLY_OUT, replyJson)
  console.log(
    `[book] wrote ${path.relative(REPO, REPLY_OUT)} (${(replyJson.length / 1024 / 1024).toFixed(2)} MB)`
  )
}

main()
