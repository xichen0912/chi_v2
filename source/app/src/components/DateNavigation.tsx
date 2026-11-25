import type { CSSProperties } from 'react'
import type { ConferenceDay } from '../types'
import { NOW } from '../data/now'

interface Props {
  days: ConferenceDay[]
  selectedDate: string
  onSelect: (date: string) => void
  markedDates?: string[]
}

// A slim segmented slider: the dark thumb slides to the chosen day.
export function DateNavigation({ days, selectedDate, onSelect, markedDates = [] }: Props) {
  const index = Math.max(0, days.findIndex((day) => day.id === selectedDate))
  return (
    <nav className="date-nav" aria-label="Conference dates">
      <div className="date-slider" style={{ '--count': days.length, '--index': index } as CSSProperties}>
        <span className="date-thumb" aria-hidden="true" />
        {days.map((day) => (
          <button
            type="button"
            key={day.id}
            className={`date-tab ${selectedDate === day.id ? 'is-active' : ''}`}
            aria-current={selectedDate === day.id ? 'date' : undefined}
            onClick={() => onSelect(day.id)}
          >
            <span>{day.dayName.slice(0, 3)}</span>
            <strong>{day.shortDate}</strong>
            {day.id === NOW.date && <i className="today-dot" title="Today" aria-label="Today" />}
            {markedDates.includes(day.id) && <i className="date-dot" aria-label="Topic appears on this day" />}
          </button>
        ))}
      </div>
    </nav>
  )
}
