/* Opening autopsy — walk one of my openings move by move and find the ply where
 * it stops working.
 *
 * Every number here comes from the two books built by
 * `scripts/build-style-book.mjs`: `public/books/style-book.json` (positions where I
 * am to move, and what I played) and `reply-book.json` (positions where the opponent
 * is to move, and what they played). Alternating them is what makes a line
 * walkable — the play book alone stops at my first move, because nothing in it
 * knows what came back.
 *
 * WHAT "WENT WRONG" MEANS HERE, precisely: at every node the score is my result
 * in the games that PASSED THROUGH that node. A branch that scores well below
 * its own parent is a branch that cost me something — the position was fine
 * until this point and worse after it. That is a drop, and drops are the whole
 * output. It is not an engine evaluation and does not claim to be: it is the
 * record of how I actually did from there, which for a repertoire question is
 * the more useful number and costs nothing to compute.
 *
 * A caveat that has to ride every reading: a low score deep in a line can mean
 * the move is bad, OR that I only reach it against opponents who outplay me.
 * The sample size and the parent comparison are what separate the two, and both
 * are reported so the reader can do that separating.
 */

const HALF = 2
const rate = (e) => (e.n > 0 ? (e.s / (e.n * HALF)) * 100 : 0)

export const epdOf = (fen) => fen.split(' ').slice(0, 4).join(' ')

/* The openings worth autopsying, as the move prefix that defines them rather
 * than as a name — a name is a label applied at the end, and the whole point of
 * walking a line is to follow the moves. */
export const LINES = [
  {
    key: 'kings-gambit',
    label: "King's Gambit",
    side: 'white',
    /* 1.e4 e5 2.f4 — the gambit offered. Everything after is the tree. */
    prefix: ['e4', 'e5', 'f4']
  },
  {
    key: 'dutch',
    label: 'Dutch Defense',
    side: 'black',
    /* 1.d4 f5 — the Dutch declared. */
    prefix: ['d4', 'f5']
  }
]

/* Walk the tree under `prefix`, following the most-played move at every node,
 * and record each of MY moves with its score and how far it fell from the node
 * before it.
 *
 * `Chess` is injected rather than imported so this module stays pure and the
 * test can drive it without pulling the rules engine into a unit test's assumptions.
 */
export const walkLine = (Chess, book, replyBook, line, { maxPlies = 24, minGames = 15 } = {}) => {
  const chess = new Chess()
  for (const san of line.prefix) {
    if (!chess.moves().includes(san)) return { key: line.key, label: line.label, nodes: [], reachable: false }
    chess.move(san)
  }

  const nodes = []
  let parentScore = null

  for (let i = 0; i < maxPlies; i++) {
    const epd = epdOf(chess.fen())
    const mineToMove = chess.turn() === (line.side === 'white' ? 'w' : 'b')
    const source = mineToMove ? book?.p?.[epd] : replyBook?.p?.[epd]
    if (!source) break

    /* follow the main road: the move actually played most often */
    const entries = Object.entries(source).sort((a, b) => b[1].n - a[1].n)
    const [san, e] = entries[0]
    if (e.n < minGames) break
    if (!chess.moves().includes(san)) break

    const scorePct = rate(e)
    if (mineToMove) {
      /* siblings: the other choices I had here, and how they did */
      const siblings = entries
        .slice(1)
        .filter(([, s]) => s.n >= minGames)
        .map(([s, x]) => ({ san: s, games: x.n, scorePct: rate(x) }))

      nodes.push({
        ply: chess.history().length,
        moveNumber: Math.floor(chess.history().length / 2) + 1,
        san,
        mine: true,
        games: e.n,
        scorePct,
        drop: parentScore === null ? 0 : scorePct - parentScore,
        siblings,
        /* the best alternative I actually played, when it beat the main road */
        betterSibling: siblings.filter((s) => s.scorePct > scorePct + 3).sort((a, b) => b.scorePct - a.scorePct)[0] ?? null
      })
      parentScore = scorePct
    } else {
      nodes.push({
        ply: chess.history().length,
        moveNumber: Math.floor(chess.history().length / 2) + 1,
        san,
        mine: false,
        games: e.n,
        scorePct,
        drop: parentScore === null ? 0 : scorePct - parentScore
      })
      parentScore = scorePct
    }
    chess.move(san)
  }

  /* The verdict: the sharpest fall along the road, and the branch that would
   * have served me better at that point if I actually played one. */
  const drops = nodes.filter((n) => n.drop < 0)
  const worst = [...drops].sort((a, b) => a.drop - b.drop)[0] ?? null

  return {
    key: line.key,
    label: line.label,
    side: line.side,
    prefix: line.prefix,
    reachable: true,
    nodes,
    worst,
    /* every node where I had a measurably better move available */
    missed: nodes.filter((n) => n.mine && n.betterSibling)
  }
}

export const autopsy = (Chess, book, replyBook, opts) =>
  LINES.map((line) => walkLine(Chess, book, replyBook, line, opts))
