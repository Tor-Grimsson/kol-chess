import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import StatsPage from './stats/StatsPage.jsx'
import LandingPage from './LandingPage.jsx'
import DatabasePage from './database/DatabasePage.jsx'
import Shell from './Shell.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<LandingPage />} />
          <Route path="analysis" element={<App />} />
          <Route path="games" element={<Navigate to="/database" replace />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
