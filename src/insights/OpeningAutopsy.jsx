import { useEffect, useMemo, useState } from 'react'
import { Chess } from '../lib/rules.js'
import { SectionText, Badge } from '@kolkrabbi/kol-component'
import { autopsy } from './autopsy.js'

/* The two named openings, walked move by move.
 *
 * Every row is a node on the most-played road through the opening, and the
 * score is my result in the games that passed through it. A negative delta
 * means the position got worse for me from that point — which is what "where it
 * goes wrong" can honestly mean without an engine.
 *
 * The books are dynamic imports: /insights should not pay for 4 MB of JSON
 * before the metadata cards, which need none of it, have rendered.
 */

/* Fetched from `public/books/`, not imported: as modules these compiled into
 * multi-MB JS chunks the engine had to parse as code. See src/play/opponents.js. */
const BOOKS = `${import.meta.env.BASE_URL}books`
const getJson = (name) => fetch(`${BOOKS}/${name}.json`).then((r) => { if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r.json() })

const pctClass = (v) => (v >= 55 ? 'text-fg-96' : v <= 45 ? 'text-fg-48' : 'text-fg-64')

const Row = ({ n }) => (
  <div
    className={`grid grid-cols-[3rem_1fr_5rem_4.5rem_4rem] items-baseline gap-2 py-1 ${
      n.mine ? '' : 'text-fg-48'
    }`}
  >
    <span className="kol-mono-12 text-fg-48 text-right">{n.moveNumber}.</span>
    <span className="kol-mono-12">
      {n.mine ? <strong>{n.san}</strong> : n.san}
      {n.betterSibling && (
        <span className="kol-mono-12 text-fg-64">
          {' '}
          — {n.betterSibling.san} scored {n.betterSibling.scorePct.toFixed(0)}% over{' '}
          {n.betterSibling.games}
        </span>
      )}
    </span>
    <span className="kol-mono-12 text-fg-48">{n.games.toLocaleString()}g</span>
    <span className={`kol-mono-12 ${pctClass(n.scorePct)}`}>{n.scorePct.toFixed(1)}%</span>
    <span className="kol-mono-12 text-fg-48">
      {n.drop < -0.5 ? `↓${n.drop.toFixed(1)}` : ''}
    </span>
  </div>
)

const OpeningAutopsy = () => {
  const [books, setBooks] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([getJson('style-book'), getJson('reply-book')])
      .then(([book, reply]) => alive && setBooks({ book, reply }))
      .catch(() => alive && setErr('Books not built — run scripts/build-style-book.mjs'))
    return () => {
      alive = false
    }
  }, [])

  const lines = useMemo(
    () => (books ? autopsy(Chess, books.book, books.reply) : null),
    [books]
  )

  if (err) return <p className="kol-mono-12 text-fg-64">{err}</p>
  if (!lines) return <p className="kol-mono-12 text-fg-64">Walking the lines…</p>

  return (
    <div className="flex flex-col gap-10">
      {lines.map((l) => (
        <section key={l.key} className="flex flex-col gap-3">
          <SectionText
            label={`AS ${l.side.toUpperCase()}`}
            headline={l.label}
            headlineAs="h3"
            headlineSize="heading-05"
            body={`The most-played road, ${l.prefix.join(' ')} onward. Score is my result in the games that reached each position; the arrow is how far it fell from the move before it.`}
            bodyClass="kol-mono-12 text-fg-64"
            gap="gap-2"
          />
          {l.worst && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning" size="sm">
                Sharpest fall: {l.worst.moveNumber}.{l.worst.mine ? '' : '..'}
                {l.worst.san} · {l.worst.drop.toFixed(1)} pts
              </Badge>
              {l.missed.length > 0 && (
                <Badge variant="info" size="sm">
                  {l.missed.length} point{l.missed.length === 1 ? '' : 's'} with a better move I
                  already play
                </Badge>
              )}
            </div>
          )}
          {/* The row is a fixed five-column grid whose columns cannot usefully
              shrink — at 390 it measured 407 and pushed the document sideways.
              It scrolls in its own container instead of restacking, which is
              the estate's ruled answer for wide tabular content: the DS's own
              `.kol-table-wrapper` does exactly this and the 2026-08-26
              TableMobileScroll ruling says the cut columns ARE the affordance,
              with no fade and no touch hint. */}
          <div className="overflow-x-auto border-t border-oq-08 pt-2">
            <div className="min-w-[26rem]">
              {l.nodes.map((n) => (
                <Row key={`${n.ply}-${n.san}`} n={n} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

export default OpeningAutopsy
