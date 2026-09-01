import { useCallback, useRef, useState } from 'react'
import { Button, SectionText, Badge } from '@kolkrabbi/kol-component'
import { loadMonthlyPgn, getMonthlySummary } from '../data/sample-games.js'
import { runGameReview } from '../engine/reviewRunner.js'
import { winPctOfLine } from '../engine/uci.js'
import { positionsFromPgn, stratify, summarise } from './phaseSample.js'

/* The one expensive thing on this page, and the only thing behind a button.
 *
 * Measured on this machine: d14 averages 376 ms per position, so the sample
 * sizes below cost roughly 1, 2 and 4 minutes. The whole archive would be about
 * seven days, which is why there is no "analyse everything" option — it is not
 * a setting anyone could use, so offering it would be a lie in a dropdown.
 *
 * Nothing here runs on page load. The user asks, the user waits, and the run
 * can be abandoned.
 */

const ME = 'Biskupstunga'
const SIZES = [
  { n: 150, label: '150 positions · ~1 min' },
  { n: 300, label: '300 positions · ~2 min' },
  { n: 600, label: '600 positions · ~4 min' }
]

/* Sample months at random, take their games, keep only my moves. */
const gatherPool = async (targetGames) => {
  const months = getMonthlySummary()
    .filter((m) => m.total > 0)
    .map((m) => m.month)
  const shuffled = [...months].sort(() => Math.random() - 0.5)
  const pool = []
  let games = 0
  for (const month of shuffled) {
    if (games >= targetGames) break
    const data = await loadMonthlyPgn(month)
    if (!data) continue
    for (const pgn of Object.values(data)) {
      if (games >= targetGames) break
      const ps = positionsFromPgn(pgn, ME)
      if (!ps.length) continue
      pool.push(...ps)
      games += 1
    }
  }
  return { pool, games }
}

const EngineSample = () => {
  const [state, setState] = useState({ status: 'idle' })
  const abortRef = useRef(null)

  const run = useCallback(async (count) => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    setState({ status: 'gathering' })

    try {
      /* enough games that a single long one cannot skew a phase */
      const { pool, games } = await gatherPool(Math.max(30, Math.ceil(count / 4)))
      if (controller.signal.aborted) return
      if (!pool.length) {
        setState({ status: 'error', message: 'No games came back from the CDN.' })
        return
      }

      const samples = stratify(pool, count)
      /* Two searches per sampled move: the position before it and the position
         after. The difference IS the question — how much did MY move cost —
         and it cannot be read from one search. That doubles the budget, which
         is why the sizes above are quoted at the doubled cost. */
      const fens = samples.flatMap((s) => [s.fenBefore, s.fenAfter])

      setState({ status: 'running', done: 0, total: fens.length, games })
      const positions = await runGameReview(fens, {
        depth: 14,
        multipv: 1,
        signal: controller.signal,
        onProgress: (done, total) => setState({ status: 'running', done, total, games })
      })
      if (controller.signal.aborted) return

      /* win% is white-perspective; flip it for my black games so a "drop" is
         always a loss from MY side. */
      const drops = samples.map((s, i) => {
        const before = winPctOfLine(positions[i * 2]?.lines?.[0] ?? {})
        const after = winPctOfLine(positions[i * 2 + 1]?.lines?.[0] ?? {})
        if (!Number.isFinite(before) || !Number.isFinite(after)) return NaN
        const whiteToMove = s.fenBefore.split(' ')[1] === 'w'
        return whiteToMove ? before - after : after - before
      })

      setState({ status: 'done', phases: summarise(samples, drops), games, count })
    } catch (err) {
      if (!controller.signal.aborted) setState({ status: 'error', message: err.message })
    }
  }, [])

  const stop = () => {
    abortRef.current?.abort()
    setState({ status: 'idle' })
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionText
        headline="Where the points go"
        headlineAs="h3"
        headlineSize="heading-05"
        body="An engine pass over a random sample of my own moves, split by phase. Each sampled move costs two d14 searches — the position before it and after it — because the size of the drop across my move is the whole measurement. Measured at 376 ms per search on this machine, which is also why the whole archive is not an option: it would take about a week."
        bodyClass="kol-mono-12 text-fg-64"
        gap="gap-2"
      />

      {state.status === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <Button key={s.n} variant="secondary" size="sm" onClick={() => run(s.n)}>
              {s.label}
            </Button>
          ))}
        </div>
      )}

      {state.status === 'gathering' && (
        <p className="kol-mono-12 text-fg-64">Fetching games…</p>
      )}

      {state.status === 'running' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-sm border border-fg-08">
              <div
                className="h-full bg-fg-64 transition-[width]"
                style={{ width: `${(state.done / state.total) * 100}%` }}
              />
            </div>
            <span className="kol-mono-12 text-fg-64">
              {state.done}/{state.total}
            </span>
          </div>
          <div>
            <Button variant="ghost" size="sm" onClick={stop}>
              Stop
            </Button>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <p className="kol-mono-12 text-fg-64">{state.message}</p>
      )}

      {state.status === 'done' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" size="sm">
              {state.count} moves over {state.games} games
            </Badge>
          </div>
          {/* same scroll treatment as the autopsy rows */}
          <div className="flex flex-col overflow-x-auto">
            <div className="grid min-w-[28rem] grid-cols-[8rem_6rem_1fr] gap-2 border-b border-oq-08 pb-2">
              <span className="kol-helper-12 text-fg-48">PHASE</span>
              <span className="kol-helper-12 text-fg-48">AVG LOSS</span>
              <span className="kol-helper-12 text-fg-48">WORST SAMPLED MOVE</span>
            </div>
            {state.phases.map((p) => (
              <div
                key={p.key}
                className="grid min-w-[28rem] grid-cols-[8rem_6rem_1fr] items-baseline gap-2 border-b border-oq-08 py-2"
              >
                <span className="kol-mono-12">{p.label}</span>
                <span className="kol-mono-12">
                  {p.avgLoss === null ? '—' : `${p.avgLoss.toFixed(1)}%`}
                </span>
                <span className="kol-mono-12 text-fg-64">
                  {p.worst
                    ? `${p.worst.san} at ply ${p.worst.ply} — gave up ${p.worst.loss.toFixed(1)}%`
                    : '—'}
                  <span className="text-fg-48"> · {p.samples} sampled</span>
                </span>
              </div>
            ))}
          </div>
          <p className="kol-mono-12 text-fg-48">
            Loss is win-probability given up across one of my own moves, from my side. It is a
            sample, so treat the ordering of the phases as the finding and the exact figures as
            approximate — a second run will not reproduce them to the decimal.
          </p>
          <div>
            <Button variant="ghost" size="sm" onClick={() => setState({ status: 'idle' })}>
              Run again
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default EngineSample
