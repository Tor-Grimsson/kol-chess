import { useLocation } from 'react-router-dom'

/**
 * useEmbed — the ONE embed flag, same contract as kol-ds-ui's showcase and
 * kol-website's brand app. `?embed=1` renders the page's MAIN CONTENT ONLY:
 * no nav bar. For iframing chess pages into other repos (the website's
 * /workshop/chess/* pages).
 *
 * LATCHED per document: once a document boots embedded it stays embedded, so
 * in-frame navigation can't pop the chrome back mid-session. A fresh document
 * without the flag is un-embedded again — module scope, not storage.
 */

let latched = false

export default function useEmbed() {
  const { search } = useLocation()
  if (!latched) {
    const raw = new URLSearchParams(search).get('embed')
    latched = raw !== null && raw !== '0' && raw !== 'false'
  }
  return latched
}
