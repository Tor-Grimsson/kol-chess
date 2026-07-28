import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Tooltip, usePopover, PopoverPanel } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { ThemeToggle } from '@kolkrabbi/kol-framework'

/* The one nav system (quiet chrome): pawn = Home, icon-only surface links with
 * hover tooltips at md+, the same set folded into a hamburger popover below md.
 * Owns the board's height budget: bar h-12 (48) + page gutters (96) → 150. */

const NAV = [
  { to: '/analysis', icon: 'grid', label: 'Board' },
  { to: '/database', icon: 'terminal', label: 'Database' },
  { to: '/stats', icon: 'stat-chart-a', label: 'Statistics' },
]

/* Bar rung: one pick from the DS button ladder (sm 14 / md 16 / lg 18).
 * .kol-btn-nav (theme ≥0.11.4) = the navigation variant: square box, quiet
 * states; the active route lights via aria-current="page", which NavLink
 * stamps natively — no state classes needed. */
const BAR = { size: 'md', glyph: 16 }

const iconLink = `kol-btn kol-btn-nav kol-btn-${BAR.size} kol-btn-icon`

function MobileMenu() {
  const [open, setOpen] = useState(false)
  const popover = usePopover({ open, onOpenChange: setOpen, placement: 'bottom-end' })
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        className={iconLink}
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
      >
        <Icon name="hamburger" size={BAR.glyph} />
      </button>
      <PopoverPanel popover={popover}>
        <nav className="flex w-44 flex-col p-1">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-2 py-1.5 kol-mono-12 ${isActive ? 'text-emphasis' : 'text-fg-64'}`
              }
            >
              <Icon name={icon} size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
      </PopoverPanel>
    </div>
  )
}

export default function Shell() {
  return (
    <div className="[--chess-stage-reserve:150px]">
      <nav className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-fg-12 bg-surface-primary px-4 md:px-6">
        <div className="flex items-center gap-1">
          <Tooltip label="Home">
            <NavLink to="/" end className={iconLink} aria-label="Home">
              <Icon name="chess-pawn" size={BAR.glyph} />
            </NavLink>
          </Tooltip>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, icon, label }) => (
              <Tooltip key={to} label={label}>
                <NavLink to={to} className={iconLink} aria-label={label}>
                  <Icon name={icon} size={BAR.glyph} />
                </NavLink>
              </Tooltip>
            ))}
          </div>
          <MobileMenu />
        </div>
        <ThemeToggle variant="icon" />
      </nav>
      <Outlet />
    </div>
  )
}
