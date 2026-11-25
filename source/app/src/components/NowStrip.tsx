import type { CSSProperties } from 'react'
import { sessions } from '../data/sessions'
import { NOW, sessionStatus } from '../data/now'
import { roomLabel } from '../data/venue'
import { sessionImage } from '../data/images'
import type { Route } from '../lib/route'

/** What is happening right now (demo clock), on the session's photo. Nothing shows between sessions. */
export function NowStrip({ onGo }: { onGo: (route: Route) => void }) {
  const live = sessions.filter((session) => sessionStatus(session) === 'live')
  if (!live.length) return null
  const time = NOW.label.split(' · ').pop()
  return (
    <div className="now-strip" aria-label="Happening now">
      {live.map((session) => {
        const image = sessionImage(session.id, 1600)
        return (
          <button
            type="button"
            key={session.id}
            className="now-live"
            style={image ? ({ '--cover': `url("${image}")` } as CSSProperties) : undefined}
            onClick={() => onGo({ view: 'session', id: session.id })}
          >
            <em><i aria-hidden="true" />Now · {time}</em>
            <strong>{session.title}</strong>
            <small>{roomLabel(session.room)} · until {session.endTime}</small>
          </button>
        )
      })}
    </div>
  )
}
