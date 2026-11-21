/**
 * Fictional room environment data, keyed by the venue room names used on the Map.
 * Rooms missing here are deliberately "unknown" to test how missing information is shown.
 */
export interface RoomInfo {
  crowding: 'low' | 'medium' | 'high'
  sensoryFriendly: boolean
  stepFree: boolean
  temperature: 'cool' | 'comfortable' | 'warm'
}

export const rooms: Record<string, RoomInfo> = {
  'Banquet Hall': { crowding: 'high', sensoryFriendly: false, stepFree: true, temperature: 'warm' },
  'P1 - Room 123': { crowding: 'medium', sensoryFriendly: true, stepFree: true, temperature: 'comfortable' },
  'P1 - Room 127': { crowding: 'medium', sensoryFriendly: true, stepFree: true, temperature: 'comfortable' },
  'P1 - Room 116': { crowding: 'low', sensoryFriendly: true, stepFree: true, temperature: 'comfortable' },
  'P2 - Room 212': { crowding: 'low', sensoryFriendly: true, stepFree: false, temperature: 'cool' },
  'P2 - Room 211': { crowding: 'low', sensoryFriendly: true, stepFree: true, temperature: 'comfortable' },
  'M2 - Room M215/216': { crowding: 'high', sensoryFriendly: false, stepFree: true, temperature: 'comfortable' },
}
