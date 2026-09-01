import { useEffect, useState } from 'react'
import { SectionText } from '@kolkrabbi/kol-component'

/* Moves that already worked, that never became the habit.
 *
 * WHAT THIS DELIBERATELY IS NOT: a list of openings someone thinks would suit
 * me. The first version of the generator did try that — named lines one move
 * off my repertoire — and returned Ware Opening, Sodium Attack and Lemming
 * Defense, because being NAMED says nothing about being good. Ranking unplayed
 * named moves by opportunity just finds the moves nobody plays because they
 * lose. Suggesting on quality grounds needs an engine or a masters database;
 * neither is here, and a guess with a number on it is worse than no row.
 *
 * So every row below is my own record against my own record: a move I played
 * enough times to trust, scoring clearly better than the move I usually play
 * from the identical position. The claim is only ever "when you did this, it
 * went better than what you normally do — here is the sample."
 */

const BOOKS = `${import.meta.env.BASE_URL}books`
const getJson = (name) => fetch(`${BOOKS}/${name}.json`).then((r) => { if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r.json() })

const Suggestions = () => {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    getJson('suggestions')
      .then((d) => alive && setData(d))
      .catch(() => alive && setErr('Not built — run scripts/build-suggestions.mjs'))
    return () => {
      alive = false
    }
  }, [])

  if (err) return <p className="kol-mono-12 text-fg-64">{err}</p>
  if (!data) return <p className="kol-mono-12 text-fg-64">Reading the book…</p>

  return (
    <div className="flex flex-col gap-4">
      <SectionText
        headline="Moves that worked that I never adopted"
        headlineAs="h3"
        headlineSize="heading-05"
        body={`From identical positions: a move I have played at least ${data.meta.minAlt} times that outscored my usual answer by ${data.meta.minEdge}+ points. Both numbers are my own results — there is no engine and no outside authority behind this list, which is exactly why it says "this went better for you" and never "this is the better move".`}
        bodyClass="kol-mono-12 text-fg-64"
        gap="gap-2"
      />
      {/* same scroll treatment as the autopsy rows — see the note there */}
      <div className="flex flex-col overflow-x-auto">
        <div className="grid min-w-[34rem] grid-cols-[5rem_1fr_1fr_4rem] gap-2 border-b border-oq-08 pb-2">
          <span className="kol-helper-12 text-fg-48">MOVE</span>
          <span className="kol-helper-12 text-fg-48">WHEN I PLAYED IT</span>
          <span className="kol-helper-12 text-fg-48">INSTEAD OF MY USUAL</span>
          <span className="kol-helper-12 text-fg-48 text-right">EDGE</span>
        </div>
        {data.suggestions.map((s) => (
          <div
            key={`${s.epd}-${s.san}`}
            className="grid min-w-[34rem] grid-cols-[5rem_1fr_1fr_4rem] items-baseline gap-2 border-b border-oq-08 py-2"
          >
            <span className="kol-mono-12">
              <strong>{s.san}</strong>
            </span>
            <span className="kol-mono-12 text-fg-64">
              {s.scorePct}% over {s.games} games
              {s.name && <span className="text-fg-48"> · {s.name}</span>}
            </span>
            <span className="kol-mono-12 text-fg-64">
              {s.instead} — {s.insteadPct}% over {s.insteadGames.toLocaleString()}
            </span>
            <span className="kol-mono-12 text-right">+{s.edge}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Suggestions
