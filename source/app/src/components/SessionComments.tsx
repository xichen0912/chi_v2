import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Session } from '../types'

interface Comment { id: string; name: string; text: string; time: string }

const KEY = 'chi-session-comments'
const PULL = 180 // px of extra pull past the bottom that opens the comments

// A couple of fictional starters per session so the thread never opens empty.
const names = ['Lena Ortiz', 'Kenji Mori', 'Amara Okafor', 'Sofia Brandt', 'Ravi Menon', 'Hye-jin Park', 'Tomás Reyes', 'Ines Kowalski']
function seeded(session: Session, index: number): Comment[] {
  const paper = session.contents[index % session.contents.length]
  return [
    { id: `${session.id}-s1`, name: names[index % names.length], time: 'May 3', text: `Will the slides for “${paper.title}” be shared after the session?` },
    { id: `${session.id}-s2`, name: names[(index + 3) % names.length], time: 'May 6', text: `Coming with two students. Is there room to stand at the back of ${session.room.split(' - ').pop()} if it fills up?` },
  ]
}

function load(id: string): Comment[] {
  try { return (JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Record<string, Comment[]>)[id] ?? [] } catch { return [] }
}
function save(id: string, list: Comment[]) {
  try {
    const all = JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Record<string, Comment[]>
    window.localStorage.setItem(KEY, JSON.stringify({ ...all, [id]: list }))
  } catch { /* comments just won't persist */ }
}

const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4

/**
 * Comments wait below the page. Reaching the bottom shows a hint; pulling further (wheel or touch) opens them.
 * The hint is also a button, so keyboard and screen-reader users open it directly.
 */
export function SessionComments({ session, index }: { session: Session; index: number }) {
  const [open, setOpen] = useState(false)
  const [pull, setPull] = useState(0)
  const [reached, setReached] = useState(false)
  const [mine, setMine] = useState<Comment[]>(() => load(session.id))
  const [draft, setDraft] = useState('')
  const sentinel = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node || open) return
    const observer = new IntersectionObserver(([entry]) => setReached(entry.isIntersecting))
    observer.observe(node)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    if (open) return
    let amount = 0
    let idle = 0
    let touchY: number | null = null
    const bump = (delta: number) => {
      if (!atBottom()) { amount = 0; setPull(0); return }
      amount = Math.max(0, amount + delta)
      setPull(Math.min(1, amount / PULL))
      window.clearTimeout(idle)
      idle = window.setTimeout(() => { amount = 0; setPull(0) }, 700)
      if (amount >= PULL) setOpen(true)
    }
    const onWheel = (event: WheelEvent) => bump(event.deltaY)
    const onTouchStart = (event: TouchEvent) => { touchY = event.touches[0].clientY }
    const onTouchMove = (event: TouchEvent) => {
      if (touchY === null) return
      const y = event.touches[0].clientY
      bump((touchY - y) * 1.4)
      touchY = y
    }
    const onTouchEnd = () => { touchY = null }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.clearTimeout(idle)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [open])

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [open])

  const thread = [...seeded(session, index), ...mine]

  const post = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    const next = [...mine, { id: `${Date.now().toString(36)}`, name: 'You', text, time: 'Just now' }]
    setMine(next)
    save(session.id, next)
    setDraft('')
  }

  if (!open) {
    return (
      <div className="comments-pull shell" ref={sentinel}>
        <button
          type="button"
          className={`comments-hint ${reached ? 'is-reached' : ''}`}
          style={{ '--pull': pull } as CSSProperties}
          onClick={() => setOpen(true)}
          aria-label={`Open comments (${thread.length})`}
        >
          <span className="pull-arrow" aria-hidden="true">↑</span>
          <span>Keep pulling up to browse and comment</span>
          <small>{thread.length} comments</small>
          <i className="pull-bar" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <section className="comments shell" ref={section} aria-labelledby="comments-title">
      <h2 id="comments-title">Comments <span>{thread.length}</span></h2>
      <ol className="comment-list">
        {thread.map((comment) => (
          <li key={comment.id} className={comment.name === 'You' ? 'is-mine' : ''}>
            <span className="comment-avatar" aria-hidden="true">{comment.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
            <div>
              <p className="comment-head"><strong>{comment.name}</strong> <time>{comment.time}</time></p>
              <p>{comment.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <form className="comment-form" onSubmit={post}>
        <label htmlFor="comment-input" className="sr-only">Write a comment</label>
        <textarea ref={field} id="comment-input" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask the speakers or other attendees…" />
        <button type="submit" className="primary-button" disabled={!draft.trim()}>Post</button>
      </form>
    </section>
  )
}
