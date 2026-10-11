import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, AlertTriangle, ShoppingBag, Coins, Receipt } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { LineChart } from '../components/ui/LineChart.tsx'
import { useT } from '../i18n/useT.ts'
import { useIsPaused } from '../store/uiStore.ts'
import { useFx } from '../store/fxStore.ts'
import { inr, inrCompact } from '../lib/finance.ts'
import { LEDGER_EVENTS, LEDGER_TARGET, ledgerInit, ledgerStep, type LedgerEvent, type LedgerState } from '../lib/sims.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

const DAY_MS = 420

export default function OutpostLedger30Days({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  // Snapshot the starting cash so the month always replays from the same point.
  const [{ wallet, reserve }] = useState(() => ({ wallet: play.wallet, reserve: play.reserve }))
  const paused = useIsPaused()
  const push = useFx(s => s.push)
  // The sim starts from the player's ACTUAL finances.
  const [sim, setSim] = useState<LedgerState>(() => ledgerInit(wallet, reserve))
  const [decisions, setDecisions] = useState<Record<number, boolean>>({})
  const [running, setRunning] = useState(false)
  const [pending, setPending] = useState<LedgerEvent | null>(null)
  const [result, setResult] = useState<'win' | 'fail' | null>(null)

  const total = sim.wallet + sim.reserve

  // The calendar engine: one day per tick, pausing for temptations and for the pause menu.
  useEffect(() => {
    if (!running || paused || pending || result) return
    const id = setTimeout(() => {
      const nextDay = sim.day + 1
      if (nextDay > 30) {
        const win = total >= LEDGER_TARGET
        setRunning(false); setResult(win ? 'win' : 'fail')
        if (win) {
          // Commit the whole month to the real ledger in one go (no double counting).
          play.commit(sim.log.map(l => ({ label: 'tx.day', vars: { d: l.day, itemKey: l.label }, amount: l.amount, account: l.account, kind: l.amount > 0 ? 'income' : 'expense' })), { text: t('fx.monthSurvived', { amt: inr(total) }), tone: 'saving' })
          play.award('ledger', 'budgeting', 150); play.report({ win: true, score: Math.min(100, 70 + Math.round((total - LEDGER_TARGET) / 100)) }); audio.sfx('victory')
        } else { audio.sfx('fail'); play.report({ win: false, mistakes: [t('ledger.mEnded', { amt: inr(total) })] }) }
        return
      }
      const temptation = LEDGER_EVENTS.find(e => e.day === nextDay && e.type === 'temptation')
      if (temptation && decisions[nextDay] === undefined) { setPending(temptation); audio.sfx('alert'); return }
      const next = ledgerStep(sim, e => decisions[e.day] === true)
      for (const e of LEDGER_EVENTS.filter(e => e.day === nextDay)) {
        if (e.type === 'emergency') { push(`⚠ ${t(e.label)} −${inr(e.amount)}`, 'loss'); audio.sfx('warn') }
        if (e.type === 'bill') push(`${t(e.label)} −${inr(e.amount)}`, 'expense')
        if (e.type === 'income') { push(t('fx.wage', { amt: inr(e.amount) }), 'income'); audio.sfx('coin') }
      }
      setSim(next)
      if (next.failedOn) { setRunning(false); setResult('fail'); audio.sfx('fail'); play.report({ win: false, mistakes: [t('ledger.mBroke', { d: next.failedOn })] }) }
    }, DAY_MS)
    return () => clearTimeout(id)
  }, [running, paused, pending, result, sim, decisions, total, push])

  const decide = (buy: boolean) => {
    if (!pending) return
    audio.sfx(buy ? 'coin' : 'click')
    setDecisions(d => ({ ...d, [pending.day]: buy }))
    setPending(null)
  }

  const retry = () => { setSim(ledgerInit(wallet, reserve)); setDecisions({}); setPending(null); setResult(null); setRunning(true) }
  const bought = LEDGER_EVENTS.filter(e => e.type === 'temptation' && decisions[e.day])
  const boughtSum = bought.reduce((s, e) => s + e.amount, 0)

  return (
    <MinigameShell title={t('ledger.bossTitle')} help={t('ledger.help')}
      right={<div className="font-pixel text-lg text-[var(--accent-2)]">{t('ledger.day', { d: Math.min(sim.day, 30) })} / 30</div>}>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {/* calendar */}
          <ol className="grid grid-cols-6 gap-1 sm:grid-cols-10" aria-label={t('ledger.calendar')}>
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1
              const ev = LEDGER_EVENTS.find(e => e.day === d)
              const past = d <= sim.day
              const icon = ev?.type === 'bill' ? <Receipt size={12} /> : ev?.type === 'emergency' ? <AlertTriangle size={12} /> : ev?.type === 'temptation' ? <ShoppingBag size={12} /> : ev?.type === 'income' ? <Coins size={12} /> : null
              const tone = ev?.type === 'bill' ? 'text-warn' : ev?.type === 'emergency' ? 'text-bad' : ev?.type === 'temptation' ? 'text-[#c99bff]' : 'text-gold'
              return (
                <li key={d} className={`flex aspect-square flex-col items-center justify-center rounded-sm border text-xs ${d === sim.day ? 'border-gold bg-gold/20' : past ? 'border-white/10 bg-white/5 text-parchment/50' : 'border-white/10 bg-black/30'}`}
                  aria-label={ev ? t('ledger.dayAriaEv', { d, ev: t(ev.label) }) : t('ledger.dayAria', { d })}>
                  <span>{d}</span><span className={tone} aria-hidden>{icon}</span>
                </li>
              )
            })}
          </ol>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded bg-black/30 p-2">{t('hud.wallet')}<br /><b className="font-pixel text-lg">{inr(sim.wallet)}</b></div>
            <div className="rounded bg-black/30 p-2">{t('hud.reserve')}<br /><b className="font-pixel text-lg text-good">{inr(sim.reserve)}</b></div>
            <div className={`rounded p-2 ${total >= LEDGER_TARGET ? 'bg-good/15' : 'bg-bad/15'}`}>{t('ledger.balance')}<br /><b className="font-pixel text-lg">{inr(total)}</b></div>
          </div>
          <div className="mt-3 rounded bg-black/25 p-2">
            <LineChart series={[{ name: t('ledger.balance'), values: sim.history, color: 'var(--accent)' }]} target={{ value: LEDGER_TARGET, label: t('ledger.targetLabel', { amt: inr(LEDGER_TARGET) }) }} format={inrCompact} height={150} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!running && !result && sim.day === 0 && (
            <div className="rounded border border-white/10 bg-black/25 p-4 text-sm">
              <p>{t('ledger.start', { wallet: inr(wallet), reserve: inr(reserve) })}</p>
              <button className="btn btn-gold mt-3" onClick={() => setRunning(true)} autoFocus><Play size={16} aria-hidden />{t('ledger.begin')}</button>
            </div>
          )}
          <AnimatePresence>
            {pending && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="rounded border-2 border-[#c99bff] bg-[#c99bff]/10 p-4" role="alertdialog" aria-label={t('ledger.temptation')}>
                <p className="font-pixel text-[#c99bff]">{t('ledger.temptation')} — {t('ledger.day', { d: pending.day })}</p>
                <p className="mt-1">{t(pending.label)}: <b>{inr(pending.amount)}</b></p>
                <p className="mt-1 text-xs text-parchment/70">{t('ledger.ifBuy', { amt: inr(total - pending.amount) })}</p>
                <div className="mt-3 flex gap-2"><button className="btn btn-ghost" onClick={() => decide(true)}>{t('ledger.buy')}</button><button className="btn btn-good" onClick={() => decide(false)} autoFocus>{t('ledger.skip')}</button></div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="scroll-thin max-h-64 overflow-y-auto rounded border border-white/10 bg-black/25 p-2 text-sm" aria-label={t('ledger.title')}>
            <h3 className="mb-1 font-pixel text-xs uppercase text-parchment/60">{t('ledger.title')}</h3>
            {sim.log.length === 0 && <p className="text-parchment/50">{t('ledger.empty')}</p>}
            {[...sim.log].reverse().map((l, i) => (
              <div key={i} className="flex justify-between border-t border-white/5 py-1"><span>{t('ledger.dayShort', { d: l.day })} · {t(l.label)}{l.account === 'reserve' ? ` ${t('ledger.fromReserve')}` : ''}</span><span className={`font-mono ${l.amount >= 0 ? 'text-good' : 'text-bad'}`}>{l.amount >= 0 ? '+' : ''}{inr(l.amount)}</span></div>
            ))}
          </div>
          {result === 'fail' && (
            <ResultPanel win={false} onRetry={retry}>
              <p>{sim.failedOn ? t('ledger.failBroke', { d: sim.failedOn }) : t('ledger.failLow', { final: inr(total) })}</p>
              <p>{t('ledger.spentOn', { sum: inr(boughtSum) })} {bought.map(b => t(b.label)).join(', ')}</p>
              <p className="font-mono text-xs">{t('ledger.calc', { start: inr(wallet + reserve), wants: inr(boughtSum), end: inr(wallet + reserve + 12000 - 9500 - boughtSum) })}</p>
              <p>{t('ledger.tip')}</p>
            </ResultPanel>
          )}
          {result === 'win' && (
            <ResultPanel win onContinue={onComplete}>
              <p>{t('ledger.winText', { amt: inr(total) })}</p>
            </ResultPanel>
          )}
        </div>
      </div>
    </MinigameShell>
  )
}
