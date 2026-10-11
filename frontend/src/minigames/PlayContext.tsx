// PlayContext — the one place a minigame reads and changes money.
//
// Minigames never import the store directly. They call usePlay(), which gives them:
//   • in STORY mode  → the real story finances (wallet, reserve, credit score…) and story rewards
//   • in DIRECT mode → a private practice sandbox with its own starting balance; nothing leaks
//                      into the story, and results are reported to Direct Mode's own progress.
// The educational mechanics stay identical in both modes because it is the same component.
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useGame } from '../store/gameStore.ts'
import { useFx, type FxTone } from '../store/fxStore.ts'
import { audio } from '../lib/audio.ts'
import { inr } from '../lib/finance.ts'
import { tNow } from '../i18n/useT.ts'
import type { Loan, Portfolio, ScoreCard, TxInput } from '../types.ts'
import { api } from '../lib/api.ts'

export interface Finances { wallet: number; reserve: number; cibil: number; portfolio: Portfolio; loans: Loan[] }
export interface Report { win: boolean; score?: number; mistakes?: string[] }
export interface FxOpts { text?: string; tone?: FxTone; coins?: boolean }

export interface PlayApi extends Finances {
  mode: 'story' | 'direct'
  commit: (txs: TxInput[], fx?: FxOpts) => void
  award: (id: string, area: string, points: number) => void
  setCibil: (n: number) => void
  setPortfolio: (p: Portfolio) => void
  addLoan: (l: Loan) => void
  updateLoans: (l: Loan[]) => void
  setCashflow: (income: number, expenses: number) => void
  /** Tell the host how an attempt went (Direct Mode uses it for scores, attempts and mistakes). */
  report: (r: Report) => void
  /** Final trial: in Story Mode this ends the game; in Direct Mode it just reports. */
  finishStory: (card: ScoreCard) => void
}

const Ctx = createContext<PlayApi | null>(null)

export function usePlay(): PlayApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePlay must be used inside a Story or Direct play provider')
  return ctx
}
export const usePlayMode = () => useContext(Ctx)?.mode ?? 'story'

function showFx(txs: TxInput[], fx?: FxOpts, tag = '') {
  const net = txs.filter(t => t.account === 'wallet').reduce((s, t) => s + t.amount, 0)
  const tone: FxTone = fx?.tone ?? (net >= 0 ? 'income' : 'expense')
  useFx.getState().push(`${tag}${fx?.text ?? `${net >= 0 ? '+' : '−'}${inr(Math.abs(net))}`}`, tone)
  if (fx?.coins) { useFx.getState().burst(); audio.sfx('coin') }
}

/** Map minigame ID or topic area to Vanguard's Four Learning Pillars */
function resolvePillar(areaOrId: string = ''): 'plan_budget' | 'save_manage' | 'understand_investing' | 'stay_safe' {
  const k = areaOrId.toLowerCase()
  if (k.includes('budget') || k.includes('sorter') || k.includes('ledger') || k.includes('bargain') || k.includes('value')) {
    return 'plan_budget'
  }
  if (k.includes('emergency') || k.includes('emi') || k.includes('deposit') || k.includes('save') || k.includes('loan')) {
    return 'save_manage'
  }
  if (k.includes('compound') || k.includes('snowball') || k.includes('market') || k.includes('invest') || k.includes('72') || k.includes('pe')) {
    return 'understand_investing'
  }
  return 'stay_safe'
}

/** Story Mode: everything goes to the saved story record. */
export function StoryPlayProvider({ children }: { children: ReactNode }) {
  const g = useGame()
  const apiInstance = useMemo<PlayApi>(() => ({
    mode: 'story',
    wallet: g.wallet, reserve: g.reserve, cibil: g.cibilScore, portfolio: g.portfolio, loans: g.loans,
    commit: (txs, fx) => { useGame.getState().applyTx(txs); showFx(txs, fx) },
    award: (id, area, pts) => {
      useGame.getState().completeChallenge(id, area, pts)
      const code = useGame.getState().joinCode
      if (code) {
        api.logTelemetry({
          joinCode: code,
          pillarId: resolvePillar(area || id),
          eventType: 'challenge_complete',
          score: pts,
          metadata: { challengeId: id, area, mode: 'story' }
        })
      }
    },
    setCibil: n => useGame.getState().setCibil(n),
    setPortfolio: p => useGame.getState().setPortfolio(p),
    addLoan: l => useGame.getState().addLoan(l),
    updateLoans: l => useGame.getState().updateLoans(l),
    setCashflow: (i, e) => useGame.getState().setCashflow(i, e),
    report: r => {
      const code = useGame.getState().joinCode
      if (code) {
        api.logTelemetry({
          joinCode: code,
          pillarId: 'plan_budget',
          eventType: 'story_attempt',
          score: r.score ?? (r.win ? 100 : 0),
          metadata: { win: r.win, mistakes: r.mistakes, mode: 'story' }
        })
      }
    },
    finishStory: card => {
      useGame.getState().finishGame(card)
      const code = useGame.getState().joinCode
      if (code) {
        api.logTelemetry({
          joinCode: code,
          pillarId: 'understand_investing',
          eventType: 'story_finished',
          score: card.overall,
          metadata: { passed: card.passed }
        })
      }
    },
  }), [g.wallet, g.reserve, g.cibilScore, g.portfolio, g.loans])
  return <Ctx.Provider value={apiInstance}>{children}</Ctx.Provider>
}

/** Direct Mode: a sandbox that starts from `start` and is thrown away afterwards. */
export function DirectPlayProvider({ start, onReport, children }: { start: Finances; onReport: (r: Report) => void; children: ReactNode }) {
  const [f, setF] = useState<Finances>(start)
  const reportRef = useRef(onReport)
  reportRef.current = onReport
  const apiInstance = useMemo<PlayApi>(() => ({
    mode: 'direct',
    ...f,
    commit: (txs, fx) => {
      setF(prev => {
        let { wallet, reserve } = prev
        const portfolio = { ...prev.portfolio }
        for (const t of txs) {
          if (t.account === 'wallet') wallet += t.amount
          else if (t.account === 'reserve') reserve += t.amount
          else portfolio.cash += t.amount
        }
        return { ...prev, wallet, reserve, portfolio }
      })
      showFx(txs, fx, `${tNow('fx.practice')}: `)
    },
    award: (id, area, pts) => {
      const code = useGame.getState().joinCode
      if (code) {
        api.logTelemetry({
          joinCode: code,
          pillarId: resolvePillar(area || id),
          eventType: 'practice_award',
          score: pts,
          metadata: { challengeId: id, area, mode: 'direct' }
        })
      }
    },
    setCibil: cibil => setF(p => ({ ...p, cibil })),
    setPortfolio: portfolio => setF(p => ({ ...p, portfolio })),
    addLoan: l => setF(p => ({ ...p, loans: [...p.loans.filter(x => x.id !== l.id), l] })),
    updateLoans: loans => setF(p => ({ ...p, loans })),
    setCashflow: () => {},
    report: r => {
      reportRef.current(r)
      const code = useGame.getState().joinCode
      if (code) {
        api.logTelemetry({
          joinCode: code,
          pillarId: 'plan_budget',
          eventType: 'practice_attempt',
          score: r.score ?? (r.win ? 100 : 0),
          metadata: { win: r.win, mistakes: r.mistakes, mode: 'direct' }
        })
      }
    },
    finishStory: card => {
      reportRef.current({ win: card.passed, score: card.overall })
      const code = useGame.getState().joinCode
      if (code) {
        api.logTelemetry({
          joinCode: code,
          pillarId: 'understand_investing',
          eventType: 'practice_finished',
          score: card.overall,
          metadata: { passed: card.passed, mode: 'direct' }
        })
      }
    },
  }), [f])
  return <Ctx.Provider value={apiInstance}>{children}</Ctx.Provider>
}