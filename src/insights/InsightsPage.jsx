import { useEffect, useMemo, useState } from 'react'
import { DashboardGrid, GridCard, DashTableCard } from '@kolkrabbi/kol-dashboards'
import { SectionText } from '@kolkrabbi/kol-component'
import { loadFullDataset } from '../data/sample-games.js'
import { diagnose } from './diagnose.js'
import OpeningAutopsy from './OpeningAutopsy.jsx'
import Suggestions from './Suggestions.jsx'
import EngineSample from './EngineSample.jsx'
import PageHeader from '../PageHeader'

/* /insights — what the 27,200 games say about how I actually play.
 *
 * Metadata tier only: no engine runs here. Everything on this page is derived
 * from what is already loaded for /stats, which is why it is instant. The
 * sampled engine pass (per-move accuracy, blunder motifs) is a separate tier
 * and lands on its own cards when it exists.
 *
 * Weaknesses lead. The page exists to say what to fix. */

/* The kind rides the card's `icon`, not its `badge`: `DashTableCard` accepts a
 * `badge` prop and never forwards it — `CardHeader` takes only icon/title/
 * subtitle, so anything passed as `badge` silently vanishes. `icon` is the seam
 * that actually reaches the header. (Dead prop filed upstream; not worked around
 * here beyond using the working one.) */
const KIND = {
  weakness: { icon: 'alert-triangle', label: 'WEAKNESS' },
  strength: { icon: 'check', label: 'STRENGTH' },
  note: { icon: 'info', label: 'NOTE' }
}

/* Evidence is label/value pairs, so the table is two columns and the header
 * carries no sort affordance — it is a receipt for the sentence above it. */
const EVIDENCE_COLUMNS = [
  {
    header: 'MEASURE',
    accessor: 'k',
    className: 'kol-table-cell-text',
    render: (r) => <span className="text-fg-64">{r.k}</span>
  },
  {
    header: 'VALUE',
    accessor: 'v',
    className: 'kol-table-cell-text',
    render: (r) => <span>{r.v}</span>
  }
]

const InsightsPage = () => {
  const [games, setGames] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    loadFullDataset()
      .then((data) => {
        if (!alive) return
        if (!data?.length) setError('Dataset came back empty — CDN unreachable?')
        else setGames(data)
      })
      .catch((err) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [])

  const result = useMemo(() => (games ? diagnose(games) : null), [games])

  return (
    <div className="kol-page">
      <PageHeader
        title="Insights"
        meta={
          result ? (
            <span className="kol-mono-14 text-fg-64">
              {result.counts.weakness} to fix · {result.counts.strength} working ·{' '}
              {games.length.toLocaleString()} games
            </span>
          ) : null
        }
      />

      {error && <p className="kol-mono-12 text-fg-64">{error}</p>}
      {!result && !error && <p className="kol-mono-12 text-fg-64">Reading the archive…</p>}

      {result && (
        <>
          <p className="kol-mono-12 text-fg-64 mb-8 max-w-[var(--kol-content-measure)]">
            Every line below compares me to myself — this opening against my other openings, this
            rating band against my other bands, this colour against the other. There is no outside
            benchmark in here, because an invented one would make every number a guess. Openings are
            counted as classified at the end of the opening phase, so transpositions land in the
            bucket they arrived at, not the one they were aimed at.
          </p>

          <DashboardGrid layout="4-col">
            {result.findings.map((f) => (
              <GridCard key={f.id} span="2x2">
                <DashTableCard
                  icon={KIND[f.kind].icon}
                  title={f.title}
                  subtitle={f.line}
                  rows={f.evidence.map(([k, v]) => ({ k, v }))}
                  columns={EVIDENCE_COLUMNS}
                  footer={KIND[f.kind].label}
                />
              </GridCard>
            ))}
          </DashboardGrid>

          <SectionText
            className="mt-16 mb-6"
            headline="Opening autopsy"
            headlineAs="h2"
            headlineSize="heading-04"
            body="The two pillars walked move by move. Unlike the cards above, this follows the actual move order rather than the opening's final label — which is the only way to see WHERE a line turns, as opposed to how it ended up classified."
            bodyClass="kol-mono-12 text-fg-64"
            gap="gap-2"
          />
          <OpeningAutopsy />

          <SectionText
            className="mt-16 mb-6"
            headline="What I already do that works"
            headlineAs="h2"
            headlineSize="heading-04"
            gap="gap-2"
          />
          <Suggestions />

          <SectionText
            className="mt-16 mb-6"
            headline="Engine sample"
            headlineAs="h2"
            headlineSize="heading-04"
            gap="gap-2"
          />
          <EngineSample />
        </>
      )}
    </div>
  )
}

export default InsightsPage
