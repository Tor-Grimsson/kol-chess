import { SectionText, TabsRow } from '@kolkrabbi/kol-component'

/* THE page opening — one anatomy for every page:
 *   title tier: SectionText, h1 by role (+ optional inline meta)
 *   the strip, only when there is something to put on it: tabs left,
 *   contextual action right, on the border the active underline lands on.
 * A page with neither tabs nor action ends at the title — no orphan rule. */
const PageHeader = ({ title, meta = null, tabs = null, tab, onTabChange, action = null }) => (
  <header className="mb-6">
    <div className="flex items-center gap-3">
      <SectionText headline={title} headlineAs="h1" headlineSize="heading-05" />
      {meta}
    </div>
    {(tabs || action) && (
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-fg-12">
        {tabs ? <TabsRow tabs={tabs} value={tab} onChange={onTabChange} /> : <span />}
        {action}
      </div>
    )}
  </header>
)

export default PageHeader
