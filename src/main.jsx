import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ModalProvider } from '@kolkrabbi/kol-component'
import './index.css'
import App from './App.jsx'
import StatsPage from './stats/StatsPage.jsx'
import LandingPage from './LandingPage.jsx'
import DatabasePage from './database/DatabasePage.jsx'
import InsightsPage from './insights/InsightsPage.jsx'
import PlayPage from './play/PlayPage.jsx'
import BotPage from './play/BotPage.jsx'
import SettingsPage from './SettingsPage.jsx'
import Shell from './Shell.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ModalProvider mounts once at the root so useModal's confirm/prompt
            portal floats above the shell — the DS's promise-based dialogs. */}
        <Route element={<ModalProvider><Shell /></ModalProvider>}>
          <Route index element={<LandingPage />} />
          <Route path="analysis" element={<App />} />
          <Route path="games" element={<Navigate to="/database" replace />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="play" element={<PlayPage />} />
          <Route path="bot" element={<BotPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
