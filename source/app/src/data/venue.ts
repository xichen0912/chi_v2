/**
 * Venue geometry — the single source for the Map page and the mini floor plans in Program.
 * Layout adapted from the CHI 2026 venue for prototype testing.
 * Coordinates are in the Map's 360 × 270 plan space; the corridor runs at y = 136–164.
 */
export interface VenueRoom {
  name: string
  short: string
  floor: string
  x: number
  y: number
  w: number
  h: number
  quiet?: boolean
  busy?: boolean
  note?: string
}

export interface VenueFacility {
  type: 'lift' | 'wc' | 'seat'
  x: number
  label: string
}

export interface VenueFloor {
  id: string
  label: string
  desc: string
  separate?: boolean
  rooms: VenueRoom[]
  fac: VenueFacility[]
}

export const floors: VenueFloor[] = [
  { id: 'P2', label: 'P2', desc: 'Banquet hall · Large rooms', rooms: [], fac: [] },
  { id: 'M2', label: 'M2', desc: 'Small rooms · Quiet room · Prayer rooms', rooms: [], fac: [] },
  { id: 'P1', label: 'P1', desc: 'Paper sessions', rooms: [], fac: [] },
  { id: 'M1', label: 'M1', desc: 'VIP room', rooms: [], fac: [] },
  { id: 'P0', label: 'P0', desc: 'Entrance · Posters · Demos', rooms: [], fac: [] },
  { id: 'AUD', label: 'Auditorium', desc: 'Keynotes · Separate building', separate: true, rooms: [], fac: [] },
]

const byId = Object.fromEntries(floors.map((floor) => [floor.id, floor]))
const R = (floor: string, name: string, short: string, x: number, y: number, w: number, h: number, extra: Partial<VenueRoom> = {}) =>
  byId[floor].rooms.push({ name, short, floor, x, y, w, h, ...extra })
const FAC = (floor: string, type: VenueFacility['type'], x: number, label: string) => byId[floor].fac.push({ type, x, label })

;[['117', 44], ['116', 29], ['115', 29], ['114', 29], ['113', 29]].reduce((x, [n, w]) => { R('P1', `P1 - Room ${n}`, String(n), x as number, 40, w as number, 92); return (x as number) + (w as number) }, 10)
R('P1', 'P1 - Room 112', '112', 10, 168, 100, 92)
R('P1', 'P1 - Room 111', '111', 110, 168, 60, 92)
;['118', '119', '120', '121', '122', '123', '124', '125'].forEach((n, i) => R('P1', `P1 - Room ${n}`, n, 182 + i * 21, 62, 21, 70))
;['127', '128', '129', '130', '131', '132', '133', '134'].forEach((n, i) => R('P1', `P1 - Room ${n}`, n, 182 + i * 21, 168, 21, 70))
FAC('P1', 'lift', 60, 'Elevator A'); FAC('P1', 'lift', 262, 'Elevator B'); FAC('P1', 'wc', 176, 'Accessible restroom'); FAC('P1', 'wc', 340, 'Accessible restroom'); FAC('P1', 'seat', 130, 'Seating'); FAC('P1', 'seat', 300, 'Seating')

;[['M211/212', 64], ['M213/214', 52], ['M215/216', 46], ['M217', 30], ['M218', 30]].reduce((x, [n, w]) => { R('M2', `M2 - Room ${n}`, String(n), x as number, 62, w as number, 70); return (x as number) + (w as number) }, 14)
// The Accessibility FAQ names M219 as the quiet room and M220/M221 as prayer rooms — the map says the same.
R('M2', 'M2 - Room M219', 'M219 · Quiet', 150, 168, 90, 70, { quiet: true, note: 'Quiet room' })
R('M2', 'M2 - Room M220', 'M220', 256, 62, 44, 70, { note: 'Prayer room' })
R('M2', 'M2 - Room M221', 'M221', 300, 62, 44, 70, { note: 'Prayer room' })
FAC('M2', 'lift', 60, 'Elevator A'); FAC('M2', 'lift', 262, 'Elevator B'); FAC('M2', 'wc', 300, 'Accessible restroom'); FAC('M2', 'seat', 120, 'Seating')

R('P2', 'Banquet Hall', 'Banquet Hall', 14, 50, 170, 82)
R('P2', 'P2 - Room 211', '211', 200, 168, 90, 80)
R('P2', 'P2 - Room 212', '212', 290, 168, 56, 80)
R('P2', 'P2 - Childcare', 'Childcare · Nursing', 200, 50, 146, 82, { note: 'Childcare and nursing room' })
FAC('P2', 'lift', 60, 'Elevator A'); FAC('P2', 'lift', 262, 'Elevator B'); FAC('P2', 'wc', 320, 'Accessible restroom')

R('M1', 'VIP Room', 'VIP Room', 150, 60, 100, 72)
FAC('M1', 'lift', 60, 'Elevator A'); FAC('M1', 'lift', 262, 'Elevator B')

R('P0', 'Area 1 + 2 + 3: posters', 'Posters', 14, 30, 82, 102, { busy: true })
R('P0', 'Area 1 + 2 + 3: demos', 'Demos', 96, 30, 70, 102, { busy: true })
R('P0', 'Area 1 + 2 + 3: exhibits', 'Exhibits', 166, 30, 62, 102, { busy: true })
R('P0', 'Area 1 + 2 + 3: videos', 'Videos', 228, 30, 44, 102)
R('P0', 'Area 1 + 2 + 3: theatre', 'Theatre', 272, 30, 40, 102)
R('P0', 'Area 1 + 2 + 3: SIGCHI Lounge', 'Lounge', 312, 30, 36, 102)
R('P0', 'Entrance Hall', 'Entrance Hall · Registration', 14, 168, 334, 82)
FAC('P0', 'lift', 60, 'Elevator A'); FAC('P0', 'lift', 262, 'Elevator B'); FAC('P0', 'wc', 170, 'Accessible restroom'); FAC('P0', 'seat', 330, 'Seating')

R('AUD', 'Auditorium', 'Auditorium', 80, 40, 200, 200)

export const venueRooms: Record<string, VenueRoom> = Object.fromEntries(floors.flatMap((floor) => floor.rooms.map((room) => [room.name, room])))

/** Seats per room (from the CHI 2026 venue). */
export const capacity: Record<string, number> = {
  'P1 - Room 116': 236, 'P1 - Room 112': 500, 'P1 - Room 129': 75, 'P1 - Room 118': 75, 'P1 - Room 119': 75, 'P1 - Room 125': 75,
  'P1 - Room 111': 236, 'P1 - Room 124': 75, 'P1 - Room 114': 236, 'P1 - Room 120': 75, 'P1 - Room 121': 75, 'P1 - Room 122': 75,
  'P1 - Room 113': 236, 'P1 - Room 115': 236, 'P1 - Room 123': 75, 'P1 - Room 127': 75, 'P1 - Room 128': 75, 'P1 - Room 134': 75,
  'P1 - Room 132': 75, 'P1 - Room 131': 75, 'P1 - Room 133': 75, 'P1 - Room 117': 780, 'P1 - Room 130': 75,
  'M2 - Room M211/212': 80, 'M2 - Room M213/214': 60, 'M2 - Room M215/216': 50, 'M2 - Room M217': 20, 'M2 - Room M218': 20,
  'Banquet Hall': 150, 'VIP Room': 60, 'P2 - Room 211': 250, 'P2 - Room 212': 50,
}

/** "P1 - Room 123" → "Room 123"; named spaces keep their name. */
export function roomTitle(name: string): string {
  const room = venueRooms[name]
  if (!room) return name
  if (room.quiet) return 'Quiet Room M219'
  return /^\d|^M\d/.test(room.short) ? `Room ${room.short.split(' ')[0]}` : room.short.split(' · ')[0]
}

/** Short label used across the site, e.g. "P1 · Room 123" or "Banquet Hall · P2". */
export function roomLabel(name: string): string {
  const room = venueRooms[name]
  if (!room) return name
  if (room.floor === 'AUD') return 'Auditorium'
  return /^Room/.test(roomTitle(name)) ? `${room.floor} · ${roomTitle(name)}` : `${roomTitle(name)} · ${room.floor}`
}
