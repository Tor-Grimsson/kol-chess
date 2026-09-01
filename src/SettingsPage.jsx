import { SettingsScaffold, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import { LabeledControlSection, SettingsRow } from '@kolkrabbi/kol-component'

/* THE TOGGLE'S NEW HOME (2026-08-30). kol-framework's SideNav carried the
 * theme toggle; kol-shell's rail deliberately carries neither settings nor a
 * toggle (dropped upstream in 0.16.0), so the app owes it a page. This is
 * that page, and it is the DS's `SettingsScaffold` — `themeToggle` is a NODE
 * slot on its masthead cluster precisely because the toggle lives in
 * kol-framework and shell dropped that peer.
 *
 * Reached by the rail's bottom rung or `,` — both TOGGLE it (AppShell's
 * `settingsPath`), so it hands you back where you were rather than stranding
 * you here.
 */

const TABS = [
  {
    value: 'settings',
    label: 'Settings',
    title: 'Settings',
    subtitle: 'Appearance and shortcuts for this browser.',
  },
  {
    value: 'about',
    label: 'About',
    row: 'layout',
    title: 'About',
    subtitle: '27,200 chess.com games, analysed in the browser.',
  },
]

const LINKS = [
  { label: 'REPO', url: 'https://github.com/Tor-Grimsson/kol-chess' },
  { label: 'CHESS SET', url: 'https://ui.kolkrabbi.io/sets/chess-apparatus' },
  { label: 'WRITE-UP', url: 'https://kolkrabbi.io/stack/27200-chess-games' },
]

/* The rail's own keys, stated once and measured rather than assumed.
 * AppShell's `navKeys` counts the rail top-down with the LOGOMARK as row 1
 * (AppShellNavKeysHomeFirst), and our mark and first rung both point at '/' —
 * so ⌥1 and ⌥2 are the same destination. Said plainly instead of documenting
 * a tidier mapping than the one that runs. Settings is a `bottomItems` rung,
 * which `navKeys` does not count; `,` is its key. */
const SHORTCUTS = [
  ['⌥1 · ⌥2', 'Overview — the mark and the first rung both go home'],
  ['⌥3 — ⌥8', 'Board · Play · Database · Statistics · Insights · The bot, in rail order'],
  [',', 'Settings — press again to go back where you were'],
  ['Rail edge', 'Drag it open to reveal the nav labels'],
]

export default function SettingsPage() {
  return (
    <SettingsScaffold
      tabs={TABS}
      defaultTab="settings"
      header={{ voice: 'mono', size: 'sm' }}
      themeToggle={<ThemeToggle variant="button" fill="subtle" size="sm" label={false} />}
      renderContent={(tab) =>
        tab === 'about' ? (
          <LabeledControlSection label="ABOUT">
            <SettingsLinks links={LINKS} />
            <SettingsColophon className="mt-6" />
          </LabeledControlSection>
        ) : (
          <LabeledControlSection label="KEYBOARD">
            {/* `align="fill"`, not the default `end`: end is for a switch at
                the far right, and it strands a sentence 1000px from its label
                on a wide page. */}
            {SHORTCUTS.map(([keys, what]) => (
              <SettingsRow key={keys} label={keys} align="fill">
                {/* kol-mono, not kol-helper: these sentences wrap on a phone,
                    and helper is line-height-1 single-line chrome — the type
                    fault line. */}
                <span className="kol-mono-12 text-fg-64">{what}</span>
              </SettingsRow>
            ))}
          </LabeledControlSection>
        )
      }
    />
  )
}
