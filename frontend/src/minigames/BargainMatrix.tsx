import { useState } from 'react'
import { Calculator, ShoppingCart } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { useT } from '../i18n/useT.ts'
import { inr, unitPrice } from '../lib/finance.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

// Merchant names are translated: bargain.m.<id>
interface Bundle { id: string; qty: number; price: number }
export const BUNDLES: Bundle[] = [
  { id: 'A', qty: 10, price: 900 },
  { id: 'B', qty: 25, price: 2000 },
  { id: 'C', qty: 15, price: 1275 },
]
const best = BUNDLES.reduce((a, b) => (unitPrice(b.price, b.qty) < unitPrice(a.price, a.qty) ? b : a))

export default function BargainMatrix({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [pick, setPick] = useState<Bundle | null>(null)
  const [result, setResult] = useState<'win' | 'wrong' | null>(null)
  const [calc, setCalc] = useState({ price: '', qty: '' })
  const calcOut = Number(calc.qty) > 0 ? unitPrice(Number(calc.price), Number(calc.qty)) : null

  const confirm = () => {
    if (!pick) return
    if (pick.id === best.id) {
      play.commit([{ label: 'tx.lampOil', vars: { qty: pick.qty, merchantKey: `bargain.m.${pick.id}` }, amount: -pick.price, account: 'wallet', kind: 'expense' }])
      play.award('bargain', 'budgeting', 75); play.report({ win: true }); audio.sfx('success'); setResult('win')
    } else { play.report({ win: false, mistakes: [t('bargain.mistake', { id: pick.id, unit: inr(unitPrice(pick.price, pick.qty)) })] }); audio.sfx('fail'); setResult('wrong') }
  }

  return (
    <MinigameShell title={t('bargain.title')} help={t('bargain.help')}>
      <div className="grid gap-3 md:grid-cols-3">
        {BUNDLES.map(b => (
          <article key={b.id} className={`rounded border-2 p-3 ${pick?.id === b.id ? 'border-gold bg-gold/10' : 'border-white/15 bg-black/25'}`}>
            <div className="flex items-center justify-between"><h3 className="font-pixel text-lg">{t('bargain.bundle', { id: b.id })}</h3><span className="text-xs text-parchment/60">{t(`bargain.m.${b.id}`)}</span></div>
            <svg viewBox="0 0 60 22" className="pixel my-2 h-12 w-full" aria-hidden>
              {Array.from({ length: Math.min(b.qty, 25) }, (_, i) => <rect key={i} x={2 + (i % 13) * 4.4} y={i < 13 ? 2 : 12} width="3" height="8" fill="#f5c542" stroke="#7a4c00" strokeWidth=".5" />)}
            </svg>
            <dl className="grid grid-cols-2 gap-1 text-sm">
              <dt className="text-parchment/60">{t('bargain.total')}</dt><dd className="text-right font-mono">{inr(b.price)}</dd>
              <dt className="text-parchment/60">{t('bargain.qty')}</dt><dd className="text-right font-mono">{b.qty}</dd>
              <dt className="text-parchment/60">{t('bargain.unit')}</dt>
              <dd className="text-right font-mono">{revealed[b.id] ? <span className="text-cyan">{inr(unitPrice(b.price, b.qty))}</span> : '?'}</dd>
            </dl>
            {revealed[b.id] && <p className="mt-1 text-right font-mono text-xs text-parchment/70">{inr(b.price)} ÷ {b.qty} = {inr(unitPrice(b.price, b.qty))}</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-ghost btn-sm flex-1" onClick={() => { audio.sfx('click'); setRevealed(r => ({ ...r, [b.id]: true })) }}><Calculator size={14} aria-hidden />{t('bargain.calc')}</button>
              <button className="btn btn-sm flex-1" disabled={result === 'win'} onClick={() => { setPick(b); setResult(null); setRevealed(r => ({ ...r, [b.id]: true })) }}><ShoppingCart size={14} aria-hidden />{t('bargain.buy')}</button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-white/10 bg-black/25 p-3">
          <h3 className="mb-2 flex items-center gap-2 font-pixel text-sm text-cyan"><Calculator size={16} aria-hidden />{t('bargain.calculator')}</h3>
          <div className="flex items-center gap-2 text-sm">
            <input aria-label={t('bargain.total')} inputMode="decimal" value={calc.price} onChange={e => setCalc(c => ({ ...c, price: e.target.value.replace(/[^\d.]/g, '') }))} placeholder={t('bargain.phTotal')} className="w-24 rounded-sm border border-white/20 bg-black/40 px-2 py-1" />
            ÷
            <input aria-label={t('bargain.qty')} inputMode="numeric" value={calc.qty} onChange={e => setCalc(c => ({ ...c, qty: e.target.value.replace(/\D/g, '') }))} placeholder={t('bargain.phQty')} className="w-16 rounded-sm border border-white/20 bg-black/40 px-2 py-1" />
            = <b className="font-mono text-cyan">{calcOut !== null && Number.isFinite(calcOut) ? inr(calcOut, true) : '—'}</b>
          </div>
        </div>
        {pick && result !== 'win' && (
          <div className="rounded border-2 border-gold/60 bg-gold/10 p-3" role="alertdialog" aria-label={t('bargain.confirmQ')}>
            <p className="font-pixel">{t('bargain.confirmQ')}</p>
            <p className="mt-1 font-mono text-sm">{t('bargain.bundle', { id: pick.id })}: {inr(pick.price)} ÷ {pick.qty} = <b>{inr(unitPrice(pick.price, pick.qty))}</b> {t('bargain.perUnit')}</p>
            <div className="mt-2 flex gap-2"><button className="btn btn-gold btn-sm" onClick={confirm}>{t('common.confirm')}</button><button className="btn btn-ghost btn-sm" onClick={() => setPick(null)}>{t('common.cancel')}</button></div>
          </div>
        )}
      </div>

      {result === 'wrong' && (
        <div className="mt-4"><ResultPanel win={false} onRetry={() => { setPick(null); setResult(null) }}>
          <p>{t('bargain.wrong')}</p>
          <ul className="font-mono text-sm">{BUNDLES.map(b => <li key={b.id}>{b.id}: {inr(b.price)} ÷ {b.qty} = {inr(unitPrice(b.price, b.qty))}{b.id === best.id ? ` ${t('bargain.cheapest')}` : ''}</li>)}</ul>
        </ResultPanel></div>
      )}
      {result === 'win' && (
        <div className="mt-4"><ResultPanel win onContinue={onComplete}>
          <p>{t('bargain.winText')}</p>
        </ResultPanel></div>
      )}
    </MinigameShell>
  )
}
