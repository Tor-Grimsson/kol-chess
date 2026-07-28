import { useState } from 'react'
import { ChessControlsProvider, GameArchiveTable } from '@kolkrabbi/kol-chess'
import * as chessData from '@kolkrabbi/kol-chess/data'
import { Button, FullscreenOverlay, Textarea, usePopover, PopoverPanel } from '@kolkrabbi/kol-component'
import { EngineProvider } from './engine/EngineContext'
import { EngineControls, EngineReadout } from './engine/AnalysisPanel'
import Stage from './board/Stage'
import { resolveGameInput } from './lib/resolveGame'

const PasteGame = ({ onLoad }) => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const popover = usePopover({ open, onOpenChange: setOpen })

  const handleLoad = async () => {
    setBusy(true)
    setError(null)
    try {
      onLoad(await resolveGameInput(input, chessData))
      setOpen(false)
      setInput('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        iconLeft="edit"
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
      >
        Paste game
      </Button>
      <PopoverPanel popover={popover}>
        <div className="flex w-[420px] flex-col gap-2 p-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={6}
            placeholder={'Paste a PGN (chess.com Share → PGN)\nor a chess.com URL of one of your own games'}
          />
          {error && <p className="kol-mono-12 text-fg-secondary">{error}</p>}
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleLoad} disabled={busy || !input.trim()}>
              {busy ? 'Loading…' : 'Load game'}
            </Button>
          </div>
        </div>
      </PopoverPanel>
    </>
  )
}

/* The analysis page — STRUCTURE OWNED HERE (2026-07-28 restructure): composed
 * from kol-chess elements. Row 1 is the shell navbar; row 2 is the page
 * toolbar (Games · engine controls); row 3 the stage. The archive overlay and
 * game state live here, not upstream. Reserve = shell 150 + toolbar row 40. */
function App() {
  const [loadedGame, setLoadedGame] = useState(null)
  const [archiveOpen, setArchiveOpen] = useState(false)

  return (
    <div className="relative px-4 py-8 md:px-6 md:py-12 [--chess-stage-reserve:190px]">
      <ChessControlsProvider externalGame={loadedGame} chessData={chessData}>
        <EngineProvider>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" iconLeft="grid" onClick={() => setArchiveOpen(true)}>
              Games
            </Button>
            <span className="flex-1" />
            <EngineControls />
          </div>
          {/* stacked (<lg) needs a real height frame for its internal scroll —
              upstream's h-dvh wrapper, minus shell bar + gutters + toolbar */}
          <div className="h-[calc(100dvh-184px)] min-h-0 lg:h-auto">
            <Stage panel={<EngineReadout />} />
          </div>
        </EngineProvider>
      </ChessControlsProvider>

      <FullscreenOverlay open={archiveOpen} onClose={() => setArchiveOpen(false)} closeButton={false}>
        <div className="max-h-[88dvh] w-[min(1100px,calc(100vw-48px))] overflow-y-auto rounded bg-surface-primary p-4 md:p-6">
          <div className="-mr-2 -mt-1 mb-2 flex items-center justify-end gap-2">
            <PasteGame onLoad={setLoadedGame} />
            <Button variant="ghost" size="sm" iconLeft="x" onClick={() => setArchiveOpen(false)}>
              Close
            </Button>
          </div>
          <GameArchiveTable
            chessData={chessData}
            onGameLoad={(game) => {
              setLoadedGame(game)
              setArchiveOpen(false)
            }}
          />
        </div>
      </FullscreenOverlay>
    </div>
  )
}

export default App
