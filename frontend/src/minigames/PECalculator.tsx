import { useState } from 'react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { eps, inr, peRatio } from '../lib/finance.ts'
import { useT } from '../i18n/useT.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'
import { QuizBlock, type Q } from './Quiz.tsx'

// Fictional companies (₹ crore for profit; crore shares). Names: pecalc.co.<id>.
const CO = [
  { id: 0, price: 180, profit: 90, shares: 10 },
  { id: 1, price: 300, profit: 150, shares: 6 },
  { id: 2, price: 520, profit: -40, shares: 4 },
]

export default function PECalculator({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const coName = (c: { id: number }) => t(`pecalc.co.${c.id}`)
  const [price, setPrice] = useState('240'), [profit, setProfit] = useState('120'), [shares, setShares] = useState('8')
  const [ans, setAns] = useState<Record<number, number>>({})
  const [wrong, setWrong] = useState<Set<number>>(new Set())
  const e = Number(shares) > 0 ? eps(Number(profit), Number(shares)) : NaN
  const pe = Number.isFinite(e) ? peRatio(Number(price), e) : null
  const stats = CO.map(c => ({ ...c, eps: eps(c.profit, c.shares), pe: peRatio(c.price, eps(c.profit, c.shares)) }))
  const QS: Q[] = [
    { q: t('pecalc.q1'), opts: CO.map(coName), a: 1, why: stats.map(s => `${coName(s)}: ${s.pe === null ? t('pecalc.na') : s.pe.toFixed(0)}`).join(' · ') },
    { q: t('pecalc.q2'), opts: CO.map(coName), a: 2, why: t('pecalc.why2') },
    { q: t('pecalc.q3'), opts: ['9', '20', '2'], a: 1, why: t('pecalc.why3') },
  ]
  const answer = (i: number, o: number) => {
    setAns(a => ({ ...a, [i]: o }))
    if (o !== QS[i].a) { setWrong(w => new Set(w).add(i)); play.report({ win: false, mistakes: [`${QS[i].q} → ${QS[i].why}`] }) }
  }
  const done = QS.every((q, i) => ans[i] === q.a)
  const field = (label: string, v: string, set: (s: string) => void, id: string) => (
    <label htmlFor={id} className="flex items-center justify-between gap-2">{label}
      <input id={id} inputMode="decimal" value={v} onChange={ev => set(ev.target.value.replace(/[^\d.-]/g, ''))} className="w-28 rounded-sm border border-white/20 bg-black/40 px-2 py-1 text-right font-mono" /></label>
  )
  return (
    <MinigameShell title={t('pecalc.title')} help={t('pecalc.help')}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2 rounded border border-white/10 bg-black/25 p-3 text-sm">
          {field(t('pecalc.price'), price, setPrice, 'pe-price')}
          {field(t('pecalc.profit'), profit, setProfit, 'pe-profit')}
          {field(t('pecalc.shares'), shares, setShares, 'pe-shares')}
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded bg-black/30 p-2"><div className="text-xs">{t('pecalc.epsF')}</div><b className="font-pixel text-lg">{Number.isFinite(e) ? inr(e, true) : '—'}</b></div>
            <div className="rounded bg-[var(--accent)]/15 p-2"><div className="text-xs">{t('pecalc.peF')}</div><b className="font-pixel text-lg">{pe === null ? (Number.isFinite(e) ? t('pecalc.loss') : '—') : pe.toFixed(1)}</b></div>
          </div>
          <table className="mt-3 w-full text-xs">
            <thead className="text-parchment/60"><tr><th className="text-left">{t('pecalc.colCo')}</th><th>{t('pecalc.colPrice')}</th><th>{t('pecalc.colProfit')}</th><th>{t('pecalc.colShares')}</th></tr></thead>
            <tbody>{CO.map(c => <tr key={c.id} className="border-t border-white/5"><td className="py-1">{coName(c)}</td><td className="text-center font-mono">{inr(c.price)}</td><td className={`text-center font-mono ${c.profit < 0 ? 'text-bad' : ''}`}>{t('unit.cr', { n: c.profit })}</td><td className="text-center font-mono">{t('unit.cr', { n: c.shares })}</td></tr>)}</tbody>
          </table>
          <p className="text-xs text-parchment/60">{t('pecalc.tip')}</p>
        </section>
        <section className="space-y-3">
          <QuizBlock qs={QS} ans={ans} onAnswer={answer} />
          {done && <ResultPanel win onContinue={() => { play.report({ win: true, score: Math.max(40, 100 - wrong.size * 20) }); onComplete() }}><p>{t('pecalc.win')}</p></ResultPanel>}
        </section>
      </div>
    </MinigameShell>
  )
}
