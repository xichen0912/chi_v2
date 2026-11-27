import { useState, type CSSProperties } from 'react'
import type { Interest } from '../data/interests'
import { conferenceDays, sessions, sessionsByDate } from '../data/sessions'
import { minutes, overlapsPlan } from '../lib/access'
import { getForYouFeed, type ForYouEntry } from '../lib/relevance'
import type { Route } from '../lib/route'
import type { Session } from '../types'
import { DateNavigation } from './DateNavigation'
import { NoteIcon, RoomNotes } from './RoomNotes'
import { RoomMap } from './RoomMap'
import { usePlan, useSavedPapers } from '../lib/store'
import { sessionImage } from '../data/images'
import { roomLabel } from '../data/venue'
import { NOW, sessionStatus, statusLabel } from '../data/now'

interface Props {
  interests: Interest[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onOpenInterests: () => void
  onGo: (route: Route) => void
}

type Variant = 'planned' | 'conflict' | 'suggest'

const isReason = (entry: ForYouEntry) => entry.key.startsWith('saved') || entry.key.startsWith('match')

function SlotCard({ session, variant, onGo }: { session: Session; variant: Variant; interests: Interest[]; onGo: (route: Route) => void }) {
  const image = sessionImage(session.id)
  const status = sessionStatus(session)
  return (
    <article className={`slot-card is-${variant} ${image ? 'has-cover' : ''}`} style={image ? ({ '--cover': `url("${image}")` } as CSSProperties) : undefined}>
      {(status === 'live' || status === 'next') && <span className={`status-badge ${status}`}>{statusLabel[status]}</span>}
      <h3>
        <button type="button" className="slot-open" onClick={() => onGo({ view: 'session', id: session.id })}>{session.title}</button>
      </h3>
      <div className="slot-meta">
        {variant !== 'suggest' && (
          <span className={`slot-state ${variant === 'conflict' ? 'is-conflict' : ''}`} title={variant === 'conflict' ? 'Overlaps your plan' : 'In your plan'}>
            <NoteIcon kind={variant === 'conflict' ? 'conflict' : 'planned'} size={18} />
          </span>
        )}
        <button type="button" className="room-link" onClick={() => onGo({ view: 'map', room: session.room })}>
          <RoomMap room={session.room} />{roomLabel(session.room)}
        </button>
        <RoomNotes room={session.room} />
      </div>
    </article>
  )
}

// The day as a timeline: each slot is one decision. Planned sessions anchor it, clashes are flagged,
// free slots are filled with sessions that have a reason to matter to you.
export function StartPage({ interests, selectedDate, onSelectDate, onOpenInterests, onGo }: Props) {
  const plannedSessionIds = usePlan()
  const savedContentIds = useSavedPapers()
  const day = [...sessionsByDate(selectedDate)].sort((a, b) => minutes(a.startTime) - minutes(b.startTime))
  const slots = [...new Set(day.map((session) => session.startTime))].map((start) => {
    const inSlot = day.filter((session) => session.startTime === start)
    const score = (session: Session) => getForYouFeed(session, interests, sessions, savedContentIds).filter(isReason).length
    const planned = inSlot.find((session) => plannedSessionIds.includes(session.id))
    const others = inSlot.filter((session) => session !== planned && score(session) > 0).sort((a, b) => score(b) - score(a))
    return { start, end: inSlot[0].endTime, planned, others }
  })
  // On the demo day, "next" skips planned sessions that have already ended.
  const next = slots.find((slot) => slot.planned && sessionStatus(slot.planned) !== 'ended')?.planned
  const selectedDay = conferenceDays.find((item) => item.id === selectedDate)
  const longDate = selectedDay?.longDate
  const isToday = selectedDate === NOW.date
  // Ended slots on today's timeline fold into one row.
  const isPast = (start: string) => isToday && sessionStatus(day.find((session) => session.startTime === start)!) === 'ended'
  const pastSlots = slots.filter((slot) => isPast(slot.start))
  const [showPast, setShowPast] = useState(false)

  const [clock, meridiem] = next ? next.startTime.split(' ') : ['', '']
  // The rest of today's plan after the hero session: time + title only, at most three.
  const following = next ? slots.filter((slot) => slot.planned && minutes(slot.start) > minutes(next.startTime)).map((slot) => slot.planned!) : []

  return (
    <main className="start-page">
      <header className="page-intro shell">
        <h1>Today</h1>
      </header>

      <div className="start-plan shell">
        {next ? (
          <section className="next-up has-cover" key={`${selectedDate}-${next.id}`} aria-label="Next session" style={{ '--cover': `url("${sessionImage(next.id, 2000)}")` } as CSSProperties}>
            <div className="next-main">
              <span className="next-kicker">{selectedDate === NOW.date ? `Now ${NOW.time} · ${sessionStatus(next) === 'live' ? 'In progress' : 'Next in your plan'}` : 'First in your plan'}</span>
              <span className="next-clock">{clock}<small>{meridiem}</small></span>
              <h1>
                <button type="button" className="slot-open" onClick={() => onGo({ view: 'session', id: next.id })}>{next.title}</button>
              </h1>
              <RoomNotes room={next.room} />
            </div>
            <div className="next-side">
              <button type="button" className="next-map" onClick={() => onGo({ view: 'map', room: next.room })}>
                <RoomMap room={next.room} />
                <span>{roomLabel(next.room)}</span>
              </button>
              {following.length > 0 && (
                <ol className="next-following" aria-label="Then in your plan">
                  {following.slice(0, 3).map((session) => (
                    <li key={session.id}>
                      <button type="button" title={session.title} onClick={() => onGo({ view: 'session', id: session.id })}>
                        <time>{session.startTime.replace(' ', '\u00a0')}</time>
                        <span>{session.title}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <button type="button" className="next-my" onClick={() => onGo({ view: 'my' })}>
                My plan · {plannedSessionIds.length} <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="next-up is-empty" key={`${selectedDate}-empty`} aria-label="Your plan">
            <span className="next-kicker">Your plan</span>
            <h1>{isToday ? 'No plans today' : `No plans on ${selectedDay?.dayName}`}</h1>
            <button type="button" className="next-my" onClick={() => onGo({ view: 'my' })}>
              Open My plan <span aria-hidden="true">→</span>
            </button>
          </section>
        )}
      </div>

      <div className="date-nav-wrap date-row shell">
        <DateNavigation days={conferenceDays} selectedDate={selectedDate} onSelect={onSelectDate} />
        <button type="button" className="interest-button" onClick={onOpenInterests}>
          <span aria-hidden="true">◎</span> Interests <span className="interest-count">{interests.length}</span>
        </button>
      </div>

      <div className="start-body shell">
        <h2 className="sr-only">{longDate}</h2>

        <ol className="timeline" key={selectedDate}>
          {pastSlots.length > 0 && (
            <li className="timeline-fold">
              <span className="slot-time" />
              <span className="slot-node is-gap" aria-hidden="true" />
              <button type="button" aria-expanded={showPast} onClick={() => setShowPast((value) => !value)}>
                {showPast ? 'Hide earlier' : `Earlier today · ${pastSlots[0].start}–${pastSlots[pastSlots.length - 1].end}`} <span aria-hidden="true">{showPast ? '↑' : '↓'}</span>
              </button>
            </li>
          )}
          {slots.filter((slot) => showPast || !isPast(slot.start)).map((slot, index) => {
            const tone = slot.planned ? 'planned' : slot.others.length > 0 ? 'suggest' : 'gap'
            const clash = !!slot.planned && slot.others.some((session) => overlapsPlan(session, sessions, plannedSessionIds))
            return (
              <li key={slot.start} className={`timeline-slot ${isPast(slot.start) ? 'is-past' : ''}`} style={{ '--i': index } as CSSProperties}>
                <span className="slot-time">{slot.start}<small>{slot.end}</small></span>
                <span className={`slot-node is-${tone} ${clash ? 'has-clash' : ''}`} aria-hidden="true" />
                <div className="slot-cards">
                  {slot.planned && <SlotCard session={slot.planned} variant="planned" interests={interests} onGo={onGo} />}
                  {slot.others.slice(0, slot.planned ? 1 : 2).map((session) => (
                    <SlotCard
                      key={session.id}
                      session={session}
                      variant={overlapsPlan(session, sessions, plannedSessionIds) ? 'conflict' : 'suggest'}
                      interests={interests}
                      onGo={onGo}
                    />
                  ))}
                  {!slot.planned && slot.others.length === 0 && <span className="slot-gap" aria-hidden="true" />}
                </div>
              </li>
            )
          })}
        </ol>

        <button type="button" className="all-sessions" onClick={() => onGo({ view: 'program' })}>
          Program <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  )
}
