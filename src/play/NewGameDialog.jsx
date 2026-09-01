import { useEffect, useState } from 'react'
import { Button, Dropdown, FullscreenOverlay, SectionText } from '@kolkrabbi/kol-component'
import { OPPONENTS, findOpponent } from './opponents.js'
import { PRESETS, UNLIMITED } from './timeControls.js'

/* New game → options → Start.
 *
 * THE SHAPE BOTH SITES USE, and the reason it exists: settings that can restart
 * a game must not sit live in the sidebar. The first version had them there as
 * always-on dropdowns, and changing the time control mid-game silently wiped the
 * position — a control that destroys your game as a side effect of being read.
 * Gathering the choices in a dialog and committing them on Start makes the
 * destructive moment explicit and cancellable.
 *
 * `FullscreenOverlay` — the DS's scrim + centred sheet. It brings Escape,
 * backdrop click, body scroll lock, focus trap and focus return, all things
 * this would otherwise hand-roll badly.
 *
 * IT WAS A `ShellDrawer` UNTIL 2026-08-31 and that was wrong against the brief.
 * The user asked for "something like chess.com or lichess, which is a
 * fullscreen modal not sidebar" — an edge drawer is a different object, and at
 * 390px a 380px drawer left a 10px strip of backdrop, which read as broken
 * rather than as a sheet.
 *
 * The old note against FullscreenOverlay was that `.kol-overlay`'s backdrop is
 * OPAQUE surface-primary, so a floating panel sat on its own colour with no
 * card. That objection dies with the drawer: chess.com's new-game surface IS an
 * opaque full-screen page, so the panel stops pretending to float and fills the
 * sheet instead — full width on a phone, a centred column on a desktop.
 *
 * `useModal` is still out: promise-based prompt/confirm, no arbitrary content.
 */

/* Grouped by the class `timeControls.js` already derives, in the order both
 * sites list them. Unlimited is not a class — it sits on its own above. */
const CLASS_ORDER = [
  ['bullet', 'Bullet'],
  ['blitz', 'Blitz'],
  ['rapid', 'Rapid'],
  ['classical', 'Classical']
]

/* Every choice visible and one tap away, instead of twelve behind a dropdown —
 * the "Choose Time" shape from chess.com, which is the one part of it that is
 * better rather than just different. The class captions do the teaching: you
 * learn that 3+2 is blitz by seeing it sit under Blitz. */
const TimeControlPicker = ({ value, onChange }) => (
  <div className="flex flex-col gap-2">
    <Button
      variant="outline"
      size="sm"
      selected={value === UNLIMITED.id}
      className="w-full"
      onClick={() => onChange(UNLIMITED.id)}
    >
      Unlimited
    </Button>
    {CLASS_ORDER.map(([klass, label]) => {
      const inClass = PRESETS.filter((c) => c.klass === klass)
      if (!inClass.length) return null
      return (
        <div key={klass} className="flex flex-col gap-1.5">
          <span className="kol-helper-12 text-fg-48">{label}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {inClass.map((c) => (
              <Button
                key={c.id}
                variant="outline"
                size="sm"
                selected={value === c.id}
                className="w-full"
                onClick={() => onChange(c.id)}
              >
                {c.id}
              </Button>
            ))}
          </div>
        </div>
      )
    })}
  </div>
)

const COLOURS = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'random', label: 'Random' }
]

const NewGameDialog = ({ open, initial, onStart, onClose }) => {
  const [draft, setDraft] = useState(initial)

  /* Reopening starts from what is actually being played, not from whatever was
     abandoned last time the dialog was cancelled. */
  useEffect(() => {
    if (open) setDraft(initial)
  }, [open, initial])

  const opponent = findOpponent(draft.opponentKey)

  const start = () => {
    const colour = draft.colour === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : draft.colour
    onStart({ ...draft, colour })
  }

  return (
    <FullscreenOverlay open={open} onClose={onClose}>
      {/* The sheet hugs its child, so the width lives here: the full column on
        * a phone, a centred 460 on a desktop. */}
      <div className="flex w-[min(460px,calc(100vw-48px))] flex-col">
        <span className="kol-helper-12 text-fg-64">NEW GAME</span>
        <SectionText
          className="mt-4"
          headline="Who, which colour, how long"
          headlineAs="h2"
          headlineSize="heading-05"
          gap="gap-2"
        />

        {/* A `label` is inline and `Dropdown` hugs its content by design
          * ("width belongs to the CALL SITE", 2026-08-09) — together that put
          * each caption on the same line as its control and gave the three
          * controls three different widths. Stacked and full-width, they line
          * up as one column. */}
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="kol-helper-12 text-fg-64 flex flex-col gap-1.5">
              OPPONENT
              <Dropdown
                className="w-full"
                value={draft.opponentKey}
                options={OPPONENTS.map((o) => ({ value: o.key, label: o.label }))}
                onChange={(v) => setDraft((d) => ({ ...d, opponentKey: v }))}
              />
            </label>
            <p className="kol-mono-12 text-fg-48">{opponent.note}</p>
          </div>

          <label className="kol-helper-12 text-fg-64 flex flex-col gap-1.5">
            YOU PLAY
            <Dropdown
              className="w-full"
              value={draft.colour}
              options={COLOURS}
              onChange={(v) => setDraft((d) => ({ ...d, colour: v }))}
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="kol-helper-12 text-fg-64">TIME CONTROL</span>
            <TimeControlPicker
              value={draft.controlId}
              onChange={(v) => setDraft((d) => ({ ...d, controlId: v }))}
            />
          </div>
        </div>

        {/* The commit is the loudest thing on the sheet, as it is on both
          * sites — full width, and Cancel demoted under it rather than beside
          * it, so the thumb has one obvious target. */}
        <div className="mt-8 flex flex-col gap-2">
          {/* `accent` is the DS's filled CTA. `primary` is "subtle bg-fg-04
            * fill, daily chrome" — in dark that renders rgb(25,25,29) on a
            * near-black sheet, which put the commit BELOW a selected time
            * preset (a white fill) in the hierarchy. */}
          <Button variant="accent" size="lg" className="w-full" onClick={start}>
            Start game
          </Button>
          <Button variant="ghost" size="md" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </FullscreenOverlay>
  )
}

export default NewGameDialog
