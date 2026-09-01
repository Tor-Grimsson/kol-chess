/* Functional diagnosis of my play — strengths, weaknesses, and where the
 * openings leak. Pure functions over the gameMeta array, same contract as
 * `stats/aggregate.js`.
 *
 * THE RULE THIS FILE IS BUILT ON: every finding compares me to MYSELF. There is
 * no table of "a 1600 should mate in X% of losses" in here, because I do not
 * have a sourced one and inventing a benchmark would make every number below a
 * dressed-up guess. Internal comparisons — this opening against my other
 * openings, this rating band against my other bands, this colour against the
 * other — are answerable from the data and are what actually locate a leak.
 *
 * Metadata tier: no engine. Everything here is free and instant, which is why
 * it ships before the sampled engine pass rather than waiting for it.
 */

import { openingFamily, computeNamedOpening, NAMED_OPENINGS } from '../stats/aggregate.js'

const score = (t) => t.win + t.draw / 2
const pct = (part, total) => (total > 0 ? (part / total) * 100 : 0)
const tally = () => ({ games: 0, win: 0, loss: 0, draw: 0 })
const add = (t, r) => {
  t.games += 1
  if (r === 'win' || r === 'loss' || r === 'draw') t[r] += 1
}
const scorePct = (t) => pct(score(t), t.games)
const fmt = (n, d = 1) => Number(n.toFixed(d))

/* A finding is a sentence with its numbers attached. `kind` drives the tone the
 * page renders it in; `evidence` is what makes it checkable rather than a claim. */
const finding = (id, kind, title, line, evidence = []) => ({ id, kind, title, line, evidence })

/* ── how games end ── */
export const diagnoseTermination = (games) => {
  const losses = games.filter((g) => g.playerResult === 'loss')
  const wins = games.filter((g) => g.playerResult === 'win')
  if (!losses.length) return []

  const by = (list, method) =>
    list.filter((g) => (g.terminationCategory ?? '').endsWith(`-${method}`)).length

  const mated = by(losses, 'checkmate')
  const lostOnTime = by(losses, 'time')
  const wonOnTime = by(wins, 'time')
  const matedPct = pct(mated, losses.length)
  const out = []

  /* Being mated is the terminal failure — you did not just stand worse, you ran
   * out of board. Its SHARE of losses is the reading, not its raw count. */
  out.push(
    finding(
      'mate-rate',
      matedPct >= 33 ? 'weakness' : 'note',
      'Losses that end in mate',
      `${fmt(matedPct)}% of my ${losses.length.toLocaleString()} losses end in checkmate rather than resignation — ${mated.toLocaleString()} games where the position was not just lost but finished.`,
      [
        ['Mated', mated.toLocaleString()],
        ['Resigned', by(losses, 'resignation').toLocaleString()],
        ['Lost on time', lostOnTime.toLocaleString()]
      ]
    )
  )

  /* The clock read only means something as a ratio: everyone loses some on time. */
  const timeRatio = lostOnTime ? wonOnTime / lostOnTime : Infinity
  out.push(
    finding(
      'clock',
      timeRatio >= 1.5 ? 'strength' : timeRatio <= 0.8 ? 'weakness' : 'note',
      'The clock',
      timeRatio >= 1.5
        ? `I win on time ${fmt(timeRatio)}× more often than I lose on time — the clock is working for me, not against me.`
        : `I win on time ${fmt(timeRatio)}× as often as I lose on it — the clock is close to neutral.`,
      [
        ['Won on time', wonOnTime.toLocaleString()],
        ['Lost on time', lostOnTime.toLocaleString()]
      ]
    )
  )
  return out
}

/* ── colour ── */
export const diagnoseColour = (games) => {
  const t = { white: tally(), black: tally() }
  for (const g of games) if (t[g.playerColor]) add(t[g.playerColor], g.playerResult)
  if (!t.white.games || !t.black.games) return []
  const w = scorePct(t.white)
  const b = scorePct(t.black)
  const gap = w - b
  return [
    finding(
      'colour-gap',
      Math.abs(gap) >= 3 ? 'weakness' : 'strength',
      'White against Black',
      Math.abs(gap) < 3
        ? `My two colours score within ${fmt(Math.abs(gap))} points of each other — the repertoire is balanced.`
        : `I score ${fmt(Math.abs(gap))} points ${gap > 0 ? 'better with White than Black' : 'better with Black than White'}, which is where the cheaper improvement sits.`,
      [
        ['White', `${fmt(w)}% over ${t.white.games.toLocaleString()}`],
        ['Black', `${fmt(b)}% over ${t.black.games.toLocaleString()}`]
      ]
    )
  ]
}

/* ── performance against stronger and weaker opposition ── */
export const diagnoseOpposition = (games) => {
  const bands = { under: tally(), even: tally(), over: tally() }
  for (const g of games) {
    const mine = g.player?.rating
    const theirs = g.opponent?.rating
    if (!mine || !theirs) continue
    const d = theirs - mine
    add(d <= -100 ? bands.under : d >= 100 ? bands.over : bands.even, g.playerResult)
  }
  if (!bands.over.games || !bands.under.games) return []
  return [
    finding(
      'opposition',
      scorePct(bands.over) >= 40 ? 'strength' : 'note',
      'Against stronger players',
      `Against opponents 100+ points above me I score ${fmt(scorePct(bands.over))}%, against 100+ below me ${fmt(scorePct(bands.under))}%.`,
      [
        ['Stronger (+100)', `${fmt(scorePct(bands.over))}% over ${bands.over.games.toLocaleString()}`],
        ['Even (±100)', `${fmt(scorePct(bands.even))}% over ${bands.even.games.toLocaleString()}`],
        ['Weaker (−100)', `${fmt(scorePct(bands.under))}% over ${bands.under.games.toLocaleString()}`]
      ]
    )
  ]
}

/* ── repertoire concentration ── */
export const diagnoseRepertoire = (games) => {
  const fams = new Map()
  let classified = 0
  for (const g of games) {
    const f = openingFamily(g.eco)
    if (!f) continue
    classified++
    if (!fams.has(f)) fams.set(f, tally())
    add(fams.get(f), g.playerResult)
  }
  if (!classified) return []
  const ranked = [...fams.entries()].sort((a, b) => b[1].games - a[1].games)
  const top5 = ranked.slice(0, 5)
  const share = pct(
    top5.reduce((a, [, t]) => a + t.games, 0),
    classified
  )
  return [
    finding(
      'concentration',
      share >= 55 ? 'note' : 'strength',
      'How narrow the repertoire is',
      `My five most-played families are ${fmt(share)}% of every classified game. ${
        share >= 55
          ? 'That is deep preparation and it is also predictable — an opponent who knows me knows what is coming.'
          : 'That is a broad book, harder to prepare against.'
      }`,
      top5.map(([f, t]) => [f, `${t.games.toLocaleString()} · ${fmt(scorePct(t))}%`])
    )
  ]
}

/* ── the named openings, read as pillars ── */
export const diagnosePillars = (games) => {
  const out = []
  for (const spec of NAMED_OPENINGS) {
    const o = computeNamedOpening(games, spec)
    if (o.mine.games < 100) continue

    /* Does it survive stronger opposition? Bands with enough games only, first
     * against last — the question a repertoire actually has to answer. */
    const bands = o.byBand.filter((b) => b.games >= 25)
    if (bands.length >= 2) {
      const lo = bands[0]
      const hi = bands[bands.length - 1]
      const delta = hi.scorePct - lo.scorePct
      out.push(
        finding(
          `pillar-${o.key}`,
          delta <= -4 ? 'weakness' : delta >= 4 ? 'strength' : 'note',
          `${o.label} under pressure`,
          delta <= -4
            ? `${o.label} scores ${fmt(lo.scorePct)}% at ${lo.band} but only ${fmt(hi.scorePct)}% at ${hi.band} — it stops working as the opposition strengthens, which is the definition of a weapon I am outgrowing.`
            : delta >= 4
              ? `${o.label} climbs from ${fmt(lo.scorePct)}% at ${lo.band} to ${fmt(hi.scorePct)}% at ${hi.band} — it gets BETTER as I do, so it is worth deepening rather than replacing.`
              : `${o.label} holds flat across the rating ladder (${fmt(lo.scorePct)}% → ${fmt(hi.scorePct)}%).`,
          bands.map((b) => [String(b.band), `${fmt(b.scorePct)}% over ${b.games.toLocaleString()}`])
        )
      )
    }

    /* The single worst branch with a real sample — the concrete thing to fix. */
    if (o.worst && o.best && o.worst.scorePct < 45) {
      out.push(
        finding(
          `leak-${o.key}`,
          'weakness',
          `${o.label} — the leaking branch`,
          `Inside ${o.label} my worst line is ${o.worst.label} at ${fmt(o.worst.scorePct)}% over ${o.worst.games} games, against ${fmt(o.best.scorePct)}% in my best line (${o.best.label}). Same opening, ${fmt(o.best.scorePct - o.worst.scorePct)} points apart.`,
          [
            ['Worst', `${o.worst.label} · ${fmt(o.worst.scorePct)}% · ${o.worst.games}`],
            ['Best', `${o.best.label} · ${fmt(o.best.scorePct)}% · ${o.best.games}`],
            ['Whole opening', `${fmt(o.mine.scorePct)}% · ${o.mine.games.toLocaleString()}`]
          ]
        )
      )
    }
  }
  return out
}

/* ── decisiveness ── */
export const diagnoseDecisiveness = (games) => {
  const drawn = games.filter((g) => g.playerResult === 'draw').length
  if (!games.length) return []
  const rate = pct(drawn, games.length)
  return [
    finding(
      'decisiveness',
      'note',
      'How often games are drawn',
      `${fmt(rate)}% of my games are drawn. ${
        rate < 8
          ? 'That is a very low draw rate — these are sharp, decisive games, which fits a gambit-led repertoire and means the openings are doing what they were picked to do.'
          : 'That is a moderate draw rate.'
      }`,
      [
        ['Drawn', drawn.toLocaleString()],
        ['Decisive', (games.length - drawn).toLocaleString()]
      ]
    )
  ]
}

/* Everything, ordered so weaknesses lead — the page exists to show what to fix,
 * not to open with a compliment. */
export const diagnose = (games) => {
  const all = [
    ...diagnoseTermination(games),
    ...diagnoseColour(games),
    ...diagnoseOpposition(games),
    ...diagnoseRepertoire(games),
    ...diagnosePillars(games),
    ...diagnoseDecisiveness(games)
  ]
  const rank = { weakness: 0, strength: 1, note: 2 }
  return {
    findings: [...all].sort((a, b) => rank[a.kind] - rank[b.kind]),
    counts: {
      weakness: all.filter((f) => f.kind === 'weakness').length,
      strength: all.filter((f) => f.kind === 'strength').length,
      note: all.filter((f) => f.kind === 'note').length
    }
  }
}
