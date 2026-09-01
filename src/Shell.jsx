import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@kolkrabbi/kol-shell'
import useEmbed from './useEmbed.js'

/* THE APP TIER, NOT THE SITE TIER (2026-08-30). This was kol-framework's
 * `AppShell` — the brand SideNav at 264px, with the theme toggle inside it.
 * kol-chess is an application, not a site: four tool pages, no marketing
 * surface. kol-shell's `AppShell` is the register that matches — a flat 48px
 * `NavRail`, grab-to-open, no header and no footer.
 *
 * The 216px it gives back goes to the board, which was width-bound at 1280
 * under the wide rail (the standing geometry complaint since 2026-08-27).
 *
 * Router-agnostic by design: the rail takes `currentPath` + `onNavigate` and
 * knows nothing about react-router, so the wiring lives here.
 *
 * `touch="drawer"` (kol-shell 0.31.0). Below 768 the rail goes off-canvas, the
 * content reclaims its 48px, and the package renders the trigger and the scrim.
 *
 * This was a local fold for one day — `MobileNav.jsx` plus a media block in
 * `index.css` — filed as `ShellRailNoDrawerOnMobile` and shipped upstream the
 * same day. The DS fixed both things that made the local version ugly: NavRail
 * stops writing the `:root` width token in drawer mode, so no `!important` is
 * needed, and the route-change effect is mode-aware instead of forcing the rail
 * back open on every navigation.
 */

const NAV_ITEMS = [
  { icon: 'chess-pawn', path: '/', label: 'Overview' },
  { icon: 'grid', path: '/analysis', label: 'Board' },
  { icon: 'chess-rook', path: '/play', label: 'Play' },
  { icon: 'terminal', path: '/database', label: 'Database' },
  { icon: 'stat-chart-a', path: '/stats', label: 'Statistics' },
  { icon: 'highlighter-circle', path: '/insights', label: 'Insights' },
  { icon: 'info', path: '/bot', label: 'The bot' },
]

/* Settings is a bottom rung, below the rule. `settingsPath` makes it TOGGLE
 * rather than navigate — picking it again (or pressing `,`) returns you where
 * you were instead of stranding you on the page. */
const BOTTOM_ITEMS = [{ icon: 'nav-settings', path: '/settings', label: 'Settings' }]

const LOGOMARK = { svgUrl: '/favicon/favicon-kol-ds.svg', title: 'kol-chess' }

export default function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  /* every hook before the embed branch — the flag is latched per document, but
     the hook order is not allowed to depend on it */
  const embedded = useEmbed()

  /* ?embed=1 — main content only, for iframing chess pages into the
     website's workshop. Chrome is dropped by absence, not by hiding. */
  if (embedded) return <Outlet />

  return (
    <AppShell
      items={NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      logomark={LOGOMARK}
      currentPath={pathname}
      onNavigate={navigate}
      settingsPath="/settings"
      settingsKey=","
      touch="drawer"
      navKeys
    >
      <Outlet />
    </AppShell>
  )
}
