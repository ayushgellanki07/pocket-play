// Shared TypeScript shapes for the whole game.
// Keeping them in one file makes it easy to see what the save file contains.

export type Lang = 'en' | 'te' | 'hi'
export type Mood = 'neutral' | 'confused' | 'excited' | 'skeptical' | 'worried' | 'success'
export type WorldId = 1 | 2 | 3 | 4 | 5
// title → modes → (story: setup → map ⇄ playing → ending) | (direct: library)
export type Phase = 'title' | 'modes' | 'setup' | 'map' | 'playing' | 'transition' | 'ending' | 'direct'

export type Account = 'wallet' | 'reserve' | 'portfolio'
export type TxKind = 'income' | 'expense' | 'transfer' | 'investment' | 'loan' | 'interest' | 'loss' | 'reward'

/** One line in the ledger. Positive amount = money in, negative = money out. */
export interface Transaction {
  id: string
  label: string                 // i18n key (old saves may hold plain English text — shown as-is)
  vars?: Record<string, string | number> // values for the key; names ending in "Key" are translated too
  amount: number
  account: Account
  kind: TxKind
  world: number
  ts: number
}

export interface Portfolio { etf: number; stock: number; gold: number; cash: number }

export interface Loan {
  id: string
  lender: string
  principal: number
  annualRate: number // nominal, e.g. 0.12
  months: number
  emi: number
  remaining: number
}

export interface AudioPrefs { music: boolean; sfx: boolean; volume: number }

export type Pillar =
  | 'budget' | 'emergency' | 'fraud' | 'debt' | 'diversification' | 'inflation' | 'resilience'

export interface ScoreCard {
  pillars: Record<Pillar, number> // 0–100 each
  overall: number
  netWorth: number
  realNetWorth: number
  passed: boolean
}

export interface GameState {
  joinCode?: string;
  saveVersion: number
  playerName: string
  wallet: number
  reserve: number
  cibilScore: number
  activeWorld: WorldId
  unlockedNodes: number[]
  language: Lang
  sceneIndex: number
  completedChallenges: string[]
  completedLearning: string[]
  masteryPoints: number
  mastery: Record<string, number>
  transactions: Transaction[]
  portfolio: Portfolio
  loans: Loan[]
  monthlyIncome: number
  monthlyExpenses: number
  audio: AudioPrefs
  scorecard: ScoreCard | null
  storyChoices: Record<string, string> // choices made in story dialogue (each applies its effect once)
  runCounted: boolean                  // this run's completion was already added to the profile
  phase: Phase
}

/** Player-level record that outlives individual story runs. */
export interface Profile {
  storyPlaythroughsCompleted: number  // 0 during the first playthrough
  seenDialogue: string[]              // dialogue scripts read to the end at least once
}

/* ---------- Direct Mode progress (kept separate from the story) ---------- */
export interface DirectTopicRecord { attempts: number; bestScore: number; lastScore: number; completed: boolean; lastPlayed: number }
export interface DirectProgress {
  topics: Record<string, DirectTopicRecord>
  recent: string[]
  history: { id: string; score: number; win: boolean; ts: number }[]
}

export type TxInput = Pick<Transaction, 'label' | 'amount' | 'account' | 'kind' | 'vars'>

/* ---------- content ---------- */

/** What a story choice changes. Applied once, the first time the choice is made. */
export interface ChoiceEffect {
  mastery?: number          // + or − story mastery points
  cibil?: number            // credit-score change
  toReserve?: number        // move this much from wallet to reserve
}

export interface DialogueChoice {
  label: string
  next?: string        // id of the line to jump to
  correct?: boolean    // used for quick knowledge checks inside dialogue
  effect?: ChoiceEffect
  note?: string        // shown as a toast when the effect applies
}

export interface DialogueLine {
  id: string
  speaker: 'npc' | 'player' | 'narrator'
  character?: string
  mood?: Mood
  text: string
  highlightedTerms?: string[]
  choices?: DialogueChoice[]
  nextDialogueId?: string | null
  trigger?: 'sfx:alert' | 'sfx:coin' | 'sfx:portal' | 'sfx:warn' | null
}

export type StepKind = 'dialogue' | 'learn' | 'game'
export interface Step { kind: StepKind; id: string; objective: string }
