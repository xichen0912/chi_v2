import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { Interest } from '../data/interests'
import { rooms } from '../data/rooms'
import { roomLabel, venueRooms } from '../data/venue'
import { getPlan, usePlan } from '../lib/store'
import { sessions } from '../data/sessions'
import { getPeople } from '../lib/people'
import type { Route } from '../lib/route'
import { buildChatKnowledge } from '../lib/chatKnowledge'

type ReferenceKind = 'session' | 'room' | 'person' | 'program' | 'my'

interface ChatReference {
  kind: ReferenceKind
  id: string
  title: string
  note: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  references?: ChatReference[]
}

interface ApiReply {
  answer: string
  references?: Array<{ kind: ReferenceKind; id: string; title?: string; note?: string }>
  mode?: 'live' | 'demo'
  model?: string
}

const suggestions = [
  'What is on Monday at 9 AM?',
  'I care about accessibility. What should I see?',
  'Where can I find a quiet, step-free room?',
  'Which papers is Mina Patel on?',
]

const people = getPeople(sessions)
// The AI route exists only when a server provides it (npm run dev, or a build with VITE_CHAT_API set).
// Static hosting such as GitHub Pages goes straight to Demo mode instead of probing a missing endpoint.
const API_URL: string = import.meta.env.VITE_CHAT_API ?? (import.meta.env.DEV ? '/api/chat' : '')
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function referenceRoute(reference: ChatReference): Route | null {
  if (reference.kind === 'session') return { view: 'session', id: reference.id }
  if (reference.kind === 'room') return { view: 'map', room: reference.id }
  if (reference.kind === 'person') return { view: 'people', person: reference.id }
  if (reference.kind === 'program') return { view: 'program' }
  if (reference.kind === 'my') return { view: 'my' }
  return null
}

function resolveReferences(items: ApiReply['references']): ChatReference[] {
  if (!items) return []
  const resolved: ChatReference[] = []
  for (const item of items) {
    if (item.kind === 'session') {
      const session = sessions.find((entry) => entry.id === item.id)
      if (session) resolved.push({ kind: item.kind, id: session.id, title: session.title, note: `${session.startTime} · ${roomLabel(session.room)}` })
    }
    if (item.kind === 'room' && item.id in venueRooms) {
      resolved.push({ kind: item.kind, id: item.id, title: roomLabel(item.id), note: 'Open in Map' })
    }
    if (item.kind === 'person' && people.includes(item.id)) {
      resolved.push({ kind: item.kind, id: item.id, title: item.id, note: 'Open in People' })
    }
    if (item.kind === 'program') resolved.push({ kind: item.kind, id: 'program', title: 'Program', note: 'Browse all sessions' })
    if (item.kind === 'my') resolved.push({ kind: item.kind, id: 'my', title: 'My', note: 'Open your plan and saved papers' })
  }
  return resolved.slice(0, 4)
}

function localAnswer(question: string): ApiReply {
  const query = question.toLowerCase()
  const tokens = query.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((token) => token.length > 1)

  if ((/周一|monday/.test(query)) && /\b9\b|9(?::00)?\s*(点|am)/.test(query)) {
    const matches = sessions.filter((session) => session.date === '2027-05-10' && session.startTime === '9:00 AM')
    const planned = matches.find((session) => getPlan().includes(session.id))
    return {
      answer: `There are ${matches.length} sessions on Monday at 9:00 AM: ${matches.map((session) => `${session.title} (${roomLabel(session.room)})`).join('; ')}.${planned ? ` ${planned.title} is already in My plan, so the other one overlaps it.` : ''}`,
      references: matches.map((session) => ({ kind: 'session' as const, id: session.id })),
      mode: 'demo',
    }
  }

  const ranked = sessions
    .map((session) => {
      const haystack = [
        session.title,
        session.description,
        session.room,
        session.date,
        ...session.keywords,
        ...session.contents.flatMap((content) => [content.title, ...content.authors, ...content.keywords]),
      ].join(' ').toLowerCase()
      return { session, score: tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0) }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  if (/安静|quiet|sensory|无障碍|step.?free|accessible/.test(query)) {
    const matchingRooms = Object.entries(rooms)
      .filter(([, room]) => room.sensoryFriendly && room.stepFree)
      .slice(0, 4)
    return {
      answer: `For a quiet break, use Quiet Room M219 on Level M2. Session rooms marked sensory-friendly and step-free: ${matchingRooms.map(([name]) => roomLabel(name)).join(', ')}. Open one on the Map for the route.`,
      references: [{ kind: 'room' as const, id: 'M2 - Room M219' }, ...matchingRooms.slice(0, 3).map(([id]) => ({ kind: 'room' as const, id }))],
      mode: 'demo',
    }
  }

  const top = ranked.slice(0, 3)
  if (top.length) {
    return {
      answer: `I found ${ranked.length} related sessions. The closest matches are ${top.map(({ session }) => session.title).join(', ')}. Open a source below for times, rooms and papers.`,
      references: top.map(({ session }) => ({ kind: 'session' as const, id: session.id })),
      mode: 'demo',
    }
  }

  return {
    answer: 'I could not find that in this prototype’s data. Try asking about a session, an author, a room, a time or something you saved.',
    references: [{ kind: 'program', id: 'program' }],
    mode: 'demo',
  }
}

function AssistantMark() {
  return (
    <span className="assistant-mark" aria-hidden="true">
      <i /><i /><i />
    </span>
  )
}

const OPEN_KEY = 'askchi-open'
const LOG_KEY = 'askchi-messages-v2'
const welcome: Message = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi, I’m Ask CHI. Ask me about sessions, papers, authors, times and rooms on this site, or ask me to compare options using your interests and saved items.',
}
function loadMessages(): Message[] {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(LOG_KEY) ?? 'null')
    if (Array.isArray(stored) && stored.length) return stored
  } catch { /* ignore */ }
  return [welcome]
}
function loadOpen(openFirst: boolean): boolean {
  try {
    const stored = window.sessionStorage.getItem(OPEN_KEY)
    // Program opens it on the first page of a visit; after that, remember what the visitor chose.
    return stored === null ? openFirst && window.innerWidth >= 1100 : stored === '1'
  } catch { return false }
}

export function Chatbot({ interests, onGo, openFirst = false }: { interests: Interest[]; onGo: (route: Route) => void; openFirst?: boolean }) {
  const plannedSessionIds = usePlan()
  const [open, setOpenState] = useState(() => loadOpen(openFirst))
  const setOpen = (value: boolean | ((current: boolean) => boolean)) => {
    setOpenState((current) => {
      const next = typeof value === 'function' ? value(current) : value
      try { window.sessionStorage.setItem(OPEN_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [apiState, setApiState] = useState<'checking' | 'live' | 'demo'>('checking')
  const [model, setModel] = useState('')
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  useEffect(() => {
    try { window.sessionStorage.setItem(LOG_KEY, JSON.stringify(messages.slice(-30))) } catch { /* ignore */ }
  }, [messages])
  const endRef = useRef<HTMLDivElement>(null)
  const knowledge = useMemo(() => buildChatKnowledge(interests), [interests, plannedSessionIds])

  useEffect(() => {
    if (!API_URL) { setApiState('demo'); return }
    fetch(API_URL)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((status: { configured?: boolean; model?: string }) => {
        setApiState(status.configured ? 'live' : 'demo')
        setModel(status.model ?? '')
      })
      .catch(() => setApiState('demo'))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: pending ? 'smooth' : 'auto' })
  }, [messages, pending])

  async function ask(rawQuestion: string) {
    const question = rawQuestion.trim()
    if (!question || pending) return
    const userMessage: Message = { id: uid(), role: 'user', text: question }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setPending(true)

    try {
      if (!API_URL) throw new Error('No AI endpoint on this host')
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-8).map(({ role, text }) => ({ role, text })),
          knowledge,
        }),
      })
      if (!response.ok) throw new Error('AI endpoint unavailable')
      const reply = await response.json() as ApiReply
      setApiState(reply.mode === 'live' ? 'live' : 'demo')
      setModel(reply.model ?? model)
      setMessages((current) => [...current, {
        id: uid(),
        role: 'assistant',
        text: reply.answer,
        references: resolveReferences(reply.references),
      }])
    } catch {
      const reply = localAnswer(question)
      setApiState('demo')
      setMessages((current) => [...current, {
        id: uid(),
        role: 'assistant',
        text: reply.answer,
        references: resolveReferences(reply.references),
      }])
    } finally {
      setPending(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void ask(input)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void ask(input)
    }
  }

  const followReference = (reference: ChatReference) => {
    const route = referenceRoute(reference)
    if (route) onGo(route)
    if (window.innerWidth < 720) setOpen(false)
  }

  return (
    <>
      <button type="button" className={`chat-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="ask-chi-panel">
        <AssistantMark />
        <span>{open ? 'Close' : 'Ask CHI'}</span>
      </button>

      <aside id="ask-chi-panel" className={`chat-panel ${open ? 'is-open' : ''}`} aria-label="Ask CHI chatbot" aria-hidden={!open} inert={!open}>
        <header className="chat-header">
          <div>
            <span className="chat-kicker">Program assistant</span>
            <h2><AssistantMark /> Ask CHI</h2>
          </div>
          <div className={`api-status is-${apiState}`} title={model || undefined}>
            <span /> {apiState === 'checking' ? 'Checking API' : apiState === 'live' ? 'Live AI' : 'Demo mode'}
          </div>
          <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close Ask CHI">×</button>
        </header>

        <div className="chat-context" aria-label="Assistant scope">
          <span><b>{sessions.length}</b> sessions</span>
          <span><b>{sessions.reduce((count, session) => count + session.contents.length, 0)}</b> papers</span>
          <span><b>{new Set(sessions.map((session) => session.room)).size}</b> rooms</span>
          <span><b>{plannedSessionIds.length}</b> planned</span>
        </div>

        <div className="chat-log" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={`chat-message is-${message.role}`}>
              <span className="message-role">{message.role === 'assistant' ? 'Ask CHI' : 'You'}</span>
              <p>{message.text}</p>
              {!!message.references?.length && (
                <div className="chat-references" aria-label="Sources in this site">
                  {message.references.map((reference) => (
                    <button type="button" key={`${reference.kind}-${reference.id}`} className={`reference-card is-${reference.kind}`} onClick={() => followReference(reference)}>
                      <span className="reference-type">{reference.kind}</span>
                      <strong>{reference.title}</strong>
                      <small>{reference.note}</small>
                      <span className="reference-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
          {pending && (
            <article className="chat-message is-assistant is-pending">
              <span className="message-role">Ask CHI</span>
              <div className="typing-dots" aria-label="Ask CHI is thinking"><i /><i /><i /></div>
            </article>
          )}
          <div ref={endRef} />
        </div>

        {messages.length === 1 && (
          <div className="chat-suggestions" aria-label="Suggested questions">
            {suggestions.map((suggestion, index) => (
              <button type="button" key={suggestion} onClick={() => void ask(suggestion)}>
                <span>{String(index + 1).padStart(2, '0')}</span>{suggestion}
              </button>
            ))}
          </div>
        )}

        <form className="chat-composer" onSubmit={submit}>
          <label htmlFor="ask-chi-input">Ask about this CHI website</label>
          <div>
            <textarea id="ask-chi-input" rows={2} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Try: What should I attend after lunch?" disabled={pending} />
            <button type="submit" disabled={!input.trim() || pending} aria-label="Send question">↑</button>
          </div>
          <small>Answers are grounded in this prototype’s fictional site data. AI can make mistakes.</small>
        </form>
      </aside>
    </>
  )
}

