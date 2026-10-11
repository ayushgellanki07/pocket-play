import { useState } from 'react'
import { Home, Wheat, Wrench, Footprints, Beer, Gem, Play } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { TimerBar, useCountdown } from '../components/ui/Timer.tsx'
import { useT } from '../i18n/useT.ts'
import { inr } from '../lib/finance.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

type Pile = 'none' | 'need' | 'want'
// Card text lives in i18n: sorter.card.<id> (name) and sorter.why.<id> (reason).
interface Card { id: string; cost: number; type: 'need' | 'want'; icon: typeof Home }

// The six expense cards. Needs total ₹11,000 (rent + rations + tools).
export const CARDS: Card[] = [
  { id: 'rent', cost: 6000, type: 'need', icon: Home },
  { id: 'grain', cost: 4000, type: 'need', icon: Wheat },
  { id: 'tools', cost: 1000, type: 'need', icon: Wrench },
  { id: 'boots', cost: 2500, type: 'want', icon: Footprints },
  { id: 'feast', cost: 1200, type: 'want', icon: Beer },
  { id: 'trinket', cost: 900, type: 'want', icon: Gem },
]
const RESERVE = 500, ORDER = 2000, TIME = 60

export default function SurvivalSorter({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const name = (c: Card) => t(`sorter.card.${c.id}`)
  const why = (c: Card) => t(`sorter.why.${c.id}`)
  // Snapshot the wallet when the game opens, so the numbers stay correct after we pay the bills.
  const [budget] = useState(() => play.wallet)
  const [started, setStarted] = useState(false)
  const [pile, setPile] = useState<Record<string, Pile>>(() => Object.fromEntries(CARDS.map(c => [c.id, 'none'])))
  const [buy, setBuy] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string[] | null>(null)
  const [result, setResult] = useState<'win' | 'timeout' | null>(null)
  const timer = useCountdown(TIME, started && !result, () => { setResult('timeout'); audio.sfx('fail'); play.report({ win: false, mistakes: [t('mg.ranOut')] }) })

  // Live totals: every number comes from the cards actually placed.
  const needsTotal = CARDS.filter(c => pile[c.id] === 'need').reduce((s, c) => s + c.cost, 0)
  const wantsTotal = CARDS.filter(c => pile[c.id] === 'want' && buy[c.id]).reduce((s, c) => s + c.cost, 0)
  const spend = needsTotal + wantsTotal
  const left = budget - spend
  const mustKeep = RESERVE + ORDER

  const place = (id: string, p: Pile) => { audio.sfx('click'); setPile(s => ({ ...s, [id]: p })); if (p !== 'want') setBuy(b => ({ ...b, [id]: false })); setError(null) }

  const submit = () => {
    const unsorted = CARDS.filter(c => pile[c.id] === 'none')
    if (unsorted.length) { setError([t('sorter.errUnsorted')]); audio.sfx('warn'); return }
    const wrong = CARDS.filter(c => pile[c.id] !== c.type)
    if (wrong.length) { play.report({ win: false, mistakes: wrong.map(c => t('sorter.mistake', { item: name(c), type: t(`sorter.${c.type}`), why: why(c) })) }); setError([t('sorter.errWrong'), ...wrong.map(c => `• ${name(c)} → ${c.type === 'need' ? t('sorter.needs') : t('sorter.wants')}: ${why(c)}`)]); audio.sfx('warn'); return }
    if (left < mustKeep) { play.report({ win: false, mistakes: [t('sorter.overspent', { left: inr(left), need: inr(mustKeep) })] }); setError([t('sorter.errMoney', { left: inr(left), need: inr(mustKeep) }), `${inr(budget)} − ${inr(spend)} = ${inr(left)} < ${inr(mustKeep)}`]); audio.sfx('warn'); return }
    // All checks passed → pay for real.
    play.commit([
      ...CARDS.filter(c => c.type === 'need').map(c => ({ label: `sorter.card.${c.id}`, amount: -c.cost, account: 'wallet' as const, kind: 'expense' as const })),
      ...CARDS.filter(c => c.type === 'want' && buy[c.id]).map(c => ({ label: `sorter.card.${c.id}`, amount: -c.cost, account: 'wallet' as const, kind: 'expense' as const })),
      { label: 'tx.toReserve', amount: -RESERVE, account: 'wallet', kind: 'transfer' },
      { label: 'tx.reserve', amount: RESERVE, account: 'reserve', kind: 'transfer' },
    ], { text: `−${inr(spend + RESERVE)} · ${t('fx.reserveUp', { amt: inr(RESERVE) })}`, tone: 'saving' })
    play.award('sorter', 'budgeting', 100)
    play.report({ win: true })
    audio.sfx('success')
    setResult('win')
  }

  const reset = () => { setPile(Object.fromEntries(CARDS.map(c => [c.id, 'none']))); setBuy({}); setError(null); setResult(null); timer.reset(); setStarted(true) }

  // A render function (not a nested component) so React keeps focus when cards move.
  const column = (id: Pile, title: string) => (
    <div onDragOver={e => e.preventDefault()} onDrop={e => { const cid = e.dataTransfer.getData('text'); if (cid) place(cid, id) }}
      className={`min-h-40 rounded border-2 border-dashed p-2 ${id === 'need' ? 'border-cyan/50 bg-cyan/5' : id === 'want' ? 'border-gold/50 bg-gold/5' : 'border-white/15'}`} aria-label={title}>
      <div className="mb-2 flex justify-between font-pixel text-sm"><span>{title}</span>
        {id === 'need' && <span>{inr(needsTotal)}</span>}{id === 'want' && <span>{inr(wantsTotal)} ✓</span>}</div>
      <div className="grid gap-2">
        {CARDS.filter(c => pile[c.id] === id).map(c => (
          <div key={c.id} draggable={started && !result} onDragStart={e => e.dataTransfer.setData('text', c.id)}
            className="flex cursor-grab items-center gap-2 rounded-sm border-2 border-black/60 bg-ink-3 p-2 active:cursor-grabbing">
            <c.icon size={20} className="shrink-0 text-gold" aria-hidden />
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold leading-tight">{name(c)}</div><div className="font-mono text-xs">{inr(c.cost)}</div></div>
            {id === 'want' && (
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!buy[c.id]} onChange={e => setBuy(b => ({ ...b, [c.id]: e.target.checked }))} className="h-4 w-4 accent-[var(--accent-2)]" />{t('sorter.buy')}</label>
            )}
            <div className="flex gap-1">
              {id !== 'need' && <button className="btn btn-ghost btn-sm !px-2" onClick={() => place(c.id, 'need')} aria-label={t('sorter.moveTo', { item: name(c), pile: t('sorter.needs') })}>{t('sorter.need')}</button>}
              {id !== 'want' && <button className="btn btn-ghost btn-sm !px-2" onClick={() => place(c.id, 'want')} aria-label={t('sorter.moveTo', { item: name(c), pile: t('sorter.wants') })}>{t('sorter.want')}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <MinigameShell title={t('sorter.title')} help={t('sorter.help')} right={started && <TimerBar left={timer.left} total={TIME} label={t('mg.timer')} />}>
      {!started ? (
        <div className="py-8 text-center"><button className="btn btn-gold text-lg" onClick={() => setStarted(true)} autoFocus><Play size={18} aria-hidden />{t('common.start')}</button></div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {column('none', t('sorter.unsorted'))}
            {column('need', t('sorter.needs'))}
            {column('want', t('sorter.wants'))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded bg-black/30 p-2">{t('sorter.budget')}<br /><b className="font-pixel text-lg">{inr(budget)}</b></div>
            <div className="rounded bg-black/30 p-2">{t('sorter.spend')}<br /><b className="font-pixel text-lg">{inr(spend)}</b></div>
            <div className={`rounded p-2 ${left >= mustKeep ? 'bg-good/15' : 'bg-bad/15'}`}>{t('sorter.left')}<br /><b className="font-pixel text-lg">{inr(left)}</b></div>
            <div className="rounded bg-black/30 p-2">{t('sorter.required')}<br /><b className="font-pixel text-lg">{inr(mustKeep)}</b></div>
          </div>
          {error && <div className="mt-3 rounded border border-warn/60 bg-warn/10 p-3 text-sm" role="alert">{error.map((e, i) => <p key={i}>{e}</p>)}</div>}
          {!result && <div className="mt-4 flex justify-end"><button className="btn btn-gold" onClick={submit}>{t('sorter.lock')}</button></div>}
          {result === 'win' && <div className="mt-4"><ResultPanel win onContinue={onComplete}><p>{t('sorter.win')}</p><p>{t('sorter.winCalc', { budget: inr(budget), spend: inr(spend), reserve: inr(RESERVE), left: inr(left - RESERVE) })}</p></ResultPanel></div>}
          {result === 'timeout' && <div className="mt-4"><ResultPanel win={false} title={t('mg.timeUp')} onRetry={reset}><p>{t('sorter.timeoutHint')}</p></ResultPanel></div>}
        </>
      )}
    </MinigameShell>
  )
}
