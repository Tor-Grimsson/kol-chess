#!/usr/bin/env node
/**
 * build-suggestions — moves I have already played, that already worked, and
 * that I have somehow never made my main answer.
 *
 * A REJECTED FIRST ATTEMPT, recorded because the reasoning matters more than
 * the code: the original version looked for NAMED openings (from the bundled
 * lichess TSV) one legal move off positions I reach often, ranked by
 * opportunity × novelty. It ran, and the top of the list was Ware Opening,
 * Barnes Opening, Sodium Attack, Amar Opening, Lemming Defense — every junk
 * first move that happens to carry a name. The metric was not broken; the
 * PREMISE was. "Has a name in the TSV" says nothing about whether a move is any
 * good, so ranking unplayed-but-named moves by how often I could play them just
 * surfaces the moves nobody plays BECAUSE they lose. Grounding a suggestion in
 * an opening's fame is not grounding it at all.
 *
 * Suggesting an opening on quality grounds needs a quality signal — an engine
 * pass, or a masters database. Neither is here, and inventing the judgement
 * would make every row a guess wearing a number.
 *
 * So this asks the one question my own games CAN answer:
 *
 *   Where do I have a move I have played enough times to trust, that scored
 *   clearly better than the move I usually play from that same position?
 *
 * Both sides are my own results. No outside authority, no taste. The claim is
 * narrow and checkable: not "this opening is good" but "when you did this, it
 * went better than what you normally do, and here is the sample."
 *
 * Run after build-style-book.mjs:
 *   node scripts/build-suggestions.mjs
 */

import { Chess } from '../src/lib/rules.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const BOOK = path.join(REPO, 'public/books/style-book.json')
const TSV = path.join(REPO, 'src/openings/openings.tsv')
const OUT = path.join(REPO, 'public/books/suggestions.json')

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? fallback : Number(process.argv[i + 1])
}
/* The alternative needs enough games to be a result rather than a run of luck. */
const MIN_ALT = arg('--min-alt', 12)
/* The move it beats needs enough games to be my actual habit. */
const MIN_MAIN = arg('--min-main', 25)
/* How much better, in score points, before it is worth saying out loud. */
const MIN_EDGE = arg('--min-edge', 8)
const TOP = arg('--top', 30)

const HALF = 2
const rate = (e) => (e.n > 0 ? (e.s / (e.n * HALF)) * 100 : 0)
const epdOf = (fen) => fen.split(' ').slice(0, 4).join(' ')

/* EPD → {eco, name}: used only to LABEL a position that already earned its
 * place on results. Naming is decoration here, never the reason for a row. */
const namedIndex = () => {
  const index = new Map()
  const chess = new Chess()
  for (const line of fs.readFileSync(TSV, 'utf8').split('\n')) {
    if (!line) continue
    const [eco, name, pgn] = line.split('\t')
    if (!pgn) continue
    try {
      chess.loadPgn(pgn)
    } catch {
      continue
    }
    index.set(epdOf(chess.fen()), { eco, name })
  }
  return index
}

const main = () => {
  if (!fs.existsSync(BOOK)) {
    console.error('[suggest] no style book — run scripts/build-style-book.mjs first')
    process.exit(1)
  }
  const book = JSON.parse(fs.readFileSync(BOOK, 'utf8'))
  const named = namedIndex()

  const out = []
  for (const [epd, moves] of Object.entries(book.p)) {
    const entries = Object.entries(moves)
    if (entries.length < 2) continue

    const ranked = [...entries].sort((a, b) => b[1].n - a[1].n)
    const [mainSan, mainE] = ranked[0]
    if (mainE.n < MIN_MAIN) continue
    const mainPct = rate(mainE)

    for (const [san, e] of ranked.slice(1)) {
      if (e.n < MIN_ALT) continue
      const pct = rate(e)
      const edge = pct - mainPct
      if (edge < MIN_EDGE) continue

      /* label the position the alternative LEADS TO, if it has a name */
      let name = null
      let eco = null
      try {
        const probe = new Chess(`${epd} 0 1`)
        probe.move(san)
        const hit = named.get(epdOf(probe.fen()))
        if (hit) {
          name = hit.name
          eco = hit.eco
        }
      } catch {
        /* an EPD the rules engine will not load is simply unlabelled */
      }

      out.push({
        epd,
        san,
        games: e.n,
        scorePct: Number(pct.toFixed(1)),
        instead: mainSan,
        insteadGames: mainE.n,
        insteadPct: Number(mainPct.toFixed(1)),
        edge: Number(edge.toFixed(1)),
        name,
        eco,
        /* how much this is worth: the edge, weighted by how often the position
           comes up at all — a 20-point edge in a position I reach twice a year
           is a curiosity, not a change to make */
        rank: edge * Math.log10(1 + mainE.n + e.n)
      })
    }
  }

  out.sort((a, b) => b.rank - a.rank)
  console.log(`[suggest] ${out.length} alternatives beat my main move by ${MIN_EDGE}+ points`)

  const artifact = {
    meta: {
      minAlt: MIN_ALT,
      minMain: MIN_MAIN,
      minEdge: MIN_EDGE,
      considered: out.length,
      generatedFrom: book.meta.games
    },
    suggestions: out.slice(0, TOP)
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(artifact))
  console.log(`[suggest] wrote ${path.relative(REPO, OUT)}`)
  for (const s of out.slice(0, 14)) {
    console.log(
      `  ${s.san.padEnd(6)} ${String(s.games).padStart(4)}g ${String(s.scorePct).padStart(5)}%  vs  ${s.instead.padEnd(6)} ${String(s.insteadGames).padStart(5)}g ${String(s.insteadPct).padStart(5)}%  +${s.edge}  ${s.name ?? ''}`
    )
  }
}

main()
