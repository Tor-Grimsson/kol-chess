import { useState } from 'react'
import * as chessData from '../data/sample-games.js'
import { Button, Textarea, usePopover, PopoverPanel } from '@kolkrabbi/kol-component'
import { resolveGameInput } from './resolveGame'

/* Paste-a-game popover — shared by the board's archive overlay and the
 * database Browse tab. onLoad receives the resolved externalGame. */
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

export default PasteGame
