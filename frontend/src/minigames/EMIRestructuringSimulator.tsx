import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gauge, HandCoins } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { LineChart } from '../components/ui/LineChart.tsx'
import { keyText, useT } from '../i18n/useT.ts'
import { amortize, inr } from '../lib/finance.ts'
import { CREDIT_RULES, EMI_EXPENSES, EMI_INCOME, EQUIPMENT_EMI, EQUIPMENT_LOAN, VANITY_OFFERS, creditInit, creditStep, creditVerdict, type CreditState } from '../lib/sims.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

export default function EMIRestructuringSimulator({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const [startScore] = useState(() => play.cibil) // snapshot: the six months always start here
  const [sim, setSim] = useState<CreditState>(() => creditInit(startScore))
  const [accept, setAccept] = useState<boolean | null>(null)
  const [result, setResult] = useState<'win' | 'fail' | null>(null)
  const month = sim.month + 1
  const offer = VANITY_OFFERS[month]
  const pendingVanity = sim.vanityEmis.reduce((a, b) => a + b, 0) + (offer && accept ? offer.emi : 0)
  const ratio = (EQUIPMENT_EMI + pendingVanity) / EMI_INCOME
  const done = sim.month >= 6

  const playMonth = (payEquipment: boolean) => {
    const next = creditStep(sim, { payEquipment, acceptVanity: !!accept })
    audio.sfx(payEquipment ? 'coin' : 'warn')
    setSim(next); setAccept(null)
    if (next.month >= 6) {
      const v = creditVerdict(next)
      if (v.win) {
        // Commit six real months: income, expenses, EMIs; update score, cash-flow and loan balance.
        const txs = []
        for (let m = 1; m <= 6; m++) {
          txs.push({ label: 'tx.loomIncome', vars: { m }, amount: EMI_INCOME, account: 'wallet' as const, kind: 'income' as const })
          txs.push({ label: 'tx.living', vars: { m }, amount: -EMI_EXPENSES, account: 'wallet' as const, kind: 'expense' as const })
          txs.push({ label: 'tx.equipEmi', vars: { m }, amount: -EQUIPMENT_EMI, account: 'wallet' as const, kind: 'loan' as const })
        }
        play.commit(txs, { text: t('fx.credit', { n: next.score }), tone: 'invest' })
        play.setCibil(next.score); play.setCashflow(EMI_INCOME, EMI_EXPENSES)
        // Outstanding principal after 6 of 12 EMIs comes straight from the amortisation table.
        const left = amortize(EQUIPMENT_LOAN.principal, EQUIPMENT_LOAN.annualRate / 12, EQUIPMENT_LOAN.months)[5].closing
        play.updateLoans(play.loans.map(l => l.id === 'equipment' ? { ...l, months: 6, remaining: Math.round(left * 100) / 100 } : l))
        play.award('emi', 'credit', 200); play.report({ win: true, score: Math.min(100, Math.round(next.score / 7.7)) }); audio.sfx('victory'); setResult('win')
      } else {
        const v2 = creditVerdict(next)
        play.report({ win: false, mistakes: [!v2.allOnTime && t('emi.mMissed', { n: next.missed }), !v2.noVanity && t('emi.mVanity', { n: next.acceptedVanity }), !v2.ratioOk && t('emi.mRatio', { pct: (v2.maxRatio * 100).toFixed(0) }), !v2.scoreOk && t('emi.mScore', { n: next.score })].filter(Boolean) as string[] })
        audio.sfx('fail'); setResult('fail')
      }
    }
  }
  const retry = () => { setSim(creditInit(startScore)); setAccept(null); setResult(null) }
  const v = creditVerdict(sim)
  const scoreCol = sim.score >= 750 ? '#52e08a' : sim.score >= 650 ? '#ffb547' : '#ff5d6c'

  return (
    <MinigameShell title={t('emi.title')} help={t('emi.help')} right={<span className="font-pixel text-[var(--accent-2)]">{t('emi.month', { m: Math.min(month, 6) })}</span>}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-4 rounded border border-white/10 bg-black/30 p-3">
            <Gauge size={42} style={{ color: scoreCol }} aria-hidden />
            <div><div className="text-xs uppercase text-parchment/60">{t('hud.cibil')}</div>
              <motion.div key={sim.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-pixel text-4xl" style={{ color: scoreCol }}>{sim.score}</motion.div></div>
            <div className="ml-auto text-right text-xs text-parchment/60">{t('emi.target')}<br />300 – 900</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded bg-black/30 p-2">{t('emi.income')}<br /><b className="font-mono">{inr(EMI_INCOME)}</b></div>
            <div className="rounded bg-black/30 p-2">{t('emi.expenses')}<br /><b className="font-mono">{inr(EMI_EXPENSES)}</b></div>
            <div className="rounded bg-black/30 p-2">{t('emi.emiLabel')}<br /><b className="font-mono">{inr(EQUIPMENT_EMI + pendingVanity)}</b></div>
            <div className="rounded bg-black/30 p-2">{t('emi.cash')}<br /><b className="font-mono">{inr(sim.cash)}</b></div>
          </div>
          <div>
            <div className="flex justify-between text-sm"><span>{t('emi.ratio')}</span><b className={ratio > 0.3 ? 'text-bad' : 'text-good'}>{(ratio * 100).toFixed(1)}%</b></div>
            <div className="relative h-3 overflow-hidden rounded-sm bg-black/40">
              <div className="h-full transition-all" style={{ width: `${Math.min(100, ratio * 100 / 0.6)}%`, background: ratio > 0.3 ? '#ff5d6c' : '#52e08a' }} />
              <div className="absolute inset-y-0 w-0.5 bg-gold" style={{ left: `${(0.3 / 0.6) * 100}%` }} title={t('emi.limit')} />
            </div>
          </div>
          <div className="rounded bg-black/25 p-2"><LineChart series={[{ name: t('emi.score'), values: sim.scoreHistory, color: scoreCol }]} target={{ value: 750, label: '750' }} labels={sim.scoreHistory.map((_, i) => t('axis.month', { n: i }))} height={130} /></div>
          <p className="text-xs text-parchment/60">{t('emi.model')} {t('emi.rules', { on: CREDIT_RULES.onTime, missed: CREDIT_RULES.missed, nl: CREDIT_RULES.newLoan, over: CREDIT_RULES.overburdened })}</p>
        </div>

        <div className="space-y-3">
          {!done && (
            <motion.div key={month} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 rounded border-2 border-[var(--accent)]/40 bg-black/30 p-4">
              <h3 className="font-pixel text-lg">{t('emi.month', { m: month })}</h3>
              {offer && (
                <div className="rounded border border-[#c99bff]/60 bg-[#c99bff]/10 p-3">
                  <p className="flex items-center gap-2 font-semibold"><HandCoins size={18} className="text-[#c99bff]" aria-hidden />{t('emi.offer')}: {t(offer.label)}</p>
                  <p className="text-sm">{t('emi.extra', { amt: inr(offer.emi), pct: (((EQUIPMENT_EMI + sim.vanityEmis.reduce((a, b) => a + b, 0) + offer.emi) / EMI_INCOME) * 100).toFixed(1) })}</p>
                  <div className="mt-2 flex gap-2">
                    <button className={`btn btn-sm ${accept === true ? 'btn-bad' : 'btn-ghost'}`} aria-pressed={accept === true} onClick={() => setAccept(true)}>{t('emi.accept')}</button>
                    <button className={`btn btn-sm ${accept === false ? 'btn-good' : 'btn-ghost'}`} aria-pressed={accept === false} onClick={() => setAccept(false)}>{t('emi.decline')}</button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-good" disabled={!!offer && accept === null} onClick={() => playMonth(true)}>{t('emi.pay')} ({inr(EQUIPMENT_EMI)})</button>
                <button className="btn btn-ghost" disabled={!!offer && accept === null} onClick={() => playMonth(false)}>{t('emi.skip')}</button>
              </div>
            </motion.div>
          )}
          {sim.notes.length > 0 && <ul className="rounded bg-black/25 p-3 text-sm">{sim.notes.map((n, i) => <li key={i}>• {keyText(t, n.key, n.vars)}</li>)}</ul>}
          {result === 'fail' && (
            <ResultPanel win={false} onRetry={retry}>
              <ul className="text-sm">
                <li>{v.allOnTime ? '✓' : '✗'} {t('emi.cOnTime', { n: 6 - sim.missed })}</li>
                <li>{v.noVanity ? '✓' : '✗'} {t('emi.cVanity', { n: sim.acceptedVanity })}</li>
                <li>{v.ratioOk ? '✓' : '✗'} {t('emi.cRatio', { pct: (v.maxRatio * 100).toFixed(1) })}</li>
                <li>{v.scoreOk ? '✓' : '✗'} {t('emi.cScore', { n: sim.score })}</li>
              </ul>
              <p className="text-sm">{t('emi.worked', { on: CREDIT_RULES.onTime, start: startScore, end: startScore + 120 })}</p>
            </ResultPanel>
          )}
          {result === 'win' && <ResultPanel win onContinue={onComplete}><p>{t('emi.win', { n: sim.score, pct: (v.maxRatio * 100).toFixed(1), cash: inr(6 * (EMI_INCOME - EMI_EXPENSES - EQUIPMENT_EMI)) })}</p></ResultPanel>}
        </div>
      </div>
    </MinigameShell>
  )
}
