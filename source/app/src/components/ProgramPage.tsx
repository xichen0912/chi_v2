import { useEffect, useMemo, useState } from 'react'
import type { Interest } from '../data/interests'
import { conferenceDays, sessions, sessionsByDate } from '../data/sessions'
import { NOW } from '../data/now'
import { NowStrip } from './NowStrip'
import { getSessionsByTopic } from '../lib/relevance'
import { searchProgram } from '../lib/search'
import type { Route } from '../lib/route'
import { DateNavigation } from './DateNavigation'
import { SessionGallery } from './SessionGallery'

interface Props {
  selectedDate: string
  onSelectDate: (date: string) => void
  interests: Interest[]
  onOpenInterests: () => void
  onGo: (route: Route) => void
  topic: string | null
  onTopic: (keyword: string) => void
}

const QUERY_KEY = 'chi-program-query'
const readQuery = () => { try { return window.sessionStorage.getItem(QUERY_KEY) ?? '' } catch { return '' } }

export function ProgramPage(props: Props) {
  const currentDay = conferenceDays.find((day) => day.id === props.selectedDate)!
  const daySessions = sessionsByDate(props.selectedDate)
  const markedDates = props.topic ? [...new Set(getSessionsByTopic(sessions, props.topic).map((session) => session.date))] : []
  // The query is kept for the visit, so Back from a session returns to the same results.
  const [query, setQuery] = useState(readQuery)
  useEffect(() => { try { window.sessionStorage.setItem(QUERY_KEY, query) } catch { /* ignore */ } }, [query])
  const hits = useMemo(() => (query.trim().length >= 2 ? searchProgram(query.trim()) : null), [query])

  const isToday = props.selectedDate === NOW.date

  return (
    <main className="program-page">
      <section className="program-intro shell">
        <h1>Program</h1>
        <form className="program-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="program-search-input" className="sr-only">Search the program</label>
          <span aria-hidden="true">⌕</span>
          <input
            id="program-search-input"
            type="search"
            value={query}
            placeholder="Search sessions, papers, authors, rooms or topics"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setQuery('')}
          />
          {query && <button type="button" className="search-clear" onClick={() => setQuery('')}>Clear</button>}
        </form>
      </section>

      {hits ? (
        <section className="program-content shell search-results" aria-live="polite">
          <div className="gallery-heading">
            <h2>{hits.length ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'} for “${query.trim()}”` : `No results for “${query.trim()}”`}</h2>
            <span className="search-scope">All days</span>
          </div>
          {hits.length ? (
            <ul className="hit-list">
              {hits.map((hit, index) => (
                <li key={`${hit.kind}-${hit.title}-${index}`}>
                  <button type="button" onClick={() => props.onGo({ view: 'session', id: hit.session.id })}>
                    <span className={`hit-kind ${hit.kind}`}>{hit.kind === 'session' ? 'Session' : 'Paper'}</span>
                    <b>{hit.title}</b>
                    <span className="hit-meta">{hit.meta}</span>
                    <span className="hit-match">{hit.match}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="search-empty">Try a topic (“accessibility”), an author (“Noah Williams”), a room (“123”) or a word from a title.</p>
          )}
        </section>
      ) : (
        <>
          <div className="now-wrap shell">
            <NowStrip onGo={props.onGo} />
          </div>

          <div className="date-nav-wrap shell">
            <DateNavigation days={conferenceDays} selectedDate={props.selectedDate} onSelect={props.onSelectDate} markedDates={markedDates} />
          </div>

          <section className="program-content shell">
            <div className="gallery-heading">
              <h2>{currentDay.longDate}{isToday && <span className="today-tag">Today</span>}</h2>
              <div className="experiment-tools">
                <button type="button" className="interest-button" onClick={props.onOpenInterests}>
                  <span aria-hidden="true">◎</span> Interests <span className="interest-count">{props.interests.length}</span>
                </button>
              </div>
            </div>

            <SessionGallery sessions={daySessions} interests={props.interests} topic={props.topic} onTopic={props.onTopic} onGo={props.onGo} />
          </section>
        </>
      )}
    </main>
  )
}
