import { useEffect, useState } from 'react'
import { BookOpen, Sigma } from 'lucide-react'
import { LEARNING } from '../data/learning.ts'
import { useGame } from '../store/gameStore.ts'
import { useT } from '../i18n/useT.ts'
import { effectiveAnnual, inr, nominalAnnual, pct, split503020 } from '../lib/finance.ts'
import { Modal } from './ui/Modal.tsx'
import { audio } from '../lib/audio.ts'
import { dialogueRules } from '../lib/dialoguePolicy.ts'

/** Interactive extra for the budgeting card: slide an income and watch the 50/30/20 split. */
export function BudgetSlider() {
  const t = useT()
  const [income, setIncome] = useState(15000)
  const s = split503020(income)
  const rows = [
    { k: t('lx.needs'), v: s.needs, c: '#3ee6f0' },
    { k: t('lx.wants'), v: s.wants, c: '#f5c542' },
    { k: t('lx.savings'), v: s.savings, c: '#52e08a' },
  ]
  return (
    <div className="mt-4 rounded border border-white/10 bg-black/25 p-3">
      <label className="flex items-center justify-between text-sm">{t('lx.income')} <b className="font-pixel text-lg">{inr(income)}</b></label>
      <input type="range" min={5000} max={60000} step={1000} value={income} onChange={e => setIncome(+e.target.value)} aria-label={t('lx.income')} />
      <div className="mt-2 flex h-6 overflow-hidden rounded-sm" aria-hidden>
        {rows.map(r => <div key={r.k} style={{ width: `${(r.v / income) * 100}%`, background: r.c }} />)}
      </div>
      <ul className="mt-2 grid grid-cols-3 gap-2 text-xs sm:text-sm">
        {rows.map(r => <li key={r.k}><span style={{ color: r.c }}>■</span> {r.k}<br /><b>{inr(r.v)}</b></li>)}
      </ul>
    </div>
  )
}

/** Inflation extra: see what ₹1,00,000 buys after N years at a chosen inflation rate. */
export function InflationSlider() {
  const t = useT()
  const [rate, setRate] = useState(6)
  const [years, setYears] = useState(10)
  const value = 100000 / Math.pow(1 + rate / 100, years)
  return (
    <div className="mt-4 rounded border border-white/10 bg-black/25 p-3 text-sm">
      <label className="flex justify-between">{t('lx.inflation')} <b>{rate}%</b></label>
      <input type="range" min={1} max={12} value={rate} onChange={e => setRate(+e.target.value)} aria-label={t('lx.inflation')} />
      <label className="flex justify-between">{t('lx.years')} <b>{years}</b></label>
      <input type="range" min={1} max={30} value={years} onChange={e => setYears(+e.target.value)} aria-label={t('lx.years')} />
      <p className="mt-2">{t('lx.inflResult', { now: inr(100000), later: inr(value), years, drop: ((1 - value / 100000) * 100).toFixed(0) })}</p>
    </div>
  )
}

/** Interest extra: slide a monthly rate and compare the nominal and effective yearly rate. */
export function EarSlider() {
  const t = useT()
  const [m, setM] = useState(5)
  return (
    <div className="mt-4 rounded border border-white/10 bg-black/25 p-3 text-sm">
      <label className="flex justify-between">{t('lx.monthly')} <b>{m}%</b></label>
      <input type="range" min={0.5} max={10} step={0.5} value={m} onChange={e => setM(+e.target.value)} aria-label={t('lx.monthly')} />
      <p>{t('lx.nominal')}: {m}% × 12 = <b>{pct(nominalAnnual(m / 100))}</b> · {t('lx.effective')}: (1 + {m / 100})¹² − 1 = <b className="text-[var(--accent-2)]">{pct(effectiveAnnual(m / 100))}</b></p>
      <p className="mt-1 text-xs text-parchment/70">{t('lx.unpaid', { amt: inr(10000), total: inr(10000 * (1 + effectiveAnnual(m / 100))) })}</p>
    </div>
  )
}

/** The interactive extra shown with a learning card (used by both modes). */
export function LearningExtra({ id }: { id: string }) {
  if (id === 'budget') return <BudgetSlider />
  if (id === 'inflation' || id === 'shields') return <InflationSlider />
  if (id === 'interest') return <EarSlider />
  return null
}

export function LearningWidget({ id, onDone }: { id: string; onDone: () => void }) {
  const t = useT()
  const lang = useGame(s => s.language)
  const complete = useGame(s => s.completeLearning)
  const playthroughs = useGame(s => s.profile.storyPlaythroughsCompleted)
  // First story playthrough: the card must stay open a few seconds before "Got it" unlocks.
  const [minRead] = useState(() => dialogueRules({ mode: 'story', playthroughs, seen: false, mandatory: true }).learningMinReadMs)
  const [wait, setWait] = useState(Math.ceil(minRead / 1000))
  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])
  const card = LEARNING[lang][id] ?? LEARNING.en[id]
  if (!card) return null
  const finish = () => { audio.sfx('success'); complete(id); onDone() }
  return (
    <Modal title={card.title} labelClose={t('common.close')}>
      <div className="flex items-start gap-3">
        <BookOpen className="mt-1 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <ul className="space-y-2 text-sm leading-relaxed sm:text-base">
          {card.points.map((p, i) => <li key={i} className="border-l-2 border-[var(--accent)]/50 pl-3">{p}</li>)}
        </ul>
      </div>
      {card.formula && (
        <div className="mt-4 flex items-center gap-2 rounded border border-[var(--accent-2)]/40 bg-[var(--accent-2)]/10 p-3 font-mono text-sm">
          <Sigma size={18} className="shrink-0 text-[var(--accent-2)]" aria-hidden />{card.formula}
        </div>
      )}
      {card.example && <p className="mt-2 text-sm text-parchment/75">→ {card.example}</p>}
      <LearningExtra id={id} />
      <div className="mt-5 flex justify-end"><button className="btn" onClick={finish} disabled={wait > 0} autoFocus data-testid="learn-got-it">{wait > 0 ? t('learn.readFirst', { n: wait }) : t('learn.gotIt')}</button></div>
    </Modal>
  )
}
