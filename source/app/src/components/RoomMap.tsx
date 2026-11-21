import { floors, venueRooms } from '../data/venue'

// Tiny plan of the room's floor with the room filled in. Location is shown by position, not words.
export function RoomMap({ room }: { room: string }) {
  const target = venueRooms[room]
  const floor = floors.find((item) => item.id === target?.floor)
  if (!target || !floor) return null
  return (
    <svg className="room-map" viewBox="0 0 360 270" role="img" aria-label={`${room} on the Level ${floor.label} plan`}>
      <rect className="corridor" x="10" y="136" width="340" height="28" rx="4" />
      {floor.rooms.map((item) => (
        <rect key={item.name} x={item.x} y={item.y} width={item.w} height={item.h} rx="3" className={item.name === room ? 'is-here' : ''} />
      ))}
      <rect className="pulse" x={target.x} y={target.y} width={target.w} height={target.h} rx="3" />
    </svg>
  )
}
