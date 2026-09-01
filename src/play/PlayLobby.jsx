import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ContentCollection, ContentRow } from '@kolkrabbi/kol-component'
import { OPPONENTS, initialsOf } from './opponents.js'

/* /play BEFORE a game exists (2026-08-31).
 *
 * The page used to open on a board in the start position, with ∞ clocks and
 * "Your move" — a game that was not a game, which nothing had chosen and which
 * starting a real one wiped. It also fetched the default opponent's book on
 * mount: 3.8 MB of JSON for a decision the user had not made yet.
 *
 * The reference apps do not do this. chess.com's Play page carries no board at
 * all — a commit, then the modes. So this is the idle state: the roster, which
 * is the part of this app that does not exist anywhere else.
 *
 * NO BOOK IS FETCHED HERE. The roster is `opponents.js` (in the bundle) plus
 * `books/index.json` (1.2 KB) for the position counts. A book downloads when a
 * game starts, and only the one that was picked.
 */

const INDEX_URL = `${import.meta.env.BASE_URL}books/index.json`

/* THE DS ROW (kol-component 0.147.0). This was a hand-rolled button here for
 * one evening — filed as `ContentRowRosterVariant` and shipped upstream the
 * same day, ruled to the numbers that were settled on screen: a fixed 56px row
 * the content fills, a 40x40 thumb, 8px padding and gap, both lines truncated,
 * and the deliberate 2px on the text column.
 *
 * The fixed height needed a mechanism the family did not have — the row boxes
 * published a min-height FLOOR, which is precisely why the local version drifted
 * 34 → 40 → 50 → 58 every time the copy or the padding moved. */
/* Portrait when the opponent declares one, initials when it does not — the
 * roster has always drawn from `initialsOf` and must keep drawing before a
 * single file lands. `portrait` is a URL, not a key, so the file can live in
 * `public/masters/` or on the CDN without this knowing which. */
const OpponentMedia = ({ opponent }) =>
  opponent.portrait ? (
    <img src={opponent.portrait} alt="" className="h-full w-full object-cover" />
  ) : (
    <span className="kol-helper-12 text-fg-64">{initialsOf(opponent.label)}</span>
  )

const OpponentRow = ({ opponent, positions, onPick }) => (
  <ContentRow
    variant="roster"
    title={opponent.label}
    /* `roster` reads its second line from `meta`, not `date` — the slot map is
       per variant (`default` uses date + size). */
    meta={opponent.note + (positions ? ` · ${positions.toLocaleString()} positions` : '')}
    media={<OpponentMedia opponent={opponent} />}
    onClick={() => onPick(opponent.key)}
  />
)

const PlayLobby = ({ onNewGame, onPickOpponent }) => {
  const [positions, setPositions] = useState({})

  /* Best-effort: the roster renders without it, the counts just do not appear. */
  useEffect(() => {
    let alive = true
    fetch(INDEX_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.masters) return
        setPositions(Object.fromEntries(d.masters.map((m) => [m.key, m.positions])))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <Button variant="accent" size="lg" className="w-full sm:w-auto sm:self-start" onClick={onNewGame}>
        New game
      </Button>

      <div className="flex flex-col gap-3">
        <span className="kol-helper-12 text-fg-64">OR PICK AN OPPONENT</span>
        {/* THE WALL RULES THE COUNT, NOT US (kol-component 0.148.0). This was
            `md:grid-cols-2 xl:grid-cols-3`, which is how we ended up with 324px
            tracks at 768 — narrower than the 350 a phone gets, so a WIDER screen
            clipped more text. `cols` is a ceiling now: the wall takes up to
            three and drops one rather than go under `minCol`.
            360 rather than the ruled 320 default because these rows carry two
            truncated lines — measured, the meta clips on 7 of 10 rows at 324 and
            3 of 10 at 373. That evidence is why the seam exists. */}
        <ContentCollection cols={3} minCol="360px" gap={8}>
          {OPPONENTS.map((o) => (
            <OpponentRow
              key={o.key}
              opponent={o}
              positions={positions[o.key]}
              onPick={onPickOpponent}
            />
          ))}
        </ContentCollection>
      </div>

      <p className="kol-mono-12 text-fg-48 border-oq-08 border-t pt-3">
        Every opponent is a position book built from real games, not a language model.{' '}
        <Link to="/bot" className="text-fg-64 hover:text-fg-96 underline underline-offset-2">
          How the bot works
        </Link>
      </p>
    </div>
  )
}

export default PlayLobby
