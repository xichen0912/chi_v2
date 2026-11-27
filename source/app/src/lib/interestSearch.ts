import { availableInterests, type Interest } from '../data/interests'
import { sessions } from '../data/sessions'
import { interestSignals } from './relevance'

/**
 * Loose words people use when they can't name a field yet. Only used to find an interest,
 * never to decide which sessions match one (that stays with interestSignals).
 */
const looseWords: Record<string, string[]> = {
  'Human-AI Interaction': ['llm', 'chatbot', 'machine learning', 'generative', 'copilot', 'agent', 'automation', '人工智能', '智能'],
  Accessibility: ['disability', 'wheelchair', 'screen reader', 'sign language', 'inclusion', 'elderly', 'older adults', 'aging', '无障碍', '残障', '老年'],
  'Tangible Interaction': ['physical', 'craft', 'material', 'clay', 'touch', 'wearable', 'maker', '实体', '材料'],
  'Design Tools': ['sketch', 'figma', 'creative', 'art', 'drawing', 'tools for designers', '设计工具', '创作'],
  'Social Computing': ['community', 'online', 'platform', 'gig work', 'labor', 'misinformation', 'privacy', '社交', '社区', '平台'],
  'Health & Wellbeing': ['elderly care', 'aging', 'older adults', 'nursing', 'hospital', 'stress', 'sleep', 'therapy', 'healthcare', '医养', '养老', '健康', '医疗', '护理'],
  'Human-Robot Interaction': ['robots', 'drone', 'autonomous', 'delivery robot', 'social robot', '机器人'],
  'Learning Technologies': ['school', 'students', 'kids', 'children', '孩子', '儿童', '学生', 'teacher', 'study', '教育', '学习'],
  'Critical Design': ['ethics', 'justice', 'feminist', 'decolonial', 'futures', 'climate', '批判', '思辨'],
  'Participatory Design': ['workshop', 'stakeholders', 'community partners', 'citizens', '参与式', '共创'],
  'Explainable AI': ['interpretability', 'why did the ai', 'black box', 'xai', 'accountability', '可解释'],
}

const norm = (value: string) => value.toLowerCase().replace(/[和与及、，,]|还有|以及/g, ' ').replace(/[–-]/g, ' ').replace(/&/g, ' ').replace(/\s+/g, ' ').trim()

// Edit distance with swapped letters counted as one edit (robtos → robots); only needs to tell 0, 1 or 2 apart.
function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3
  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, index) => index)]
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i]
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], rows[i - 2][j - 2] + 1)
    }
    rows.push(row)
  }
  return rows[a.length][b.length]
}

/** How well one query word fits a phrase: 3 exact/contains, 2 word prefix, 1 typo or initials, 0 none. */
function wordScore(word: string, phrase: string): number {
  const words = phrase.split(' ')
  if (/[\u4e00-\u9fff]/.test(word)) return phrase.includes(word) ? 3 : 0
  if (words.includes(word) || (word.length >= 3 && words.some((item) => item.startsWith(word)))) return 3
  if (words.some((item) => item.startsWith(word.slice(0, Math.max(3, word.length - 1))))) return 2
  // Word forms: sketching → sketch, classrooms → classroom.
  if (words.some((item) => item.length >= 4 && word.startsWith(item) && word.length - item.length <= 4)) return 2
  if (word.length >= 4 && words.some((item) => distance(word, item.slice(0, word.length + 1)) <= (word.length >= 7 ? 2 : 1))) return 1
  if (word.length >= 2 && word.length <= 4 && words.length >= 2 && words.map((item) => item[0]).join('').startsWith(word)) return 1
  return 0
}

// Whole-phrase match: on word boundaries for Latin text ("art" is not in "participatory"), anywhere for Chinese.
const contains = (query: string, phrase: string) => /[\u4e00-\u9fff]/.test(phrase) ? query.includes(phrase) : phrase.length > 2 && ` ${query} `.includes(` ${phrase} `)

/** Sessions that carry an interest most strongly, nudged toward the visitor's own words. */
export function sessionsForInterest(interest: Interest, query = '', limit = 2) {
  const signals = (interestSignals[interest] ?? []).map(norm)
  const words = norm(query).split(' ').filter((word) => word.length > 2)
  return sessions
    .map((session) => {
      const text = norm([session.title, session.description, ...session.keywords, ...session.contents.flatMap((content) => [content.title, ...content.keywords])].join(' '))
      const score = signals.filter((signal) => text.includes(signal)).length + words.filter((word) => text.includes(word)).length * 2
      return { session, score }
    })
    .filter((entry) => entry.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.session)
}

export interface InterestHit {
  interest: Interest
  /** Found only through a session that mentions the query, not through the interest's own words. */
  indirect?: boolean
  /** Why it came up when it isn't the name itself: the related word or a session that mentions it. */
  via?: string
  score: number
}

/**
 * Fuzzy interest finder for when someone can't say exactly what they want to see.
 * Matches the interest names, their signal words, loose everyday words, and sessions/papers that mention the query.
 */
export function searchInterests(query: string, extra: Interest[] = []): InterestHit[] {
  const q = norm(query)
  const words = q.split(' ').filter((word) => word.length > 1 || /[一-鿿]/.test(word))
  if (!words.length) return []
  const pool = [...availableInterests, ...extra.filter((item) => !availableInterests.includes(item))]

  return pool
    .map((interest): InterestHit => {
      const name = norm(interest)
      const related = [...(interestSignals[interest] ?? []), ...(looseWords[interest] ?? [])].map(norm)
      const nameScore = words.reduce((sum, word) => sum + wordScore(word, name), 0) * 2
      let best = { score: 0, via: undefined as string | undefined, indirect: false }
      for (const phrase of related) {
        const score = contains(q, phrase) ? 5 + phrase.split(' ').length : words.reduce((sum, word) => sum + wordScore(word, phrase), 0)
        if (score > best.score) best = { score, via: phrase, indirect: false }
      }
      // A session that mentions every query word and carries this interest's signals.
      if (!nameScore && !best.score) {
        const session = sessions.find((item) => {
          const text = norm([item.title, item.description, ...item.keywords, ...item.contents.flatMap((content) => [content.title, ...content.keywords])].join(' '))
          return words.every((word) => text.includes(word)) && (interestSignals[interest] ?? []).some((signal) => text.includes(norm(signal)))
        })
        if (session) best = { score: 2, via: session.title, indirect: true }
      }
      const score = Math.max(nameScore, best.score)
      return nameScore >= best.score ? { interest, score } : { interest, score, via: best.via, indirect: best.indirect }
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    // Sessions are only a fallback: drop those guesses once an interest matches the words directly.
    .filter((hit, _, all) => !hit.indirect || all.every((other) => other.indirect))
}
