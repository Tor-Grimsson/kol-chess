import { useState } from 'react'
import { ChessControlsProvider, GameArchiveTable } from '@kolkrabbi/kol-chess'
import * as chessData from './data/sample-games.js'
import { Button, FullscreenOverlay } from '@kolkrabbi/kol-component'
import { EngineProvider } from './engine/EngineContext'
import Stage from './board/Stage'
import PageHeader from './PageHeader'
import { takeQueuedGame } from './lib/gameHandoff'
import PasteGame from './lib/PasteGame'

const RAIL_TABS = [
  { id: 'controls', label: 'Controls' },
  { id: 'engine', label: 'Engine' },
  { id: 'review', label: 'Review' },
]

/* The analysis page — structure owned here (2026-07-28). PageHeader carries
 * the title + the rail tabs + the Games action (header system); the rail is
 * pure panes. Games opens the archive OVERLAY (quick pick, stay on the
 * board); /database's Browse tab hands off via queueGame → consumed on mount. */
function App() {
  const [loadedGame, setLoadedGame] = useState(takeQueuedGame)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [railTab, setRailTab] = useState('controls')

  return (
    <div className="kol-page relative [--chess-stage-reserve:250px]">
      <PageHeader
        title="Game Analysis"
        tabs={RAIL_TABS}
        tab={railTab}
        onTabChange={setRailTab}
        action={
          <Button variant="ghost" size="sm" iconLeft="view-list" onClick={() => setArchiveOpen(true)}>
            Games
          </Button>
        }
      />
      <ChessControlsProvider externalGame={loadedGame} chessData={chessData}>
        <EngineProvider>
          {/* stacked (<lg) scrolls as a page — board, then the rail at its
              natural height. lg+ the board owns the height (Stage). */}
          <Stage railTab={railTab} />
        </EngineProvider>
      </ChessControlsProvider>

      <FullscreenOverlay open={archiveOpen} onClose={() => setArchiveOpen(false)} closeButton={false}>
        <div className="max-h-[88dvh] w-[min(1100px,calc(100vw-48px))] overflow-y-auto rounded bg-surface-primary p-4 md:p-6">
          <div className="-mr-2 -mt-1 mb-2 flex items-center justify-end gap-2">
            <PasteGame
              onLoad={(game) => {
                setLoadedGame(game)
                setArchiveOpen(false)
              }}
            />
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
