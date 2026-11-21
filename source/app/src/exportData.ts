/**
 * Exposes the site's shared data to the static pages as window.CHI (built to shared/data.js).
 * Program (React) imports the same modules directly, so there is one source for every page.
 */
import { conferenceDays, sessions } from './data/sessions'
import { rooms } from './data/rooms'
import { capacity, floors, roomLabel, roomTitle, venueRooms } from './data/venue'
import { availableInterests } from './data/interests'
import { defaultPlannedSessionIds, defaultSavedContentIds } from './data/mine'
import { getRoomNotes } from './lib/access'
import { DEFAULT_INTERESTS, KEYS } from './lib/store'
import { NOW } from './data/now'

declare global { interface Window { CHI: unknown } }

window.CHI = {
  conference: { name: 'CHI 2027', city: 'Pittsburgh', dates: 'May 10–14, 2027', timeZone: 'Pittsburgh (UTC −04:00)' },
  // The prototype is set during the conference; Map and My use this as "now".
  now: NOW,
  conferenceDays,
  sessions,
  rooms,
  floors,
  venueRooms,
  capacity,
  roomLabel,
  roomTitle,
  getRoomNotes,
  availableInterests,
  defaults: { plan: defaultPlannedSessionIds, papers: defaultSavedContentIds, interests: DEFAULT_INTERESTS },
  keys: KEYS,
}
