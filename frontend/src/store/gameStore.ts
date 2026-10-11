// Central game state (Zustand).
//
// Two progression records live side by side and are saved separately:
//   • storyProgress      — the narrative run: chapter/island, story events, the story's own wallet,
//                          reserve, credit score, mastery. Only Story Mode writes to it.
//   • directModeProgress — topic completion, best scores, attempts, history. Only Direct Mode writes to it.
// Direct Mode activities run against a sandbox (see minigames/PlayContext.tsx), so they can never
// change story money, unlock islands or skip chapters.
//
// For convenience the story fields sit at the top level of the store (components already read
// `wallet`, `activeWorld`… directly); they are written to disk under `storyProgress`.
import { create } from 'zustand'
import type { DirectProgress, DirectTopicRecord, Profile, GameState, Lang, Loan, Phase, Portfolio, ScoreCard, TxInput, WorldId } from '../types.ts'
import { api } from '../lib/api.ts'

export const SAVE_KEY = 'pocketplay.save'
export const BACKUP_KEY = 'pocketplay.save.v1-backup'
export const SAVE_VERSION = 3 // v3 adds `profile` (playthroughs + seen dialogue) and `runCounted`

export const initialState = (): GameState => ({
  joinCode: '',
  saveVersion: SAVE_VERSION,
  playerName: '',
  wallet: 0,
  reserve: 0,
  cibilScore: 650,
  activeWorld: 1,
  unlockedNodes: [1],
  language: 'en',
  sceneIndex: 0,
  completedChallenges: [],
  completedLearning: [],
  masteryPoints: 0,
  mastery: {},
  transactions: [],
  portfolio: { etf: 0, stock: 0, gold: 0, cash: 0 },
  loans: [],
  monthlyIncome: 0,
  monthlyExpenses: 0,
  audio: { music: true, sfx: true, volume: 0.6 },
  scorecard: null,
  storyChoices: {},
  runCounted: false,
  phase: 'title',
})

export const initialDirect = (): DirectProgress => ({ topics: {}, recent: [], history: [] })
/** Player profile: survives new story runs and story resets. */
export const initialProfile = (): Profile => ({ storyPlaythroughsCompleted: 0, seenDialogue: [] })

/** Story fields — exactly what goes into `storyProgress` on disk. */
const STORY_KEYS = [
  'joinCode',
  'playerName',
  'wallet',
  'reserve',
  'cibilScore',
  'activeWorld',
  'unlockedNodes',
  'sceneIndex',
  'completedChallenges',
  'completedLearning',
  'masteryPoints',
  'mastery',
  'transactions',
  'portfolio',
  'loans',
  'monthlyIncome',
  'monthlyExpenses',
  'scorecard',
  'storyChoices',
  'runCounted'
] as const

export interface Actions {
  setJoinCode: (code: string) => void
  hydrateFromServer: (sessionData: any) => void
  newGame: (name: string) => void
  continueGame: () => void
  setPhase: (p: Phase) => void
  setLanguage: (l: Lang) => void
  setAudio: (a: Partial<GameState['audio']>) => void
  applyTx: (txs: TxInput[]) => void
  advanceScene: () => void
  completeChallenge: (id: string, area: string, points: number) => void
  completeLearning: (id: string) => void
  unlockNextWorld: () => void
  setCibil: (n: number) => void
  setPortfolio: (p: Portfolio) => void
  addLoan: (l: Loan) => void
  updateLoans: (l: Loan[]) => void
  setCashflow: (income: number, expenses: number) => void
  recordChoice: (key: string, value: string) => boolean
  finishGame: (s: ScoreCard) => void
  resetProgress: () => void
  // Direct Mode — touches only `direct`
  recordDirectAttempt: (id: string, r: { score: number; win: boolean }) => void
  markDialogueSeen: (scriptId: string) => void
  touchRecent: (id: string) => void
  resetDirect: () => void
}

export type Store = GameState & Actions & { hasSave: boolean; direct: DirectProgress; profile: Profile }

/* ---------- validation helpers ---------- */
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string')
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Validates a story record (works for both the v1 flat save and v2 `storyProgress`). */
function readStory(d: Record<string, unknown>): Partial<GameState> | null {
  if (typeof d.playerName !== 'string' || !d.playerName) return null
  const base = initialState()
  const portfolio = d.portfolio as Portfolio | undefined
  return {
    joinCode: typeof d.joinCode === 'string' ? d.joinCode : '',
    playerName: d.playerName.slice(0, 24),
    wallet: isNum(d.wallet) ? d.wallet : base.wallet,
    reserve: isNum(d.reserve) ? d.reserve : base.reserve,
    cibilScore: isNum(d.cibilScore) ? Math.min(900, Math.max(300, d.cibilScore)) : base.cibilScore,
    activeWorld: ([1, 2, 3, 4, 5] as unknown[]).includes(d.activeWorld) ? (d.activeWorld as WorldId) : 1,
    unlockedNodes: Array.isArray(d.unlockedNodes) ? d.unlockedNodes.filter(isNum) : [1],
    sceneIndex: isNum(d.sceneIndex) && d.sceneIndex >= 0 ? Math.floor(d.sceneIndex) : 0,
    completedChallenges: isStrArr(d.completedChallenges) ? d.completedChallenges : [],
    completedLearning: isStrArr(d.completedLearning) ? d.completedLearning : [],
    masteryPoints: isNum(d.masteryPoints) ? d.masteryPoints : 0,
    mastery: isObj(d.mastery) ? (d.mastery as Record<string, number>) : {},
    transactions: Array.isArray(d.transactions) ? (d.transactions as { amount?: unknown }[]).filter(t => t && isNum(t.amount)).slice(-400) as GameState['transactions'] : [],
    portfolio: portfolio && isNum(portfolio.etf) ? portfolio : base.portfolio,
    loans: Array.isArray(d.loans) ? (d.loans as { emi?: unknown }[]).filter(l => l && isNum(l.emi)) as Loan[] : [],
    monthlyIncome: isNum(d.monthlyIncome) ? d.monthlyIncome : 0,
    monthlyExpenses: isNum(d.monthlyExpenses) ? d.monthlyExpenses : 0,
    scorecard: isObj(d.scorecard) && isNum(d.scorecard.overall) ? (d.scorecard as unknown as ScoreCard) : null,
    storyChoices: isObj(d.storyChoices) ? (d.storyChoices as Record<string, string>) : {},
    // Older saves never recorded this; a run that already reached a passing ending counts as counted.
    runCounted: typeof d.runCounted === 'boolean' ? d.runCounted : !!(isObj(d.scorecard) && d.scorecard.passed),
  }
}

function readDirect(d: unknown): DirectProgress {
  const out = initialDirect()
  if (!isObj(d)) return out
  if (isObj(d.topics)) {
    for (const [k, v] of Object.entries(d.topics)) {
      if (isObj(v) && isNum(v.attempts) && isNum(v.bestScore)) out.topics[k] = v as unknown as DirectTopicRecord
    }
  }
  if (isStrArr(d.recent)) out.recent = d.recent.slice(0, 8)
  if (Array.isArray(d.history)) out.history = (d.history as { id?: unknown; score?: unknown }[]).filter(h => h && typeof h.id === 'string' && isNum(h.score)).slice(-100) as DirectProgress['history']
  return out
}

/** Reads the save safely, migrating v1 (flat) saves to v2. Never throws, never deletes. */
function readProfile(d: unknown, story: Partial<GameState> | null): Profile {
  const p = initialProfile()
  if (isObj(d)) {
    if (isNum(d.storyPlaythroughsCompleted) && d.storyPlaythroughsCompleted >= 0) p.storyPlaythroughsCompleted = Math.floor(d.storyPlaythroughsCompleted)
    if (isStrArr(d.seenDialogue)) p.seenDialogue = d.seenDialogue
    return p
  }
  // Migration from v1/v2 (no profile yet): a save that already finished the story counts as one playthrough.
  if (story?.scorecard?.passed) p.storyPlaythroughsCompleted = 1
  return p
}

export function loadSave(): { story: Partial<GameState> | null; direct: DirectProgress; settings: Pick<GameState, 'language' | 'audio'>; profile: Profile } {
  const base = initialState()
  const empty = { story: null, direct: initialDirect(), settings: { language: base.language, audio: base.audio }, profile: initialProfile() }
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return empty
    const d = JSON.parse(raw)
    if (!isObj(d)) return empty
    const settingsSrc = isObj(d.settings) ? d.settings : d // v1 kept language/audio at the top level
    const settings = {
      language: (['en', 'te', 'hi'] as unknown[]).includes(settingsSrc.language) ? (settingsSrc.language as Lang) : base.language,
      audio: isObj(settingsSrc.audio) && typeof settingsSrc.audio.music === 'boolean' ? { ...base.audio, ...(settingsSrc.audio as object) } : base.audio,
    }
    if (d.saveVersion === 2 || d.saveVersion === 3) {
      const story = isObj(d.storyProgress) ? readStory(d.storyProgress) : null
      return { story, direct: readDirect(d.directModeProgress), settings, profile: readProfile(d.profile, story) }
    }
    // v1 → v3 migration: keep a backup of the original before anything is rewritten.
    try { localStorage.setItem(BACKUP_KEY, raw) } catch { /* ignore */ }
    const story = readStory(d)
    return { story, direct: initialDirect(), settings, profile: readProfile(undefined, story) }
  } catch {
    return empty // corrupt JSON never crashes the game
  }
}

function persist(s: Store) {
  const story: Record<string, unknown> = {}
  for (const k of STORY_KEYS) story[k] = s[k]
  const data = {
    saveVersion: SAVE_VERSION,
    settings: { language: s.language, audio: s.audio },
    storyProgress: s.playerName ? story : null,
    directModeProgress: s.direct,
    profile: s.profile,
  }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch { /* storage full / blocked: play on */ }
}

const saved = loadSave()
let txCounter = 0

export const useGame = create<Store>((set, get) => ({
  ...initialState(),
  ...saved.settings,
  ...(saved.story ?? {}),
  phase: 'title', // always boot to the title screen
  hasSave: !!saved.story,
  direct: saved.direct,
  profile: saved.profile,

  setJoinCode: (joinCode: string) => set({ joinCode }),

  hydrateFromServer: (data: any) => {
    if (!data) return
    const s = data.session || data
    if (!s || !s.joinCode) return

    set({
      joinCode: s.joinCode,
      playerName: s.playerName || get().playerName || 'Pappu',
      wallet: Number(s.wallet ?? get().wallet),
      reserve: Number(s.reserve ?? get().reserve),
      cibilScore: Number(s.cibilScore ?? get().cibilScore),
      language: (s.language as Lang) || get().language,
      activeWorld: (Number(s.activeWorld) || get().activeWorld || 1) as WorldId,
      unlockedNodes: Array.isArray(s.unlockedNodes) && s.unlockedNodes.length > 0 ? s.unlockedNodes : (get().unlockedNodes.length ? get().unlockedNodes : [1]),
      completedChallenges: Array.isArray(s.completedChallenges) ? s.completedChallenges : get().completedChallenges,
      hasSave: true,
      phase: 'map',
    })
  },

  newGame: (name) => {
    const s = get()
    // A new story run never touches Direct Mode progress or the player profile (playthrough count).
    set({ ...initialState(), playerName: name.trim() || 'Pappu', language: s.language, audio: s.audio, phase: 'map', unlockedNodes: [1], hasSave: true, direct: s.direct, profile: s.profile })
  },
  continueGame: () => set({ phase: get().scorecard ? 'ending' : 'map' }),
  setPhase: (phase) => set({ phase }),
  setLanguage: (language) => set({ language }),
  setAudio: (a) => set({ audio: { ...get().audio, ...a } }),

  applyTx: (txs) => {
    const s = get()
    let { wallet, reserve } = s
    const portfolio = { ...s.portfolio }
    const now = Date.now()
    const rows = txs.map(t => {
      const amount = Math.round(t.amount * 100) / 100
      if (t.account === 'wallet') wallet += amount
      else if (t.account === 'reserve') reserve += amount
      else portfolio.cash += amount
      return { ...t, amount, id: `${now}-${txCounter++}`, world: s.activeWorld, ts: now }
    })
    set({ wallet: Math.round(wallet * 100) / 100, reserve: Math.round(reserve * 100) / 100, portfolio, transactions: [...s.transactions, ...rows].slice(-400) })
  },

  advanceScene: () => set({ sceneIndex: get().sceneIndex + 1 }),

  completeChallenge: (id, area, points) => {
    const s = get()
    if (s.completedChallenges.includes(id)) return // replays never double-award
    set({
      completedChallenges: [...s.completedChallenges, id],
      masteryPoints: s.masteryPoints + points,
      // per-area totals plus a per-challenge record (`ch:<id>`) used by the island panels
      mastery: { ...s.mastery, [area]: (s.mastery[area] ?? 0) + points, [`ch:${id}`]: points },
    })
  },
  completeLearning: (id) => { const s = get(); if (!s.completedLearning.includes(id)) set({ completedLearning: [...s.completedLearning, id] }) },

  unlockNextWorld: () => {
    const s = get()
    const next = Math.min(5, s.activeWorld + 1) as WorldId
    set({ activeWorld: next, sceneIndex: 0, unlockedNodes: Array.from(new Set([...s.unlockedNodes, next])) })
  },
  setCibil: (cibilScore) => set({ cibilScore: Math.min(900, Math.max(300, cibilScore)) }),
  setPortfolio: (portfolio) => set({ portfolio }),
  addLoan: (l) => set({ loans: [...get().loans.filter(x => x.id !== l.id), l] }),
  updateLoans: (loans) => set({ loans }),
  setCashflow: (monthlyIncome, monthlyExpenses) => set({ monthlyIncome, monthlyExpenses }),
  /** Records a story choice once. Returns false if it was already made (so effects never apply twice). */
  recordChoice: (key, value) => {
    const s = get()
    if (key in s.storyChoices) return false
    set({ storyChoices: { ...s.storyChoices, [key]: value } })
    return true
  },
  /** Called once the final trial is passed. Counts the playthrough exactly once per run,
   *  however many times the ending renders or the browser is refreshed. */
  finishGame: (scorecard) => {
    const s = get()
    const count = scorecard.passed && !s.runCounted
    set({
      scorecard, phase: 'ending',
      runCounted: s.runCounted || count,
      profile: count ? { ...s.profile, storyPlaythroughsCompleted: s.profile.storyPlaythroughsCompleted + 1 } : s.profile,
    })
  },
  resetProgress: () => {
    const s = get()
    // Resets the STORY only. Direct Mode progress and settings are kept.
    set({ ...initialState(), language: s.language, audio: s.audio, hasSave: false, direct: s.direct, profile: s.profile })
  },

  recordDirectAttempt: (id, r) => {
    const d = get().direct
    const prev = d.topics[id] ?? { attempts: 0, bestScore: 0, completed: false, lastScore: 0, lastPlayed: 0 }
    const rec: DirectTopicRecord = {
      attempts: prev.attempts + 1,
      bestScore: Math.max(prev.bestScore, r.win ? r.score : 0), // a replay never lowers the best score
      lastScore: r.score,
      completed: prev.completed || r.win,
      lastPlayed: Date.now(),
    }
    set({ direct: { ...d, topics: { ...d.topics, [id]: rec }, history: [...d.history, { id, score: r.score, win: r.win, ts: rec.lastPlayed }].slice(-100) } })
  },
  touchRecent: (id) => { const d = get().direct; set({ direct: { ...d, recent: [id, ...d.recent.filter(x => x !== id)].slice(0, 8) } }) },
  resetDirect: () => set({ direct: initialDirect() }),
  /** A conversation counts as "seen" only once it has been read to its last line. */
  markDialogueSeen: (id) => { const p = get().profile; if (!p.seenDialogue.includes(id)) set({ profile: { ...p, seenDialogue: [...p.seenDialogue, id] } }) },
}))

// Auto-save locally and debounced sync to SQLite backend
let syncTimeout: any = null
useGame.subscribe(s => {
  persist(s)

  if (s.joinCode && !s.joinCode.startsWith('OFF-')) {
    clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      api.syncProgress(s.joinCode!, {
        wallet: s.wallet,
        reserve: s.reserve,
        cibilScore: s.cibilScore,
        activeWorld: s.activeWorld,
        unlockedNodes: s.unlockedNodes,
        completedChallenges: s.completedChallenges,
        language: s.language,
      })
    }, 500)
  }
})