import { useState } from 'react'
import { AlternativeControlsMock } from '@kolkrabbi/kol-chess'
import { Button, TabsRow } from '@kolkrabbi/kol-component'
import { EngineTab } from '../engine/AnalysisPanel'
import GameReview from '../engine/ReviewPanel'

/* The right rail, tabbed: Controls · Engine · Review. Everything that used to
 * float above the board lives here now — the board can never be pushed.
 * All three tab bodies stay MOUNTED (hidden, not unmounted) so a finished
 * review and live engine readout survive tab switches. */

const TABS = [
  { id: 'controls', label: 'Controls' },
  { id: 'engine', label: 'Engine' },
  { id: 'review', label: 'Review' },
]

const paneCls = (active, extra = '') =>
  `${active ? 'flex min-h-0 flex-1 flex-col' : 'hidden'} ${extra}`.trim()

const Rail = ({ onOpenGames }) => {
  const [tab, setTab] = useState('controls')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex flex-shrink-0 items-center justify-between gap-2 border-b border-fg-12">
        <TabsRow tabs={TABS} value={tab} onChange={setTab} />
        <Button variant="ghost" size="sm" iconLeft="view-list" onClick={onOpenGames}>
          Games
        </Button>
      </div>
      <div className={paneCls(tab === 'controls', 'overflow-y-auto lg:overflow-hidden')}>
        <AlternativeControlsMock />
      </div>
      <div className={paneCls(tab === 'engine', 'overflow-y-auto')}>
        <EngineTab />
      </div>
      <div className={paneCls(tab === 'review', 'overflow-y-auto')}>
        <GameReview />
      </div>
    </div>
  )
}

export default Rail
