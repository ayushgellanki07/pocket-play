import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { inr } from '../lib/finance.ts'
import { useT } from '../i18n/useT.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'
import { QuizBlock, type Q } from './Quiz.tsx'

// Item names are translated: ef.item.<label>.
const ITEMS = [
  { label: 'rent', amt: 9000, essential: true }, { label: 'groceries', amt: 6000, essential: true },
  { label: 'transport', amt: 2000, essential: true }, { label: 'utilities', amt: 1500, essential: true },
  { label: 'emi', amt: 3000, essential: true }, { label: 'phone', amt: 700, essential: true },
  { label: 'streaming', amt: 800, essential: false }, { label: 'eatingOut', amt: 2500, essential: false },
  { label: 'clothes', amt: 1500, essential: false },
]
const ESSENTIAL = ITEMS.filter(i => i.essential).reduce((s, i) => s + i.amt, 0)

export default function EmergencyFundChallenge({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const item = (k: string) => t(`ef.item.${k}`)
  const [pick, setPick] = useState<Record<string, boolean>>({})
  const [checked, setChecked] = useState(false)
  const [months, setMonths] = useState(1)
  const [ans, setAns] = useState<Record<number, number>>({})
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const total = ITEMS.filter(i => pick[i.label]).reduce((s, i) => s + i.amt, 0)
  const listOk = ITEMS.every(i => !!pick[i.label] === i.essential)
  const monthsOk = months >= 3 && months <= 6
  const QS: Q[] = [
    { q: t('ef.q0'), opts: t('ef.q0o').split('|'), a: 1, why: t('ef.q0why') },
    { q: t('ef.q1'), opts: t('ef.q1o').split('|'), a: 1, why: t('ef.q1why') },
  ]
  const checkList = () => {
    setChecked(true)
    if (!listOk) {
      const bad = ITEMS.filter(i => !!pick[i.label] !== i.essential).map(i => t(i.essential ? 'ef.isEssential' : 'ef.isOptional', { item: item(i.label) }))
      bad.forEach(b => setWrong(w => new Set(w).add(b)))
      play.report({ win: false, mistakes: bad }); audio.sfx('warn')
    } else audio.sfx('success')
  }
  const answer = (i: number, o: number) => {
    setAns(a => ({ ...a, [i]: o }))
    if (o !== QS[i].a) { setWrong(w => new Set(w).add(`q${i}`)); play.report({ win: false, mistakes: [QS[i].why] }) }
  }
  const done = listOk && checked && monthsOk && QS.every((q, i) => ans[i] === q.a)

  return (
    <MinigameShell title={t('ef.title')} help={t('ef.help')}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="rounded border border-white/10 bg-black/25 p-3">
            <p className="mb-2 font-pixel text-sm">{t('ef.step1')}</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {ITEMS.map(i => (
                <li key={i.label}><label className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-2 py-1 text-sm ${pick[i.label] ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10'}`}>
                  <span className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={!!pick[i.label]} onChange={e => { setPick(p => ({ ...p, [i.label]: e.target.checked })); setChecked(false) }} />{item(i.label)}</span>
                  <span className="font-mono text-xs">{inr(i.amt)}</span></label></li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between text-sm"><span>{t('ef.ticked', { amt: inr(total) })}</span><button className="btn btn-sm" onClick={checkList}>{t('ef.checkList')}</button></div>
            {checked && <p className={`mt-1 text-xs ${listOk ? 'text-good' : 'text-warn'}`}>{listOk ? t('ef.listOk', { amt: inr(ESSENTIAL) }) : t('ef.listBad')}</p>}
          </div>
          {listOk && checked && (
            <div className="rounded border border-white/10 bg-black/25 p-3 text-sm">
              <p className="mb-1 font-pixel text-sm">{t('ef.step2')}</p>
              <input type="range" min={1} max={12} value={months} onChange={e => setMonths(+e.target.value)} aria-label={t('ef.monthsAria')} />
              <p>{t('ef.monthsCalc', { n: months, amt: inr(ESSENTIAL) })} <b className="font-pixel text-lg">{inr(months * ESSENTIAL)}</b></p>
              <p className={`text-xs ${monthsOk ? 'text-good' : 'text-warn'}`}>{monthsOk ? t('ef.mOk') : months < 3 ? t('ef.mLow') : t('ef.mHigh')}</p>
            </div>
          )}
        </section>
        <section className="space-y-3">
          {listOk && checked && monthsOk ? <QuizBlock qs={QS} ans={ans} onAnswer={answer} /> : <p className="flex items-center gap-2 rounded border border-white/10 bg-black/25 p-3 text-sm text-parchment/70"><ShieldCheck size={18} aria-hidden />{t('ef.locked')}</p>}
          {done && <ResultPanel win onContinue={() => { play.report({ win: true, score: Math.max(40, 100 - wrong.size * 15) }); onComplete() }}><p>{t('ef.win', { n: months, amt: inr(ESSENTIAL), total: inr(months * ESSENTIAL) })}</p></ResultPanel>}
        </section>
      </div>
    </MinigameShell>
  )
}
