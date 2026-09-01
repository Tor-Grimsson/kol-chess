// IMPORTANT: Import ONLY from lightweight file to avoid bundling 19MB index.js
// The lightweight.js file contains only manifest, monthlySummary, and sampleGames (~136KB)
// The heavy gameMeta (27,200 games) is now on CDN and fetched on demand
import { manifest, monthlySummary, sampleGames } from './lightweight.js'

// CDN base URL for chess data
const CDN_BASE = 'https://b2.kolkrabbi.io/website/data-library/chess-data'

// Lightweight exports (always safe to import)
export const getManifest = () => manifest
export const getMonthlySummary = () => monthlySummary
export const getSampleGames = () => sampleGames

// Cache for loaded gameMeta to avoid re-fetching
let gameMetaCache = null

// Heavy exports - DEPRECATED (use async versions instead)
// These load ALL 27,200 games into memory - avoid in new code!
// IMPORTANT: This function is intentionally broken to prevent accidental use
// If you need game data, use loadMonthGames() instead
export const getGameMeta = () => {
  throw new Error('[chess-data] getGameMeta() is deprecated and disabled. Use loadMonthGames(month) for progressive loading instead.')
}

// Fetch full dataset from CDN (cached)
const fetchFullDataset = async () => {
  if (gameMetaCache) return gameMetaCache
  try {
    const response = await fetch(`${CDN_BASE}/generated/index.js`)
    const text = await response.text()
    // Find where gameMeta array starts
    const startMarker = 'export const gameMeta = ['
    const startIdx = text.indexOf(startMarker)
    if (startIdx === -1) {
      console.warn('[chess-data] Could not find gameMeta in CDN response')
      return []
    }
    // Find where next export starts (sampleGames comes after gameMeta)
    const arrayStart = startIdx + startMarker.length - 1 // include the [
    const nextExport = text.indexOf('\nexport const', arrayStart)
    // Extract just the gameMeta array
    let jsonText
    if (nextExport !== -1) {
      // Slice up to next export, find the closing bracket
      jsonText = text.slice(arrayStart, nextExport).trim()
      // Remove trailing content after the array closes
      const lastBracket = jsonText.lastIndexOf(']')
      if (lastBracket !== -1) {
        jsonText = jsonText.slice(0, lastBracket + 1)
      }
    } else {
      jsonText = text.slice(arrayStart).trim().replace(/;?\s*$/, '')
    }
    gameMetaCache = JSON.parse(jsonText)
    return gameMetaCache
  } catch (err) {
    console.warn('[chess-data] Failed to fetch full dataset from CDN', err)
    return []
  }
}

// Fetch full dataset (opt-in, cached after first load)
export const loadFullDataset = () => fetchFullDataset()

// Async month-based loading (RECOMMENDED)
export const loadMonthGames = async (month) => {
  try {
    const gameMeta = await fetchFullDataset()
    return gameMeta.filter((game) => game.month === month)
  } catch (err) {
    console.warn(`[chess-data] Failed to load games for month: ${month}`, err)
    return []
  }
}

// Get random month from available months
export const getRandomMonth = () => {
  const months = monthlySummary.map(entry => entry.month).filter(Boolean)
  return months[Math.floor(Math.random() * months.length)]
}

// Find games by month (legacy - sync version) - DEPRECATED
export const findGamesByMonth = (month) => {
  console.warn('[chess-data] findGamesByMonth() is deprecated. Use loadMonthGames() instead.')
  const gameMeta = getGameMeta()
  return gameMeta.filter((game) => game.month === month)
}

// Find game by ID (legacy - sync version) - DEPRECATED
export const findGameById = (id) => {
  console.warn('[chess-data] findGameById() is deprecated. Use async version instead.')
  const gameMeta = getGameMeta()
  return gameMeta.find((game) => game.id === id)
}

// Async version - find game by ID
export const findGameByIdAsync = async (id) => {
  // Check sampleGames first (lightweight, already loaded)
  const sampleMatch = sampleGames.find((game) => game.id === id)
  if (sampleMatch) return sampleMatch

  // Load full gameMeta from CDN
  const gameMeta = await fetchFullDataset()
  return gameMeta.find((game) => game.id === id)
}

// Get month for a game ID - async version (RECOMMENDED)
export const getGameMonthByIdAsync = async (id) => {
  const game = await findGameByIdAsync(id)
  return game?.month ?? null
}

// DEPRECATED: Synchronous version - only works if gameMeta already loaded
export const getGameMonthById = (id) => {
  // Try sampleGames first
  const sampleMatch = sampleGames.find((game) => game.id === id)
  if (sampleMatch) return sampleMatch.month ?? null

  // If not in samples, we can't get it without loading all data
  console.warn('[chess-data] getGameMonthById() cannot find game without loading all data. Use getGameMonthByIdAsync() instead.')
  return null
}

// DEPRECATED: Synchronous version - use getGamePgnByIdAsync instead
export const getGamePgnById = (id) => {
  console.warn('[chess-data] getGamePgnById() is deprecated. Use getGamePgnByIdAsync() instead.')
  const sampleMatch = sampleGames.find((game) => game.id === id && Boolean(game?.pgn))
  if (sampleMatch) return sampleMatch.pgn
  // Can't get PGN without async loading
  return null
}

// Load PGN data for a specific month from CDN
export const loadMonthlyPgn = async (month) => {
  try {
    const response = await fetch(`${CDN_BASE}/pgn/by-month/${month}.json`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (err) {
    console.warn(`[chess-data] Failed to load PGN data for month: ${month}`, err)
    return null
  }
}

// Get PGN for a game by loading the monthly file (RECOMMENDED)
// If you already have the month, pass it to avoid fetching full dataset
export const getGamePgnByIdAsync = async (id, month = null) => {
  // First check sampleGames (fast, synchronous)
  const sampleMatch = sampleGames.find((game) => game.id === id && Boolean(game?.pgn))
  if (sampleMatch) return sampleMatch.pgn

  // Use provided month or look it up
  const gameMonth = month || await getGameMonthByIdAsync(id)
  if (!gameMonth) return null

  // Load the monthly PGN file
  const monthlyData = await loadMonthlyPgn(gameMonth)
  if (!monthlyData) return null

  // Return the PGN for this specific game
  return monthlyData[id] ?? null
}
