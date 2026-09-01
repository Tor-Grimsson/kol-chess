import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameArchiveTable } from '@kolkrabbi/kol-chess'
import * as chessData from '../data/sample-games.js'
import { Icon } from '@kolkrabbi/kol-icons'
import PageHeader from '../PageHeader'
import { queueGame } from '../lib/gameHandoff'
import PasteGame from '../lib/PasteGame'
import QueryConsole from './QueryConsole'
import LearnTab from './LearnTab'

/* /database — ONE page over the 27.2k-game set, two ways in:
 *   Browse — the archive table ("Load here" hands the game to the board)
 *   Query  — the SQL console (QueryConsole.jsx, DuckDB-WASM)
 * Both tabs stay mounted so table scope + query results survive switches. */

const PAGE_TABS = [
  { id: 'query', label: 'Query' },
  { id: 'browse', label: 'Browse' },
  { id: 'learn', label: 'Learn' },
]

export default function DatabasePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('query')
  const [lessonSql, setLessonSql] = useState(null)

  const loadOnBoard = (game) => {
    queueGame(game)
    navigate('/analysis')
  }

  return (
    // .kol-page = the DS page scaffold; the body below the header takes the
    // canvas rung of the width scale
    <div className="kol-page">
      <PageHeader
        title="Database"
        tabs={PAGE_TABS}
        tab={tab}
        onTabChange={setTab}
        action={tab === 'browse' && <PasteGame onLoad={loadOnBoard} />}
      />
      <div className="max-w-[var(--kol-content-canvas)]">
      <div className={tab === 'browse' ? '' : 'hidden'}>
        {/* provenance — the pipeline's first stage, clickable proof */}
        <p className="kol-mono-12 text-fg-64 mb-4">
          {chessData.getManifest().totalGames.toLocaleString('en')} games pulled monthly from the chess.com API by{' '}
          <a
            href="https://github.com/Tor-Grimsson/kol-ds/tree/main/packages/scrape"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1"
          >
            kol-scrape
            <Icon name="external-link" size={12} />
          </a>{' '}
          → monthly JSON shards on the CDN.
        </p>
        <GameArchiveTable chessData={chessData} onGameLoad={loadOnBoard} />
      </div>
      <div className={tab === 'query' ? '' : 'hidden'}>
        <QueryConsole lessonSql={lessonSql} onLessonConsumed={() => setLessonSql(null)} />
      </div>
      <div className={tab === 'learn' ? '' : 'hidden'}>
        <LearnTab
          onTry={(sql) => {
            setLessonSql(sql)
            setTab('query')
          }}
        />
      </div>
      </div>
    </div>
  )
}
