import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChessAnalysisLayout } from '@kolkrabbi/kol-chess'
import * as chessData from '@kolkrabbi/kol-chess/data'
import { Button, Textarea, usePopover, PopoverPanel } from '@kolkrabbi/kol-component'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import AnalysisPanel from './engine/AnalysisPanel'
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

function App() {
  const navigate = useNavigate()
  const [pastedGame, setPastedGame] = useState(null)

  return (
    <div className="relative mx-auto max-w-[1232px] px-4 py-8 md:px-6 md:py-12">
      {/* rides the layout's top row (its Games button sits left) — toggle left
          of the Stats nav, matching the Stats page header order */}
      <div className="absolute right-4 top-11 flex items-center gap-2 md:right-6 md:top-15">
        <ThemeToggle variant="icon" />
        <Button variant="ghost" size="sm" iconLeft="stat-chart-a" onClick={() => navigate('/stats')}>
          Stats
        </Button>
      </div>
      <ChessAnalysisLayout
        chessData={chessData}
        panel={<AnalysisPanel />}
        externalGame={pastedGame}
        overlayActions={
          /* Paste + Close paired right — the slot renders inside the overlay's
           * full-width flex row, so the spacer pushes them right */
          <>
            <span className="flex-1" />
            <PasteGame onLoad={setPastedGame} />
          </>
        }
      />
    </div>
  )
}

export default App
