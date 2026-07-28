import { TabsRow } from '@kolkrabbi/kol-component'

/* THE page opening — one anatomy for every page:
 *   title tier (+ optional inline meta)
 *   the strip: tabs left, contextual action right, on the border the active
 *   underline lands on (the rail anatomy). Pages without tabs/action keep
 *   the rule alone so the rhythm never changes. */
const PageHeader = ({ title, meta = null, tabs = null, tab, onTabChange, action = null }) => (
  <header>
    <div className="mb-4 flex items-center gap-3">
      <h1 className="kol-sans-heading-05">{title}</h1>
      {meta}
    </div>
    {tabs || action ? (
      <div className="mb-6 flex items-center justify-between gap-2 border-b border-fg-12">
        {tabs ? <TabsRow tabs={tabs} value={tab} onChange={onTabChange} /> : <span />}
        {action}
      </div>
    ) : (
      <div className="mb-6 border-b border-fg-12" aria-hidden="true" />
    )}
  </header>
)

export default PageHeader
