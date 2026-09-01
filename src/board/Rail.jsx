import { useState } from 'react'
import {
  SetupPanel,
  PiecePalette,
  GamePicker,
  MaterialSummary,
  NotationPanel,
  PlaybackControls,
  useChessControls,
  useChessKeyboardShortcuts,
} from '@kolkrabbi/kol-chess'
import { Button, Divider } from '@kolkrabbi/kol-component'
import { EngineTab } from '../engine/AnalysisPanel'
import GameReview from '../engine/ReviewPanel'

/* The right rail — COMPOSED HERE from kol-chess elements (0.5.2 exports;
 * AlternativeControlsMock retired 2026-07-28). The Controls · Engine · Review
 * tabs live in the PageHeader and drive `tab` from above.
 *
 * Constant frame: SETUP + palette + game picker + playback — always there.
 * Swap zone: the material→notation region swaps for engine or review output.
 * All three panes stay MOUNTED (hidden, not unmounted) so a finished review
 * and live engine readout survive tab switches. One padding system: the main
 * column's p-3/gap-4 spine — panes bring no padding of their own. */

const paneCls = (active, extra = '') =>
  `${active ? 'flex min-h-0 flex-1 flex-col' : 'hidden'} ${extra}`.trim()

const Rail = ({ tab }) => {
  const {
    notationPairs,
    moveIndex,
    selectPly,
    sidelines,
    activeSideline,
    goToSidelineMove,
    isLoading,
  } = useChessControls()
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)

  useChessKeyboardShortcuts()

  return (
    /* bg-oq-02 = the controls block's own surface — the whole rail reads as
     * one panel */
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-oq-02 text-fg-88 lg:overflow-hidden">
      <SetupPanel className={`p-3 ${mobileSettingsOpen ? '' : 'max-lg:hidden'}`} />

      <PiecePalette className="hidden border-t border-oq-08 bg-fg-02 p-3 lg:block" />

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
        {/* ponytail: [&>div:first-child]:min-w-0 lets the label column shrink so the
            star + settings buttons stay on-screen at phone widths — upstream fix
            is min-w-0 + truncate inside kol-chess GamePicker */}
        <GamePicker
          className="flex-shrink-0 [&>div:first-child]:min-w-0 [&_.kol-dd-trigger]:overflow-hidden"
          actions={
            <Button
              variant="ghost"
              size="sm"
              iconOnly="settings-01"
              className="lg:hidden"
              selected={mobileSettingsOpen}
              onClick={() => setMobileSettingsOpen((v) => !v)}
              title="Board settings"
              aria-label="Board settings"
            />
          }
        />

        <Divider />

        {/* ── swap zone: material→notation ⟷ engine ⟷ review ── */}
        {/* overflow-hidden: under height squeeze the pane clips (notation
          * scrolls internally) instead of painting over the playback unit */}
        <div className={paneCls(tab === 'controls', 'gap-4 overflow-hidden')}>
          <MaterialSummary className="flex-shrink-0" />
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex flex-shrink-0 items-center border-t border-oq-08 pt-4">
              <span className="kol-helper-12 text-fg-80">NOTATION</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded bg-oq-04 p-3">
              <NotationPanel
                notationPairs={notationPairs}
                activePly={moveIndex}
                onSelectPly={selectPly}
                isLoading={isLoading}
                sidelines={sidelines}
                activeSideline={activeSideline}
                onSelectSidelineMove={goToSidelineMove}
              />
            </div>
          </div>
        </div>
        <div className={paneCls(tab === 'engine', 'overflow-y-auto')}>
          <EngineTab active={tab === 'engine'} />
        </div>
        <div className={paneCls(tab === 'review', 'overflow-y-auto')}>
          <GameReview active={tab === 'review'} />
        </div>

        <div className="order-first flex-shrink-0 lg:order-none">
          {/* the ONE playback unit; mobile floats it to the top, above the picker */}
          <PlaybackControls />
        </div>
      </div>
    </div>
  )
}

export default Rail
