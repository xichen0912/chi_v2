import type { CSSProperties } from 'react'
import type { Interest } from '../data/interests'
import { sessions } from '../data/sessions'
import { sessionImage } from '../data/images'
import { overlapsPlan } from '../lib/access'
import { togglePlan, usePlan } from '../lib/store'
import { roomLabel } from '../data/venue'
import { sessionStatus, statusLabel } from '../data/now'
import type { Route } from '../lib/route'
import type { Session } from '../types'
import { RoomMap } from './RoomMap'

interface Props {
  session: Session
  interests: Interest[]
  topicState: 'none' | 'match' | 'dim'
  activeTopic: string | null
  onTopic: (keyword: string) => void
  onGo: (route: Route) => void
}

// The card is the photo: title, time and room sit on it. Everything else lives on the session page.
export function SessionCard({ session, topicState, onGo }: Props) {
  const plan = usePlan()
  const planned = plan.includes(session.id)
  const conflict = overlapsPlan(session, sessions, plan)
  const status = sessionStatus(session)
  const image = sessionImage(session.id)

  return (
    <article className={`session-card topic-${topicState} ${conflict ? 'is-conflict' : planned ? 'is-planned' : ''} status-${status}`}>
      <div className="card-head">
        <span className="category">{session.category}</span>
        <button type="button" className={`card-plan ${planned ? 'is-planned' : ''}`} aria-pressed={planned} onClick={() => togglePlan(session.id)}>
          {planned ? '✓ In My plan' : '+ Add to My plan'}
        </button>
      </div>
      <div className="card-cover" style={image ? ({ '--cover': `url("${image}")` } as CSSProperties) : undefined}>
        {(status === 'live' || status === 'next' || status === 'ended') && <span className={`status-badge card-status ${status}`}>{statusLabel[status]}</span>}
        <h3>
          <button type="button" className="card-open" onClick={() => onGo({ view: 'session', id: session.id })}>{session.title}</button>
        </h3>
        <dl className="card-meta">
          <div><dt className="sr-only">Time</dt><dd>{session.startTime}–{session.endTime}</dd></div>
          <div>
            <dt className="sr-only">Room</dt>
            <dd>
              <button type="button" className="room-link" onClick={() => onGo({ view: 'map', room: session.room })}>
                <RoomMap room={session.room} />{roomLabel(session.room)}
              </button>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}
