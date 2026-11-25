import { useRef, useState } from 'react'
import { sessions } from '../data/sessions'
import { getOtherAppearances } from '../lib/people'
import type { ContentLink } from '../lib/relevance'
import type { Route } from '../lib/route'
import type { ConferenceContent } from '../types'
import { NoteIcon } from './RoomNotes'
import { toggleSavedPaper, useSavedPapers } from '../lib/store'

interface Props {
  content: ConferenceContent
  index: number
  sessionId: string
  activeKeyword: string | null
  onKeyword: (keyword: string) => void
  onGo: (route: Route) => void
  savedLink?: ContentLink
}

export function ContentItem({ content, index, sessionId, activeKeyword, onGo, savedLink }: Props) {
  const savedContentIds = useSavedPapers()
  const isSaved = savedContentIds.includes(content.id)
  const [expanded, setExpanded] = useState(false)
  const [author, setAuthor] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)
  const abstractId = `${content.id}-abstract`
  const related = activeKeyword !== null && content.keywords.some((keyword) => keyword.toLowerCase() === activeKeyword)
  const state = activeKeyword === null ? '' : related ? 'is-related' : 'is-collapsed'

  const works = author ? getOtherAppearances(sessions, author, sessionId) : []

  return (
    <article ref={ref} className={`content-item ${state}`}>
      <span className="content-number">
        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <time className="content-time">{content.startTime}<small>{content.endTime}</small></time>
        {isSaved && <span className="saved-mark" title="Saved" role="img" aria-label="Saved"><NoteIcon kind="saved" size={16} /></span>}
      </span>
      <div className="content-body">
        <h3>{content.title}</h3>
        <div className="collapsible">
          <p className="authors">
            {content.authors.map((name, i) => (
              <span key={name}>
                {i > 0 && ' · '}
                <button type="button" className={`author-link ${author === name ? 'is-active' : ''}`} aria-expanded={author === name} onClick={() => setAuthor(author === name ? null : name)}>{name}</button>
              </span>
            ))}
          </p>
          {author && (
            <div className="person-preview">
              <button type="button" className="person-open" onClick={() => onGo({ view: 'people', person: author })}>{author} <span aria-hidden="true">↗</span></button>
              {works.length > 0 && (
                <ul className="appearances">
                  {works.map((item) => (
                    <li key={`${item.sessionId}-${item.contentTitle}`}>
                      <button type="button" onClick={() => onGo({ view: 'session', id: item.sessionId })}>
                        <strong>{item.contentTitle}</strong>
                        <span>{item.sessionTitle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {savedLink && (
            <button type="button" className="saved-link" disabled={!savedLink.sessionId} onClick={() => savedLink.sessionId && onGo({ view: 'session', id: savedLink.sessionId })}>
              <NoteIcon kind="saved" size={14} />
              <span className="saved-title">{savedLink.title}</span>
              <span>{savedLink.shared.join(', ')}</span>
            </button>
          )}
          <div className="content-actions">
            <button type="button" className={`save-toggle ${isSaved ? 'is-saved' : ''}`} aria-pressed={isSaved} onClick={() => toggleSavedPaper(content.id)}>
              <NoteIcon kind="saved" size={14} /> {isSaved ? 'Saved' : 'Save paper'}
            </button>
            <a className="pdf-link" href={content.pdf} target="_blank" rel="noopener noreferrer" aria-label={`PDF: ${content.title} (opens in a new tab)`}>
              PDF <span aria-hidden="true">↗</span>
            </a>
            <button type="button" className="text-button" aria-expanded={expanded} aria-controls={abstractId} onClick={() => setExpanded((value) => !value)}>
              Abstract <span aria-hidden="true">{expanded ? '↑' : '↓'}</span>
            </button>
          </div>
          <div id={abstractId} className="abstract is-expanded" hidden={!expanded}>
            <p>{content.abstract}</p>
          </div>
        </div>
      </div>
    </article>
  )
}
