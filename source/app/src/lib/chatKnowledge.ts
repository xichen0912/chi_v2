import type { Interest } from '../data/interests'
import { getPlan, getSavedPapers } from './store'
import { roomLabel, venueRooms } from '../data/venue'
import { rooms } from '../data/rooms'
import { conferenceDays, sessions } from '../data/sessions'

/**
 * Public, fictional site data passed to the server-side AI proxy as grounding.
 * Keeping this builder close to the UI data means the assistant cannot drift
 * away from what the visitor can actually see on the prototype.
 */
export function buildChatKnowledge(interests: Interest[]) {
  const plannedSessionIds = getPlan()
  const savedContentIds = getSavedPapers()
  const plannedSessions = sessions.filter((session) => plannedSessionIds.includes(session.id))
  const savedPapers = sessions.flatMap((session) =>
    session.contents
      .filter((content) => savedContentIds.includes(content.id))
      .map((content) => ({ ...content, sessionId: session.id, sessionTitle: session.title })),
  )

  return JSON.stringify({
    site: {
      name: 'CHI 2027 prototype · Pittsburgh · May 10–14, 2027',
      note: 'All conference content in this prototype is fictional. Venue layout, accessibility FAQ and award list are adapted from CHI 2026.',
      sections: ['Program', 'Map', 'People', 'Recommendations', 'Awards', 'Accessibility', 'My'],
      quietRoom: 'M2 - Room M219 (Quiet Room, Level M2)',
    },
    dates: conferenceDays,
    sessions,
    rooms: Object.keys(venueRooms).map((id) => ({ id, label: roomLabel(id), floor: venueRooms[id].floor, info: rooms[id] ?? 'unknown', note: venueRooms[id].note })),
    visitor: {
      interests,
      plannedSessions,
      savedPapers,
    },
  })
}

