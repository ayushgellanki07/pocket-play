import { useState } from 'react'
import { Landmark, CalendarClock, Lock, Check, X } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { useT } from '../i18n/useT.ts'
import { fdMaturity, inr, rdMaturity } from '../lib/finance.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

type Acc = 'savings' | 'rd' | 'fd'
// Illustrative game rates only.
// Names and descriptions are translated: deposit.acc.<id>, deposit.access.<id>, deposit.goal/why/hint.<id>.
const ACCOUNTS: { id: Acc; rate: number; icon: typeof Landmark }[] = [
  { id: 'savings', rate: 0.03, icon: Landmark },
  { id: 'rd', rate: 0.065, icon: CalendarClock },
  { id: 'fd', rate: 0.07, icon: Lock },
]
const GOALS: { id: string; answer: Acc; amt: number }[] = [
  { id: 'g1', answer: 'savings', amt: 10000 * 0.03 },
  { id: 'g2', answer: 'rd', amt: rdMaturity(2000, 0.065, 12) },
  { id: 'g3', answer: 'fd', amt: fdMaturity(50000, 0.07, 2) },
]

export default function DepositMatchmaker({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const why = (g: typeof GOALS[number]) => t(`deposit.why.${g.id}`, { amt: inr(g.amt) })
  const [sel, setSel] = useState<string | null>(null)
  const [match, setMatch] = useState<Record<string, Acc>>({})
  const [checked, setChecked] = useState(false)
  const wrong = GOALS.filter(g => match[g.id] && match[g.id] !== g.answer)
  const allDone = GOALS.every(g => match[g.id])
  const win = checked && allDone && wrong.length === 0

  const assign = (acc: Acc) => { if (!sel) return; audio.sfx('click'); setMatch(m => ({ ...m, [sel]: acc })); setChecked(false); setSel(null) }
  const check = () => {
    setChecked(true)
    if (GOALS.every(g => match[g.id] === g.answer)) { play.award('deposit', 'banking', 100); play.report({ win: true }); audio.sfx('success') }
    else { play.report({ win: false, mistakes: GOALS.filter(g => match[g.id] !== g.answer).map(why) }); audio.sfx('warn') }
  }

  return (
    <MinigameShell title={t('deposit.title')} help={t('deposit.help')}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          {GOALS.map(g => {
            const acc = ACCOUNTS.find(a => a.id === match[g.id])
            const ok = checked && match[g.id] === g.answer
            const bad = checked && match[g.id] && match[g.id] !== g.answer
            return (
              <button key={g.id} onClick={() => { audio.sfx('click'); setSel(g.id) }} aria-pressed={sel === g.id}
                onDragOver={e => e.preventDefault()} onDrop={e => { const a = e.dataTransfer.getData('text') as Acc; if (a) { setMatch(m => ({ ...m, [g.id]: a })); setChecked(false) } }}
                className={`block w-full rounded border-2 p-3 text-left text-sm transition-colors ${sel === g.id ? 'border-gold bg-gold/10' : ok ? 'border-good bg-good/10' : bad ? 'border-bad bg-bad/10' : 'border-white/15 bg-black/25 hover:bg-white/5'}`}>
                <p>{t(`deposit.goal.${g.id}`)}</p>
                <p className="mt-2 flex items-center gap-1 font-pixel text-xs">→ {acc ? t(`deposit.acc.${acc.id}`) : '…'} {ok && <Check size={14} className="text-good" />} {bad && <X size={14} className="text-bad" />}</p>
                {checked && (ok || bad) && <p className="mt-1 text-xs text-parchment/75">{ok ? why(g) : t(`deposit.hint.${g.id}`)}</p>}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {ACCOUNTS.map(a => (
            <button key={a.id} draggable onDragStart={e => e.dataTransfer.setData('text', a.id)} onClick={() => assign(a.id)} disabled={!sel}
              className="flex w-full items-start gap-3 rounded border-2 border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3 text-left enabled:hover:bg-[var(--accent)]/15 disabled:opacity-70">
              <a.icon className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden />
              <span><b className="font-pixel">{t(`deposit.acc.${a.id}`)}</b> <span className="text-[var(--accent-2)]">· {(a.rate * 100).toFixed(1)}%*</span><br /><span className="text-xs text-parchment/70">{t(`deposit.access.${a.id}`)}</span></span>
            </button>
          ))}
          <p className="text-xs text-parchment/60">* {t('common.illustrative')}</p>
          <button className="btn btn-gold w-full" disabled={!allDone} onClick={check}>{t('deposit.check')}</button>
        </div>
      </div>
      {checked && !win && <p className="mt-3 text-warn" role="alert">{t('deposit.someWrong', { n: wrong.length })}</p>}
      {win && <div className="mt-4"><ResultPanel win onContinue={onComplete}><p>{t('deposit.allRight')} {t('deposit.tradeoff')}</p></ResultPanel></div>}
    </MinigameShell>
  )
}
