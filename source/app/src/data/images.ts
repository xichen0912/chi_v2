/**
 * One photo per session, shown behind the card's title/time/room and behind the session page headline.
 * Free-license Unsplash photos, hot-linked from Unsplash's CDN (as the Awards page does).
 * To change one, replace the photo id (the part after images.unsplash.com/).
 */
const photos: Record<string, string> = {
  'ai-shared-control': 'photo-1682159672286-40790338349b',        // child touching a robotic hand
  'access-beyond-compliance': 'photo-1732194439368-4655fd0ea955', // woman in a wheelchair
  'tangible-futures': 'photo-1422246358533-95dcd3d48961',         // potter's clay-stained hand
  'community-moderation': 'photo-1781606424327-6b00dcd0519d',     // social feed on a phone
  'wellbeing-boundaries': 'photo-1513735377487-a2f16b343977',     // bench on a wooden dock
  'creative-tools': 'photo-1522542550221-31fd19575a2d',           // watercolor wireframe sketches
  'robots-in-public': 'photo-1771707397168-028abef1d651',         // delivery robot on a sidewalk
  'learning-together': 'photo-1509062522246-3755977927d7',        // classroom with teacher
  'healthcare-handoffs': 'photo-1758575514475-2a84975db58e',      // group of nurses
  'platform-labor': 'photo-1617347454431-f49d7ff5c3b1',           // delivery rider on a scooter
  'privacy-practice': 'photo-1765654991640-8f2f2f593d61',         // mirror and lace curtains
  'voice-and-sound': 'photo-1598488035139-bdbb2231ce04',          // recording studio
  'climate-adaptation': 'photo-1604275689235-fdc521556c16',       // floodwater around buildings
  'playful-bodies': 'photo-1529229504105-4ea795dcbf59',           // dancer, long exposure
  'methods-and-power': 'photo-1503551723145-6c040742065b-v2',     // sticky notes on a board
}

/** Photo URL for a session, sized for where it is shown. */
export function sessionImage(id: string, width = 900): string | undefined {
  const photo = photos[id]
  return photo ? `https://images.unsplash.com/${photo}?w=${width}&q=70&auto=format&fit=crop` : undefined
}
