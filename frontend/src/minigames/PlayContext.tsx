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

/** Story Mode: everything goes to the saved story record. */
export function StoryPlayProvider({ children }: { children: ReactNode }) {
  const g = useGame()
  const api = useMemo<PlayApi>(() => ({
    mode: 'story',
    wallet: g.wallet, reserve: g.reserve, cibil: g.cibilScore, portfolio: g.portfolio, loans: g.loans,
    commit: (txs, fx) => { useGame.getState().applyTx(txs); showFx(txs, fx) },
    award: (id, area, pts) => useGame.getState().completeChallenge(id, area, pts),
    setCibil: n => useGame.getState().setCibil(n),
    setPortfolio: p => useGame.getState().setPortfolio(p),
    addLoan: l => useGame.getState().addLoan(l),
    updateLoans: l => useGame.getState().updateLoans(l),
    setCashflow: (i, e) => useGame.getState().setCashflow(i, e),
    report: () => {},
    finishStory: card => useGame.getState().finishGame(card),
  }), [g.wallet, g.reserve, g.cibilScore, g.portfolio, g.loans])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

/** Direct Mode: a sandbox that starts from `start` and is thrown away afterwards. */
export function DirectPlayProvider({ start, onReport, children }: { start: Finances; onReport: (r: Report) => void; children: ReactNode }) {
  const [f, setF] = useState<Finances>(start)
  const reportRef = useRef(onReport)
  reportRef.current = onReport
  const api = useMemo<PlayApi>(() => ({
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
    award: () => {}, // Direct Mode never grants story mastery
    setCibil: cibil => setF(p => ({ ...p, cibil })),
    setPortfolio: portfolio => setF(p => ({ ...p, portfolio })),
    addLoan: l => setF(p => ({ ...p, loans: [...p.loans.filter(x => x.id !== l.id), l] })),
    updateLoans: loans => setF(p => ({ ...p, loans })),
    setCashflow: () => {},
    report: r => reportRef.current(r),
    finishStory: card => reportRef.current({ win: card.passed, score: card.overall }),
  }), [f])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
