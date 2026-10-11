import { useState } from 'react'
import { FileSearch, TrendingDown, TrendingUp } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { useT } from '../i18n/useT.ts'
import { eps, inr, peRatio } from '../lib/finance.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

// Fictional educational companies (names/risk text: value.co.<id>, value.risk<id>). Money values in ₹ crore; shares in crore.
export const COMPANIES = [
  { id: 'A', price: 450, revenue: 200, profit: -30, shares: 5, icon: TrendingDown, color: '#ff5d6c' },
  { id: 'B', price: 240, revenue: 800, profit: 120, shares: 8, icon: TrendingUp, color: '#52e08a' },
] as const

export default function ValueDetective({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<Record<string, number>>({}) // 0 none, 1 EPS shown, 2 P/E shown
  const [result, setResult] = useState<'win' | 'wrong' | null>(null)
  const ready = COMPANIES.every(c => (step[c.id] ?? 0) >= 2)

  const pick = (id: string) => {
    if (id === 'B') { play.award('value', 'investing', 150); play.report({ win: true }); audio.sfx('success'); setResult('win') }
    else { play.report({ win: false, mistakes: [t('value.mistake')] }); audio.sfx('fail'); setResult('wrong') }
  }

  return (
    <MinigameShell title={t('value.title')} help={t('value.help')}>
      <div className="grid gap-4 md:grid-cols-2">
        {COMPANIES.map(c => {
          const e = eps(c.profit, c.shares)
          const pe = peRatio(c.price, e)
          const s = step[c.id] ?? 0
          return (
            <article key={c.id} className="rounded border-2 border-[var(--accent-2)]/40 bg-[#2a2010]/60 p-4">
              <header className="flex items-center gap-2">
                <c.icon style={{ color: c.color }} aria-hidden />
                <h3 className="font-pixel text-lg">{t('value.company', { id: c.id, name: t(`value.co.${c.id}`) })}</h3>
              </header>
              {!open[c.id] ? (
                <button className="btn btn-ghost mt-3 w-full" onClick={() => { audio.sfx('click'); setOpen(o => ({ ...o, [c.id]: true })) }}><FileSearch size={16} aria-hidden />{t('value.open')}</button>
              ) : (
                <>
                  <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
                    <dt className="text-parchment/60">{t('value.price')}</dt><dd className="text-right font-mono">{inr(c.price)}</dd>
                    <dt className="text-parchment/60">{t('value.revenue')}</dt><dd className="text-right font-mono">{t('unit.rsCr', { n: c.revenue })}</dd>
                    <dt className="text-parchment/60">{t('value.profit')}</dt><dd className={`text-right font-mono ${c.profit < 0 ? 'text-bad' : 'text-good'}`}>{c.profit < 0 ? '−' : ''}{t('unit.rsCr', { n: Math.abs(c.profit) })}</dd>
                    <dt className="text-parchment/60">{t('value.shares')}</dt><dd className="text-right font-mono">{t('unit.cr', { n: c.shares })}</dd>
                    <dt className="text-parchment/60">{t('value.eps')}</dt><dd className="text-right font-mono">{s >= 1 ? inr(e) : '?'}</dd>
                    <dt className="text-parchment/60">{t('value.pe')}</dt><dd className="text-right font-mono">{s >= 2 ? (pe === null ? t('value.na') : pe.toFixed(1)) : '?'}</dd>
                    <dt className="text-parchment/60">{t('value.risk')}</dt><dd className="text-right text-xs" style={{ color: c.color }}>{t(`value.risk${c.id}`)}</dd>
                  </dl>
                  {s >= 1 && <p className="mt-2 rounded bg-black/30 p-2 font-mono text-xs">{t('value.epsCalc', { profit: c.profit, shares: c.shares, eps: inr(e) })}</p>}
                  {s >= 2 && <p className="mt-1 rounded bg-black/30 p-2 font-mono text-xs">{pe === null ? t('value.peNeg', { price: inr(c.price) }) : t('value.peCalc', { price: inr(c.price), eps: inr(e), pe: pe.toFixed(1), per: pe.toFixed(0) })}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s < 2 && <button className="btn btn-sm" onClick={() => { audio.sfx('click'); setStep(st => ({ ...st, [c.id]: s + 1 })) }}>{t('value.computeX', { x: s === 0 ? 'EPS' : 'P/E' })}</button>}
                    {ready && !result && <button className="btn btn-gold btn-sm" onClick={() => pick(c.id)}>{t('value.pick')}</button>}
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-parchment/60">{t('value.note')}</p>
      {result === 'wrong' && (
        <div className="mt-4"><ResultPanel win={false} onRetry={() => setResult(null)}>
          <p>{t('value.wrong1')}</p>
          <p>{t('value.wrong2')}</p>
        </ResultPanel></div>
      )}
      {result === 'win' && (
        <div className="mt-4"><ResultPanel win onContinue={onComplete}>
          <p>{t('value.win1')}</p>
          <p className="text-sm">{t('value.win2')}</p>
        </ResultPanel></div>
      )}
    </MinigameShell>
  )
}
