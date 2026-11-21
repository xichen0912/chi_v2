import { sessions } from '../data/sessions'
import { NOW, sessionStatus } from '../data/now'
import { roomLabel } from '../data/venue'
import type { Route } from '../lib/route'

/** "Right now" bar for the demo day: what is happening and what starts next. */
export function NowStrip({ onGo }: { onGo: (route: Route) => void }) {
  const live = sessions.filter((session) => sessionStatus(session) === 'live')
  const next = sessions.filter((session) => sessionStatus(session) === 'next')
  if (!live.length && !next.length) return null
  return (
    <div className="now-strip" aria-label="Right now">
      <span className="now-clock"><i aria-hidden="true" />Now · {NOW.label}</span>
      {live.map((session) => (
        <button type="button" key={session.id} onClick={() => onGo({ view: 'session', id: session.id })}>
          <em>Happening now</em> {session.title} <small>{roomLabel(session.room)} · until {session.endTime}</small>
        </button>
      ))}
      {next.slice(0, 2).map((session) => (
        <button type="button" key={session.id} onClick={() => onGo({ view: 'session', id: session.id })}>
          <em>Up next</em> {session.title} <small>{session.startTime} · {roomLabel(session.room)}</small>
        </button>
      ))}
    </div>
  )
}
