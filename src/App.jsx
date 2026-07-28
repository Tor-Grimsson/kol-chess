import { useState } from 'react'
import { ChessControlsProvider, GameArchiveTable } from '@kolkrabbi/kol-chess'
import * as chessData from '@kolkrabbi/kol-chess/data'
import { Button, FullscreenOverlay } from '@kolkrabbi/kol-component'
import { EngineProvider } from './engine/EngineContext'
import Stage from './board/Stage'
import { takeQueuedGame } from './lib/gameHandoff'
import PasteGame from './lib/PasteGame'

/* The analysis page — structure owned here (2026-07-28). Nothing above the
 * board: shell navbar, then the stage; every control lives in the rail's tabs.
 * The rail's Games button opens the archive OVERLAY (quick pick, stay on the
 * board); /database's Browse tab hands off via queueGame → consumed on mount. */
function App() {
  const [loadedGame, setLoadedGame] = useState(takeQueuedGame)
  const [archiveOpen, setArchiveOpen] = useState(false)

  return (
    <div className="relative px-4 py-8 md:px-6 md:py-12">
      <ChessControlsProvider externalGame={loadedGame} chessData={chessData}>
        <EngineProvider>
          {/* stacked (<lg) needs a real height frame for its internal scroll —
              viewport minus shell bar (48) + page gutters (64) */}
          <div className="h-[calc(100dvh-112px)] min-h-0 lg:h-auto">
            <Stage onOpenGames={() => setArchiveOpen(true)} />
          </div>
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
