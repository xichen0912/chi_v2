import { useSyncExternalStore } from 'react'
import { defaultPlannedSessionIds, defaultSavedContentIds } from '../data/mine'

/**
 * One localStorage-backed store shared by every page of the site (Program, Map, People, Awards, My).
 * The static pages use the same keys through shared/shell.js, so a change on one page shows up everywhere.
 */
export const KEYS = {
  plan: 'chi-plan',
  papers: 'chi-saved-papers',
  interests: 'chi-user-interests',
} as const

export const DEFAULT_INTERESTS = { primary: 'Human-AI Interaction', explore: ['Accessibility', 'Design Tools', 'Critical Design'] }

const cache = new Map<string, { raw: string | null; value: unknown }>()

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null
  try { raw = window.localStorage.getItem(key) } catch { /* storage unavailable */ }
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = fallback
  if (raw !== null) {
    try { value = JSON.parse(raw) as T } catch { value = fallback }
  }
  cache.set(key, { raw, value })
  return value
}

function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent('chi-store', { detail: { key } }))
}

function subscribe(callback: () => void) {
  window.addEventListener('chi-store', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('chi-store', callback)
    window.removeEventListener('storage', callback)
  }
}

export const getPlan = () => read<string[]>(KEYS.plan, defaultPlannedSessionIds)
export const getSavedPapers = () => read<string[]>(KEYS.papers, defaultSavedContentIds)

export function getInterests(): string[] {
  const stored = read<{ primary?: string; explore?: string[] } | null>(KEYS.interests, null)
  const value = stored && stored.primary ? stored : DEFAULT_INTERESTS
  return [value.primary!, ...(value.explore ?? [])].map(normalizeInterest).filter((item, index, list) => item && list.indexOf(item) === index)
}

export function setInterests(list: string[]) {
  const [primary, ...explore] = list
  write(KEYS.interests, primary ? { primary, explore } : DEFAULT_INTERESTS)
}

export const normalizeInterest = (value: string) => value.replace(/–/g, '-').trim()

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id])
export const togglePlan = (id: string) => write(KEYS.plan, toggleIn(getPlan(), id))
export const toggleSavedPaper = (id: string) => write(KEYS.papers, toggleIn(getSavedPapers(), id))

export const usePlan = () => useSyncExternalStore(subscribe, getPlan)
export const useSavedPapers = () => useSyncExternalStore(subscribe, getSavedPapers)

let interestsCache: { key: string; value: string[] } | null = null
function getInterestsStable() {
  const value = getInterests()
  const key = value.join('|')
  if (!interestsCache || interestsCache.key !== key) interestsCache = { key, value }
  return interestsCache.value
}
export const useInterests = () => useSyncExternalStore(subscribe, getInterestsStable)
