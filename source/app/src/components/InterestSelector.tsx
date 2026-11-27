import { useEffect, useRef, useState } from 'react'
import { availableInterests, type Interest } from '../data/interests'
import { searchInterests } from '../lib/interestSearch'
import { normalizeInterest } from '../lib/store'

interface Props {
  selected: Interest[]
  onChange: (interests: Interest[]) => void
  onClose: () => void
}

export function InterestSelector({ selected, onChange, onClose }: Props) {
  const searchInput = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    searchInput.current?.focus()
    const handleKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const toggle = (interest: Interest) => {
    onChange(selected.includes(interest)
      ? selected.filter((item) => item !== interest)
      : [...selected, interest])
  }

  // The same list as People's interest editor, plus any directions added there.
  const all = [...availableInterests, ...selected.filter((item) => !availableInterests.includes(item))]
  const typed = query.trim()
  const hits = typed ? searchInterests(typed, selected) : all.map((interest) => ({ interest, via: undefined as string | undefined }))
  const own = normalizeInterest(typed)
  const canAdd = own.length > 1 && !all.some((item) => item.toLowerCase() === own.toLowerCase())

  const addOwn = () => {
    if (!canAdd) return
    onChange([...selected, own])
    setQuery('')
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="interest-dialog" role="dialog" aria-modal="true" aria-labelledby="interest-title">
        <div className="dialog-header">
          <h2 id="interest-title">Interests</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close interest setup">×</button>
        </div>
        <div className="interest-search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              if (hits[0] && !selected.includes(hits[0].interest)) toggle(hits[0].interest)
              else addOwn()
            }}
            placeholder="Describe it loosely: robots, elderly care, kids…"
            aria-label="Search interests"
            aria-controls="interest-options"
          />
        </div>
        <fieldset className="interest-grid" id="interest-options">
          <legend className="sr-only">Research interests</legend>
          {hits.map(({ interest, via }) => (
            <label key={interest} className={selected.includes(interest) ? 'is-selected' : ''}>
              <input type="checkbox" checked={selected.includes(interest)} onChange={() => toggle(interest)} />
              <span>
                {interest}{selected[0] === interest && <small className="interest-primary"> · Starting point</small>}
                {via && <small className="interest-via">via “{via}”</small>}
              </span>
            </label>
          ))}
          {canAdd && (
            <button type="button" className="interest-add" onClick={addOwn}>
              + Add “{own}”
            </button>
          )}
        </fieldset>
        {typed && !hits.length && <p className="interest-note" role="status">Nothing close yet. Add it as your own, or try a broader word.</p>}
        <p className="interest-note">Shared with People and Recommendations. The first one you pick is your starting point.</p>
        <div className="dialog-footer">
          <button type="button" className="primary-button" onClick={onClose}>Done</button>
        </div>
      </section>
    </div>
  )
}
