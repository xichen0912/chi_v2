import type { Session } from '../types'
import { minutes } from '../lib/access'

/**
 * Demo clock. The conference is in May 2027, so the prototype is set to a fixed moment during it.
 * Every page reads this one value: Program, Map, My and the sidebar (through shared/data.js).
 */
export const NOW = { date: '2027-05-10', time: '11:20', label: 'Mon, May 10 · 11:20' }
const nowMinutes = 11 * 60 + 20

export type SessionStatus = 'live' | 'next' | 'ended' | 'later' | 'other-day'

/** Where a session sits relative to the demo clock. "next" = starts within the next 3 hours today. */
export function sessionStatus(session: Session): SessionStatus {
  if (session.date < NOW.date) return 'ended'
  if (session.date > NOW.date) return 'other-day'
  const start = minutes(session.startTime)
  const end = minutes(session.endTime)
  if (end <= nowMinutes) return 'ended'
  if (start <= nowMinutes) return 'live'
  return start - nowMinutes <= 180 ? 'next' : 'later'
}

export const statusLabel: Record<SessionStatus, string> = {
  live: 'Happening now',
  next: 'Up next',
  ended: 'Ended',
  later: 'Later today',
  'other-day': '',
}
