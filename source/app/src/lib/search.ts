import { conferenceDays, sessions } from '../data/sessions'
import { roomLabel } from '../data/venue'
import type { Session } from '../types'

export interface SearchHit {
  kind: 'session' | 'paper'
  session: Session
  title: string
  meta: string
  match: string
}

const dayLabel = (date: string) => { const day = conferenceDays.find((item) => item.id === date); return day ? `${day.dayName.slice(0, 3)}, ${day.shortDate}` : date }
const norm = (value: string) => value.toLowerCase().replace(/[–-]/g, ' ')

/** Searches every day of the Program: session titles, descriptions, keywords, rooms, paper titles and authors. */
export function searchProgram(query: string): SearchHit[] {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const hits: SearchHit[] = []
  const when = (session: Session) => `${dayLabel(session.date)} · ${session.startTime} · ${roomLabel(session.room)}`
  for (const session of sessions) {
    const fields = [session.title, session.category, session.description, roomLabel(session.room), ...session.keywords]
    const text = norm(fields.join(' '))
    if (words.every((word) => text.includes(word))) {
      const kw = session.keywords.find((keyword) => words.some((word) => norm(keyword).includes(word)))
      hits.push({ kind: 'session', session, title: session.title, meta: when(session), match: kw ? `Keyword: ${kw}` : session.category })
    }
    for (const paper of session.contents) {
      const paperText = norm([paper.title, ...paper.authors, ...paper.keywords].join(' '))
      if (words.every((word) => paperText.includes(word))) {
        const author = paper.authors.find((name) => words.some((word) => norm(name).includes(word)))
        hits.push({ kind: 'paper', session, title: paper.title, meta: `${when(session)} · in ${session.title}`, match: author ? `Author: ${author}` : paper.authors.join(', ') })
      }
    }
  }
  return hits
}
