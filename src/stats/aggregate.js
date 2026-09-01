/* Pure aggregation over the gameMeta array (loadFullDataset()).
 * Field contract verified against the real 27,200-game set (2026-07-16):
 *   playerResult ∈ {win, loss, draw, unknown} — pre-bucketed
 *   terminationCategory = `{win|loss|draw|unknown}-{method}`
 *   timeClass ∈ {blitz, bullet, daily, rapid} · playerColor ∈ {white, black}
 *   player.rating / opponent.rating / endTime — no nulls
 *   eco = chess.com opening URL (52 nulls) · rated: 8 false
 */

const score = (win, draw) => win + draw / 2

const pct = (part, total) => (total > 0 ? (part / total) * 100 : 0)

const tally = () => ({ games: 0, win: 0, loss: 0, draw: 0 })

const addResult = (bucket, result) => {
  bucket.games += 1
  if (result === 'win' || result === 'loss' || result === 'draw') bucket[result] += 1
}

/* ── openings ──
 * eco is a URL slug mixing family name and moves:
 *   .../openings/Scandinavian-Defense-Mieses-Kotrc-Variation-3.Nc3
 * Family = tokens up to the first move-ish token (contains a digit), then cut
 * at the first family-terminator word; Accepted/Declined ride along
 * (Queens Gambit Accepted ≠ Queens Gambit Declined).
 */
const FAMILY_END = new Set(['Defense', 'Defence', 'Game', 'Opening', 'Gambit', 'Attack', 'System', 'Variation'])

export const openingFamily = (ecoUrl) => {
  if (!ecoUrl) return null
  const slug = String(ecoUrl).split('/openings/')[1]
  if (!slug) return null
  const tokens = slug.split('-')
  const words = []
  for (const token of tokens) {
    if (/\d/.test(token)) break
    words.push(token)
    if (FAMILY_END.has(token)) break
  }
  // Accepted/Declined distinguishes gambit families
  const next = tokens[words.length]
  if (next === 'Accepted' || next === 'Declined') words.push(next)
  return words.length ? words.join(' ') : null
}

export const computeTotals = (games) => {
  const t = tally()
  let rated = 0
  for (const g of games) {
    addResult(t, g.playerResult)
    if (g.rated) rated += 1
  }
  return {
    ...t,
    rated,
    winPct: pct(t.win, t.win + t.loss + t.draw),
    scorePct: pct(score(t.win, t.draw), t.win + t.loss + t.draw)
  }
}

export const computeColourSplit = (games) => {
  const split = { white: tally(), black: tally() }
  for (const g of games) {
    const bucket = split[g.playerColor]
    if (bucket) addResult(bucket, g.playerResult)
  }
  for (const colour of ['white', 'black']) {
    split[colour].winPct = pct(split[colour].win, split[colour].games)
  }
  return split
}

// Rated games of one time class → monthly closing rating [{x: '2019-04', y}]
// (last rating seen in each month, chronological). Also returns the peak.
export const computeRatingSeries = (games, timeClass) => {
  const rated = games
    .filter((g) => g.rated && g.timeClass === timeClass && g.player?.rating)
    .sort((a, b) => (a.endTime ?? 0) - (b.endTime ?? 0))
  const byMonth = new Map()
  let peak = null
  for (const g of rated) {
    byMonth.set(g.month, g.player.rating)
    if (!peak || g.player.rating > peak.rating) {
      peak = { rating: g.player.rating, month: g.month }
    }
  }
  return {
    series: [...byMonth.entries()].map(([x, y]) => ({ x, y })),
    peak,
    games: rated.length
  }
}

// Highest-rated opponent beaten, and highest faced (rated games only —
// unrated ratings aren't comparable).
export const computeRatingRecords = (games) => {
  let bestWin = null
  let highestFaced = null
  let opponentRatingSum = 0
  let ratedCount = 0
  for (const g of games) {
    if (!g.rated || !g.opponent?.rating) continue
    ratedCount += 1
    opponentRatingSum += g.opponent.rating
    if (!highestFaced || g.opponent.rating > highestFaced.opponent.rating) highestFaced = g
    if (g.playerResult === 'win' && (!bestWin || g.opponent.rating > bestWin.opponent.rating)) {
      bestWin = g
    }
  }
  return {
    bestWin,
    highestFaced,
    avgOpponentRating: ratedCount ? Math.round(opponentRatingSum / ratedCount) : null
  }
}

// Opponent frequency + per-opponent record; best/worst matchups need a
// minimum sample (default 5 games) to mean anything.
export const computeOpponents = (games, { top = 8, minGames = 5 } = {}) => {
  const map = new Map()
  for (const g of games) {
    const name = g.opponent?.username
    if (!name) continue
    if (!map.has(name)) map.set(name, tally())
    addResult(map.get(name), g.playerResult)
  }
  const all = [...map.entries()].map(([username, t]) => ({
    username,
    ...t,
    scorePct: pct(score(t.win, t.draw), t.games)
  }))
  const frequent = [...all].sort((a, b) => b.games - a.games).slice(0, top)
  const qualified = all.filter((o) => o.games >= minGames)
  const byScore = [...qualified].sort((a, b) => b.scorePct - a.scorePct || b.games - a.games)
  return {
    unique: map.size,
    frequent,
    bestMatchup: byScore[0] ?? null,
    worstMatchup: byScore[byScore.length - 1] ?? null
  }
}

// Opening families per colour: most played + best scoring (min sample).
export const computeOpenings = (games, { top = 6, minGames = 50 } = {}) => {
  const byColour = { white: new Map(), black: new Map() }
  for (const g of games) {
    const family = openingFamily(g.eco)
    if (!family) continue
    const map = byColour[g.playerColor]
    if (!map) continue
    if (!map.has(family)) map.set(family, tally())
    addResult(map.get(family), g.playerResult)
  }
  const summarize = (map) => {
    const all = [...map.entries()].map(([family, t]) => ({
      family,
      ...t,
      scorePct: pct(score(t.win, t.draw), t.games)
    }))
    const played = [...all].sort((a, b) => b.games - a.games).slice(0, top)
    const qualified = all.filter((o) => o.games >= minGames)
    const best = [...qualified].sort((a, b) => b.scorePct - a.scorePct)[0] ?? null
    return { played, best }
  }
  return { white: summarize(byColour.white), black: summarize(byColour.black) }
}

export const computeTimeClasses = (games) => {
  const map = new Map()
  for (const g of games) {
    const key = g.timeClass ?? 'unknown'
    if (!map.has(key)) map.set(key, tally())
    addResult(map.get(key), g.playerResult)
  }
  return [...map.entries()]
    .map(([timeClass, t]) => ({ timeClass, ...t, winPct: pct(t.win, t.games) }))
    .sort((a, b) => b.games - a.games)
}

// Activity heat: rows = years asc, cols = Jan..Dec, cell = games that month.
export const computeActivity = (games) => {
  const byMonth = new Map()
  for (const g of games) {
    if (!g.month) continue
    byMonth.set(g.month, (byMonth.get(g.month) ?? 0) + 1)
  }
  const years = [...new Set([...byMonth.keys()].map((m) => m.slice(0, 4)))].sort()
  const grid = years.map((year) =>
    Array.from({ length: 12 }, (_, i) => byMonth.get(`${year}-${String(i + 1).padStart(2, '0')}`) ?? 0)
  )
  return { years, grid, busiestMonth: [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0] ?? null }
}

// Longest win/loss streaks over the chronological game order.
export const computeStreaks = (games) => {
  const ordered = [...games].sort((a, b) => (a.endTime ?? 0) - (b.endTime ?? 0))
  const best = { win: null, loss: null }
  let current = null
  for (const g of ordered) {
    const r = g.playerResult
    if (r !== 'win' && r !== 'loss') {
      current = null
      continue
    }
    if (current?.result === r) {
      current.length += 1
      current.end = g.month
    } else {
      current = { result: r, length: 1, start: g.month, end: g.month }
    }
    if (!best[r] || current.length > best[r].length) best[r] = { ...current }
  }
  return best
}

// terminationCategory = `{outcome}-{method}` → how games end, and how
// wins/losses specifically end.
export const computeTerminations = (games) => {
  const byMethod = new Map()
  const winsByMethod = new Map()
  const lossesByMethod = new Map()
  for (const g of games) {
    const category = g.terminationCategory ?? 'unknown-other'
    const dash = category.indexOf('-')
    const outcome = category.slice(0, dash)
    const method = category.slice(dash + 1)
    byMethod.set(method, (byMethod.get(method) ?? 0) + 1)
    if (outcome === 'win') winsByMethod.set(method, (winsByMethod.get(method) ?? 0) + 1)
    if (outcome === 'loss') lossesByMethod.set(method, (lossesByMethod.get(method) ?? 0) + 1)
  }
  const sorted = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]).map(([method, count]) => ({ method, count }))
  return { byMethod: sorted(byMethod), wins: sorted(winsByMethod), losses: sorted(lossesByMethod) }
}

// The one entry the dashboard consumes.
/* ── named openings (the repertoire pillars) ──
 *
 * TRANSPOSITION IS THE CAVEAT, and it is load-bearing (user ruling 2026-08-30:
 * "often times openings transition from a to b in the move order, not by direct
 * choice"). `eco` is chess.com's TERMINAL classification of a game — the name it
 * had by the end of the opening phase, NOT the opening the player chose at move 1.
 * A game that began 1.d4 f5 and became a Dutch is counted here; so is one that
 * began 1.Nf3 and transposed in. From metadata alone the two are indistinguishable.
 *
 * So everything below is honestly labelled "as classified", and the UI says so.
 * The real chose-vs-arrived split needs the move order out of the PGN corpus —
 * that is the precompute's job, and this function is what it will enrich.
 *
 * `side` is the colour the opening is playable as: a King's Gambit is White's,
 * a Dutch is Black's. Games on the other side are the opponent playing it AT us,
 * which is a different question and is reported separately rather than merged.
 */
export const NAMED_OPENINGS = [
  { key: 'kings-gambit', label: "King's Gambit", pattern: /^Kings-Gambit/i, side: 'white' },
  { key: 'dutch', label: 'Dutch Defense', pattern: /^Dutch/i, side: 'black' },
  { key: 'french', label: 'French Defense', pattern: /^French/i, side: 'black' }
]

// slug after /openings/, or '' — the raw classification string
const ecoSlug = (ecoUrl) => (ecoUrl ? String(ecoUrl).split('/openings/')[1] ?? '' : '')

/* The variation label under a family: the slug minus the family words, so
 * `Kings-Gambit-Accepted-Fischer-Defense-4.Bc4` reads as its variation rather
 * than repeating the family on every row. Falls back to the family itself for
 * the bare line (a game classified as just `Kings-Gambit`). */
const variationLabel = (slug, family) => {
  const words = slug.split('-')
  const familyWords = family.split(' ').length
  const rest = words.slice(familyWords).join(' ').trim()
  return rest || 'Main line'
}

export const computeNamedOpening = (games, spec, { topVariations = 6 } = {}) => {
  const mine = tally()
  const against = tally()
  const variations = new Map()
  const byBand = new Map()
  const byYear = new Map()

  for (const g of games) {
    const slug = ecoSlug(g.eco)
    if (!slug || !spec.pattern.test(slug)) continue

    /* the opening is `spec.side`'s to play; on the other colour it was played AT us */
    const isMine = g.playerColor === spec.side
    addResult(isMine ? mine : against, g.playerResult)
    if (!isMine) continue

    const family = openingFamily(g.eco) ?? spec.label
    const label = variationLabel(slug, family)
    if (!variations.has(label)) variations.set(label, tally())
    addResult(variations.get(label), g.playerResult)

    const band = Math.round((g.player?.rating ?? 0) / 100) * 100
    if (band) {
      if (!byBand.has(band)) byBand.set(band, tally())
      addResult(byBand.get(band), g.playerResult)
    }

    const year = g.month?.slice(0, 4)
    if (year) {
      if (!byYear.has(year)) byYear.set(year, tally())
      addResult(byYear.get(year), g.playerResult)
    }
  }

  const withScore = (t) => ({ ...t, scorePct: pct(score(t.win, t.draw), t.games) })
  const listOf = (map, keyName) =>
    [...map.entries()]
      .map(([k, t]) => ({ [keyName]: k, ...withScore(t) }))
      .sort((a, b) => (keyName === 'label' ? b.games - a.games : String(a[keyName]).localeCompare(String(b[keyName]))))

  const varList = listOf(variations, 'label')

  return {
    key: spec.key,
    label: spec.label,
    side: spec.side,
    mine: withScore(mine),
    against: withScore(against),
    variations: varList.slice(0, topVariations),
    /* best/worst need enough games to mean anything — a 2-game 100% is noise */
    best: [...varList].filter((v) => v.games >= 25).sort((a, b) => b.scorePct - a.scorePct)[0] ?? null,
    worst: [...varList].filter((v) => v.games >= 25).sort((a, b) => a.scorePct - b.scorePct)[0] ?? null,
    byBand: listOf(byBand, 'band'),
    byYear: listOf(byYear, 'year')
  }
}

export const computeNamedOpenings = (games) =>
  NAMED_OPENINGS.map((spec) => computeNamedOpening(games, spec))

export const computeStats = (games) => {
  const timeClasses = computeTimeClasses(games)
  const dominantClass = timeClasses[0]?.timeClass ?? 'blitz'
  return {
    totals: computeTotals(games),
    colours: computeColourSplit(games),
    rating: computeRatingSeries(games, dominantClass),
    dominantClass,
    records: computeRatingRecords(games),
    opponents: computeOpponents(games),
    openings: computeOpenings(games),
    namedOpenings: computeNamedOpenings(games),
    timeClasses,
    activity: computeActivity(games),
    streaks: computeStreaks(games),
    terminations: computeTerminations(games),
    span: games.length
      ? {
          from: [...games].reduce((min, g) => (g.month < min ? g.month : min), games[0].month),
          to: [...games].reduce((max, g) => (g.month > max ? g.month : max), games[0].month)
        }
      : null
  }
}
