// Islands (map positions + story chapters) and the Direct Mode activity catalog.
import type { WorldId } from '../types.ts'
import type { Finances } from '../minigames/PlayContext.tsx'
import { WORLDS } from './worlds.ts'

/* ---------------- Islands ---------------- */
export interface Island {
  id: WorldId
  x: number; y: number          // centre on the map, in % (matches tools/make_map.py)
  hit: number                   // hit-area width in % of the map (generous for touch)
  category: CategoryId
  chapterKey: string            // i18n key for the chapter title
}
// Text lives in i18n/content/catalog.ts: island.<id>.desc and island.<id>.boss

export const ISLANDS: Island[] = [
  { id: 1, x: 17.2, y: 70, hit: 20, category: 'money', chapterKey: 'chapter.1' },
  { id: 2, x: 35.9, y: 36.7, hit: 20, category: 'banking', chapterKey: 'chapter.2' },
  { id: 3, x: 55, y: 72.2, hit: 19, category: 'credit', chapterKey: 'chapter.3' },
  { id: 4, x: 76.9, y: 47.8, hit: 21, category: 'investing', chapterKey: 'chapter.4' },
  { id: 5, x: 60, y: 16.7, hit: 18, category: 'security', chapterKey: 'chapter.5' },
]

/** The minigame steps of a story world — these are the island's "challenges". */
export const storyChallenges = (w: WorldId) => WORLDS[w].steps.filter(s => s.kind === 'game').map(s => s.id)

/* ---------------- Direct Mode catalog ---------------- */
export type CategoryId = 'money' | 'banking' | 'credit' | 'investing' | 'security'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/** `topics` are topic keys: translated with t(`topic.${key}`). */
export interface Category { id: CategoryId; island: WorldId; mentor: string; topics: string[] }
export const CATEGORIES: Category[] = [
  { id: 'money', island: 1, mentor: 'kaelen', topics: ['income', 'budgeting', 'needsWants', '503020', 'buffers', 'unitPrice', 'planning'] },
  { id: 'banking', island: 2, mentor: 'aditi', topics: ['savingsAcc', 'rd', 'fd', 'debit', 'credit', 'upi', 'pinOtp', 'phishing'] },
  { id: 'credit', island: 3, mentor: 'virendra', topics: ['principal', 'simpleCompound', 'monthlyAnnual', 'repayment', 'emi', 'goodBad', 'creditScore', 'dti'] },
  { id: 'investing', island: 4, mentor: 'vikram', topics: ['shares', 'mf', 'etf', 'diversification', 'eps', 'pe', 'volatility', 'longTerm'] },
  { id: 'security', island: 5, mentor: 'overseer', topics: ['inflation', 'purchasing', 'rule72', 'efund', 'health', 'risk', 'ltPlanning', 'resilience'] },
]

/** All visible text is in i18n/content/catalog.ts under act.<id>.{name,desc,intro,obj,mentor}. */
export interface Activity {
  id: string                    // also the MINIGAMES key
  category: CategoryId
  difficulty: Difficulty
  minutes: number
  type: string                  // type key → t(`type.${type}`)
  topics: string[]              // topic keys (searchable in the current language)
  learningId: string            // Step 2 learning card
  start?: Partial<Finances>     // practice sandbox starting point
}

export const ACTIVITIES: Activity[] = [
  // Money management
  { id: 'sorter', category: 'money', difficulty: 'beginner', minutes: 3, type: 'sorting', learningId: 'budget',
    topics: ['needsWants', 'budgeting', '503020', 'income'], start: { wallet: 15000, reserve: 0 } },
  { id: 'bargain', category: 'money', difficulty: 'beginner', minutes: 2, type: 'calculator', learningId: 'unitprice',
    topics: ['unitPrice', 'planning'], start: { wallet: 3500 } },
  { id: 'ledger', category: 'money', difficulty: 'intermediate', minutes: 4, type: 'simulation', learningId: 'budget',
    topics: ['planning', 'buffers', 'income'], start: { wallet: 1500, reserve: 500 } },
  // Banking & digital safety
  { id: 'deposit', category: 'banking', difficulty: 'beginner', minutes: 2, type: 'matching', learningId: 'deposits',
    topics: ['savingsAcc', 'rd', 'fd'], },
  { id: 'scam', category: 'banking', difficulty: 'beginner', minutes: 2, type: 'decision', learningId: 'payments',
    topics: ['upi', 'pinOtp', 'phishing', 'debit'], },
  { id: 'gauntlet', category: 'banking', difficulty: 'intermediate', minutes: 3, type: 'swipe', learningId: 'payments',
    topics: ['phishing', 'upi', 'credit', 'pinOtp'], },
  // Loans & credit
  { id: 'snowball', category: 'credit', difficulty: 'intermediate', minutes: 3, type: 'simulation', learningId: 'interest',
    topics: ['monthlyAnnual', 'simpleCompound', 'principal', 'goodBad', 'repayment'], start: { wallet: 6000 } },
  { id: 'emicalc', category: 'credit', difficulty: 'intermediate', minutes: 3, type: 'calculator', learningId: 'credit',
    topics: ['emi', 'repayment', 'dti', 'principal'], },
  { id: 'emi', category: 'credit', difficulty: 'advanced', minutes: 4, type: 'simulation', learningId: 'credit',
    topics: ['creditScore', 'dti', 'goodBad', 'repayment'], start: { cibil: 650 } },
  // Investing & markets
  { id: 'value', category: 'investing', difficulty: 'intermediate', minutes: 3, type: 'investigation', learningId: 'investing',
    topics: ['shares', 'eps', 'pe'], },
  { id: 'pecalc', category: 'investing', difficulty: 'beginner', minutes: 2, type: 'calculator', learningId: 'investing',
    topics: ['pe', 'eps', 'shares'], },
  { id: 'market', category: 'investing', difficulty: 'advanced', minutes: 4, type: 'simulation', learningId: 'diversification',
    topics: ['diversification', 'volatility', 'longTerm', 'etf', 'mf'], start: { wallet: 20000 } },
  // Security & wealth
  { id: 'rule72', category: 'security', difficulty: 'beginner', minutes: 2, type: 'calcQuiz', learningId: 'inflation',
    topics: ['rule72', 'inflation', 'purchasing'], },
  { id: 'efund', category: 'security', difficulty: 'intermediate', minutes: 3, type: 'planning', learningId: 'shields',
    topics: ['efund', 'health', 'risk', 'resilience'], },
  { id: 'trial', category: 'security', difficulty: 'advanced', minutes: 6, type: 'life', learningId: 'shields',
    topics: ['ltPlanning', 'resilience', 'inflation', 'health', 'efund'], start: { wallet: 20000, reserve: 500, portfolio: { etf: 7000, stock: 2000, gold: 1000, cash: 0 }, loans: [{ id: 'equipment', lender: 'practice', principal: 14000, annualRate: 0.12, months: 6, emi: 1244, remaining: 7207 }] } },
]

export const DEFAULT_START: Finances = { wallet: 10000, reserve: 500, cibil: 650, portfolio: { etf: 0, stock: 0, gold: 0, cash: 0 }, loans: [] }
export const activityById = (id: string) => ACTIVITIES.find(a => a.id === id)
export const activitiesIn = (c: CategoryId) => ACTIVITIES.filter(a => a.category === c)
/** "Continue to a related topic": the next activity in the same category, wrapping to the next category. */
export function relatedActivity(id: string) {
  const i = ACTIVITIES.findIndex(a => a.id === id)
  return ACTIVITIES[(i + 1) % ACTIVITIES.length]
}
