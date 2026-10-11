import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartPulse, ShieldAlert, Sparkles, TrendingDown, Flame, Target, Siren, Home } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { LineChart } from '../components/ui/LineChart.tsx'
import { MasteryScorecard } from '../components/MasteryScorecard.tsx'
import { keyText, useT } from '../i18n/useT.ts'
import { inr, inrCompact } from '../lib/finance.ts'
import { TRIAL, TRIAL_EVENTS, efTarget, trialInit, trialNetWorth, trialScore, trialYear, type Allocation, type Lifestyle, type Style, type TrialState, type YearChoices } from '../lib/sims.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'
import type { ScoreCard } from '../types.ts'

const ICONS = { temptation: Sparkles, scam: ShieldAlert, shock: HeartPulse, market: TrendingDown, inflation: Flame, goal: Target }

function Radio<T extends string>({ name, value, options, onChange, label }: { name: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs uppercase tracking-wider text-parchment/60">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <label key={o.v} className={`cursor-pointer rounded-sm border-2 px-2 py-1 text-xs sm:text-sm ${value === o.v ? 'border-[var(--accent)] bg-[var(--accent)]/20' : 'border-white/15 bg-black/30 hover:bg-white/5'}`}>
            <input type="radio" name={name} className="sr-only" checked={value === o.v} onChange={() => onChange(o.v)} />{o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function MasterSovereignTrial({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const loan = play.loans.find(l => l.id === 'equipment')
  // Starting point = the player's real finances from the first four worlds.
  const fresh = () => trialInit(play.wallet + play.reserve, play.portfolio.etf + play.portfolio.stock + play.portfolio.gold + play.portfolio.cash, loan?.emi ?? 0, loan?.months ?? 0)
  const [s, setS] = useState<TrialState>(fresh)
  const [c, setC] = useState<YearChoices>({ lifestyle: 'balanced', allocation: 'emergency-first', style: 'diversified', insured: true })
  const [pick, setPick] = useState<boolean | null>(null)
  const [card, setCard] = useState<ScoreCard | null>(null)
  const [leaving, setLeaving] = useState(false)

  const year = s.year + 1
  const ev = TRIAL_EVENTS.find(e => e.year === year)
  const needsPick = ev?.hasChoice
  const lastLog = useMemo(() => s.log.filter(l => l.year === s.year), [s])
  const nw = trialNetWorth(s)

  const live = () => {
    const next = trialYear(s, c, needsPick ? !!pick : false)
    const delta = trialNetWorth(next) - nw
    audio.sfx(delta >= 0 ? 'coin' : 'warn')
    setS(next); setPick(null)
    if (next.year === 10) {
      const sc = trialScore(next)
      setCard(sc)
      audio.sfx(sc.passed ? 'victory' : 'fail')
      if (sc.passed) play.award('trial', 'resilience', 300)
    }
  }
  const retry = () => { setS(fresh()); setCard(null); setPick(null) }
  const goHome = () => {
    if (!card) return
    if (play.mode === 'direct') { play.finishStory(card); onComplete(); return } // practice run: straight to results
    setLeaving(true); audio.sfx('portal')
    setTimeout(() => play.finishStory(card), 1700) // fade to white, then the classroom
  }

  return (
    <MinigameShell title={t('trial.title')} help={t('trial.help')} right={<span className="font-pixel text-[var(--accent-2)]">{t('trial.year', { y: Math.min(year, 10) })}</span>}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* dashboard */}
        <section className="space-y-3" aria-label={t('trial.dashboard')}>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="col-span-2 rounded bg-black/35 p-2 sm:col-span-1"><div className="text-xs text-parchment/60">{t('trial.netWorth')}</div><b className={`font-pixel text-xl ${nw < 0 ? 'text-bad' : ''}`}>{inr(nw)}</b><div className="text-xs text-parchment/60">{t('trial.real')}: {inr(nw / s.priceIndex)}</div></div>
            <div className="rounded bg-black/35 p-2"><div className="text-xs text-parchment/60">{t('trial.cash')}</div><b className="font-mono">{inr(s.cash)}</b></div>
            <div className="rounded bg-black/35 p-2"><div className="text-xs text-parchment/60">{t('trial.invested')}</div><b className="font-mono">{inr(s.div + s.hot)}</b></div>
            <div className="rounded bg-black/35 p-2"><div className="text-xs text-parchment/60">{t('trial.debt')}</div><b className={`font-mono ${s.debt > 0 || s.vanityLeft > 0 ? 'text-bad' : ''}`}>{inr(s.debt)}{s.vanityLeft > 0 ? ` +EMI×${s.vanityLeft}` : ''}</b></div>
            <div className="col-span-2 rounded bg-black/35 p-2">
              <div className="flex justify-between text-xs text-parchment/60"><span>{t('trial.ef')}</span><span>{t('trial.efTarget')}: {inr(efTarget(s))}</span></div>
              <b className="font-mono">{inr(s.ef)}</b>
              <div className="mt-1 h-2 overflow-hidden rounded-sm bg-black/40"><div className="h-full bg-good transition-all" style={{ width: `${Math.min(100, (s.ef / efTarget(s)) * 100)}%` }} /></div>
            </div>
          </div>
          <div className="rounded bg-black/25 p-2">
            <LineChart labels={s.history.map(h => t('axis.year', { n: h.year }))} format={inrCompact} target={{ value: TRIAL.goal, label: t('trial.goalLabel', { amt: inrCompact(TRIAL.goal) }) }}
              series={[{ name: t('trial.netWorth'), values: s.history.map(h => h.netWorth), color: 'var(--accent)' }, { name: t('trial.real'), values: s.history.map(h => h.real), color: 'var(--accent-2)', dashed: true }]} />
            <p className="text-xs"><span className="text-[var(--accent)]">━ {t('trial.netWorth')}</span> · <span className="text-[var(--accent-2)]">┅ {t('trial.real')}</span> · {t('trial.salaryLine', { salary: inr(s.salary), ess: inr(s.essentials) })}</p>
          </div>
          {s.year > 0 && (
            <div className="scroll-thin max-h-44 overflow-y-auto rounded border border-white/10 bg-black/25 p-2 text-xs" aria-live="polite">
              <p className="mb-1 font-pixel text-parchment/70">{t('trial.yearN', { y: s.year })}</p>
              {lastLog.map((l, i) => <div key={i} className="flex justify-between border-t border-white/5 py-0.5"><span>{keyText(t, l.text, l.vars)}</span>{l.amount !== undefined && <span className={`font-mono ${l.amount >= 0 ? 'text-good' : 'text-bad'}`}>{inr(l.amount)}</span>}</div>)}
            </div>
          )}
        </section>

        {/* decisions */}
        <section className="space-y-3">
          {!card && ev && (
            <AnimatePresence mode="wait">
              <motion.div key={year} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <div className="space-y-2 rounded border border-white/10 bg-black/30 p-3">
                  <h3 className="font-pixel">{t('trial.plan')}</h3>
                  <Radio name="life" label={t('trial.lifestyle')} value={c.lifestyle} onChange={(v: Lifestyle) => setC({ ...c, lifestyle: v })}
                    options={(['frugal', 'balanced', 'lavish'] as Lifestyle[]).map(v => ({ v, label: `${t(`life.${v}`)} ${t('trial.perMonth', { amt: inr(TRIAL.lifestyle[v] * s.priceIndex) })}` }))} />
                  <Radio name="alloc" label={t('trial.allocation')} value={c.allocation} onChange={(v: Allocation) => setC({ ...c, allocation: v })}
                    options={(['emergency-first', 'invest-all', 'cash'] as Allocation[]).map(v => ({ v, label: t(`alloc.${v}`) }))} />
                  <Radio name="style" label={t('trial.style')} value={c.style} onChange={(v: Style) => setC({ ...c, style: v })}
                    options={(['diversified', 'hot-stock', 'savings'] as Style[]).map(v => ({ v, label: t(`style.${v}`) }))} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={c.insured} onChange={e => setC({ ...c, insured: e.target.checked })} />{t('trial.insured')}</label>
                </div>
                <div className="rounded border-2 border-[var(--accent-2)]/60 bg-[var(--accent-2)]/10 p-3" role="group" aria-label={t('trial.event')}>
                  {(() => { const Icon = ICONS[ev.kind]; return <p className="flex items-center gap-2 font-pixel text-[var(--accent-2)]"><Icon size={18} aria-hidden />{t('trial.event')}: {t(`tev.${ev.year}.title`)}</p> })()}
                  <p className="mt-1 text-sm">{t(`tev.${ev.year}.body`)}</p>
                  {needsPick && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button className={`btn btn-sm ${pick === true ? 'btn-bad' : 'btn-ghost'}`} aria-pressed={pick === true} onClick={() => setPick(true)}>{t(`tev.${ev.year}.risky`)}</button>
                      <button className={`btn btn-sm ${pick === false ? 'btn-good' : 'btn-ghost'}`} aria-pressed={pick === false} onClick={() => setPick(false)}>{t(`tev.${ev.year}.safe`)}</button>
                    </div>
                  )}
                </div>
                <button className="btn btn-gold w-full py-3" disabled={!!needsPick && pick === null} onClick={live}><Siren size={16} aria-hidden />{t('trial.live', { y: year })}</button>
              </motion.div>
            </AnimatePresence>
          )}
          {card && (
            <div className="space-y-3 rounded border-2 border-[var(--accent)]/50 bg-black/35 p-4">
              <h3 className="font-pixel text-xl text-[var(--accent)]">{t('score.title')}</h3>
              <MasteryScorecard card={card} />
              <div className="flex flex-wrap gap-2">
                {(card.passed || play.mode === 'direct') && <button className="btn btn-gold" onClick={goHome} autoFocus><Home size={16} aria-hidden />{play.mode === 'direct' ? t('direct.seeResults') : t('trial.finish')}</button>}
                <button className="btn btn-ghost" onClick={retry}>{t('trial.retry')}</button>
              </div>
              <p className="text-xs text-parchment/60">{t('trial.assumptions')} {t('disclaimer')}</p>
            </div>
          )}
        </section>
      </div>
      <AnimatePresence>{leaving && <motion.div className="fixed inset-0 z-[80] bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} aria-hidden />}</AnimatePresence>
    </MinigameShell>
  )
}
