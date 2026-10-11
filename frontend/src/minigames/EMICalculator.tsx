import { useMemo, useState } from 'react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { LineChart } from '../components/ui/LineChart.tsx'
import { amortize, emi, inr, inrCompact } from '../lib/finance.ts'
import { useT } from '../i18n/useT.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'
import { QuizBlock, type Q } from './Quiz.tsx'

// Challenge scenario (illustrative): ₹2,00,000 at 10.5% p.a., income ₹30,000/month, EMI cap 30%.
const P = 200000, RATE = 0.105, INCOME = 30000, CAP = INCOME * 0.3
const TENURES = [12, 24, 36, 48]
const rows = TENURES.map(n => { const e = emi(P, RATE / 12, n); return { n, emi: e, interest: e * n - P } })
const best = rows.filter(r => r.emi <= CAP).sort((a, b) => a.interest - b.interest)[0]

export default function EMICalculator({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const [p, setP] = useState(100000)
  const [r, setR] = useState(12)
  const [n, setN] = useState(24)
  const [ans, setAns] = useState<Record<number, number>>({})
  const [wrong, setWrong] = useState<Set<number>>(new Set())
  const [shown, setShown] = useState(false)
  const m = emi(p, r / 1200, n)
  const sched = useMemo(() => amortize(p, r / 1200, n), [p, r, n])

  const QS: Q[] = [
    { q: t('emicalc.q1', { cap: inr(CAP), income: inr(INCOME) }), opts: TENURES.map(x => t('emicalc.months', { n: x })), a: TENURES.indexOf(best.n),
      why: rows.map(x => t('emicalc.row', { n: x.n, emi: inr(x.emi), high: x.emi > CAP ? t('emicalc.tooHigh') : '', interest: inr(x.interest) })).join(' · ') },
    { q: t('emicalc.q2'), opts: [t('emicalc.q2a'), t('emicalc.q2b'), t('emicalc.q2c')], a: 1,
      why: t('emicalc.q2why') },
  ]
  const answer = (i: number, o: number) => {
    setAns(a => ({ ...a, [i]: o }))
    if (o !== QS[i].a) { setWrong(w => new Set(w).add(i)); play.report({ win: false, mistakes: [`${QS[i].q} → ${QS[i].why}`] }) }
  }
  const done = QS.every((q, i) => ans[i] === q.a)

  return (
    <MinigameShell title={t('emicalc.title')} help={t('emicalc.help')}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded border border-white/10 bg-black/25 p-3 text-sm">
          <label className="block">{t('emicalc.principal')}: <b>{inr(p)}</b><input type="range" min={10000} max={1000000} step={10000} value={p} onChange={e => setP(+e.target.value)} /></label>
          <label className="block">{t('emicalc.rate')}: <b>{r}%</b><input type="range" min={6} max={24} step={0.5} value={r} onChange={e => setR(+e.target.value)} /></label>
          <label className="block">{t('emicalc.tenure')}: <b>{t('emicalc.months', { n })}</b><input type="range" min={6} max={84} step={6} value={n} onChange={e => setN(+e.target.value)} /></label>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-[var(--accent)]/15 p-2"><div className="text-xs">{t('emicalc.emi')}</div><b className="font-pixel text-lg">{inr(m)}</b></div>
            <div className="rounded bg-black/30 p-2"><div className="text-xs">{t('emicalc.totalInterest')}</div><b className="font-pixel text-lg">{inr(m * n - p)}</b></div>
            <div className="rounded bg-black/30 p-2"><div className="text-xs">{t('emicalc.totalPaid')}</div><b className="font-pixel text-lg">{inr(m * n)}</b></div>
          </div>
          <div className="flex h-4 overflow-hidden rounded-sm" aria-label={t('emicalc.split')}>
            <div style={{ width: `${(p / (m * n)) * 100}%` }} className="bg-good" /><div className="flex-1 bg-bad" />
          </div>
          <p className="text-xs"><span className="text-good">■ {t('emicalc.lPrincipal')}</span> · <span className="text-bad">■ {t('emicalc.lInterest')}</span></p>
          <p className="font-mono text-xs text-parchment/70">{t('emicalc.formula', { r, rm: (r / 12).toFixed(3) })}</p>
          <LineChart labels={[t('axis.month', { n: 0 }), ...sched.map(s => t('axis.month', { n: s.month }))]} format={inrCompact} height={120}
            series={[{ name: t('emicalc.balance'), values: [p, ...sched.map(s => s.closing)], color: 'var(--accent)' }]} />
        </section>
        <section className="space-y-3">
          <div className="rounded border-2 border-gold/50 bg-gold/5 p-3 text-sm">
            <p className="font-pixel">{t('emicalc.challenge')}</p>
            <p>{t('emicalc.brief', { p: inr(P), income: inr(INCOME) })}</p>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => setShown(true)}>{t('emicalc.calcAll')}</button>
            {shown && <table className="mt-2 w-full font-mono text-xs"><tbody>{rows.map(x => <tr key={x.n} className="border-t border-white/5"><td>{t('emicalc.monthsShort', { n: x.n })}</td><td className={x.emi > CAP ? 'text-bad' : 'text-good'}>{inr(x.emi)}</td><td>{t('emicalc.interestCell', { amt: inr(x.interest) })}</td></tr>)}</tbody></table>}
          </div>
          <QuizBlock qs={QS} ans={ans} onAnswer={answer} />
          {done && <ResultPanel win onContinue={() => { play.report({ win: true, score: Math.max(40, 100 - wrong.size * 25) }); onComplete() }}><p>{t('emicalc.win', { n: best.n, emi: inr(best.emi), interest: inr(best.interest) })}</p></ResultPanel>}
        </section>
      </div>
    </MinigameShell>
  )
}
