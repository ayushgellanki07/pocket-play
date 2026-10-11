import { useMemo, useState } from 'react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { LineChart } from '../components/ui/LineChart.tsx'
import { useT } from '../i18n/useT.ts'
import { amortize, effectiveAnnual, inr, inrCompact, nominalAnnual, pct, summarizeLoan } from '../lib/finance.ts'
import { EQUIPMENT_EMI, EQUIPMENT_LOAN } from '../lib/sims.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

const REG_MONTHLY = 0.12 / 12 // illustrative regulated loan: 12% nominal per year, EMI

export default function CompoundingSnowball({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const [amount, setAmount] = useState(14000)
  const [rate, setRate] = useState(5)       // % per month
  const [months, setMonths] = useState(12)
  const [structure, setStructure] = useState<'bullet' | 'emi'>('bullet')
  const [result, setResult] = useState<'win' | 'wrong' | null>(null)
  const [showTable, setShowTable] = useState(false)

  const inf = useMemo(() => summarizeLoan(amount, rate / 100, months, structure), [amount, rate, months, structure])
  const reg = useMemo(() => summarizeLoan(amount, REG_MONTHLY, months, 'emi'), [amount, months])
  const schedule = useMemo(() => amortize(amount, REG_MONTHLY, months), [amount, months])
  const labels = Array.from({ length: months + 1 }, (_, i) => t('axis.month', { n: i }))

  const pick = (regulated: boolean) => {
    if (regulated) {
      // The forge-loom is financed with the regulated loan (paid straight to the smith).
      play.addLoan({ id: 'equipment', lender: 'snow.lender', principal: EQUIPMENT_LOAN.principal, annualRate: EQUIPMENT_LOAN.annualRate, months: EQUIPMENT_LOAN.months, emi: EQUIPMENT_EMI, remaining: EQUIPMENT_LOAN.principal })
      play.award('snowball', 'credit', 125); play.report({ win: true }); audio.sfx('success'); setResult('win')
    } else { play.report({ win: false, mistakes: [t('snow.mistake')] }); audio.sfx('fail'); setResult('wrong') }
  }

  // Default scenario numbers, used in the explanation regardless of slider position.
  const base = summarizeLoan(14000, 0.05, 12, 'bullet')
  const baseReg = summarizeLoan(14000, REG_MONTHLY, 12, 'emi')

  const Row = ({ k, a, b }: { k: string; a: string; b: string }) => (
    <tr className="border-t border-white/5"><th scope="row" className="py-1.5 pr-2 text-left font-normal text-parchment/70">{k}</th><td className="text-right font-mono text-bad">{a}</td><td className="text-right font-mono text-good">{b}</td></tr>
  )

  return (
    <MinigameShell title={t('snow.title')} help={t('snow.help')}>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded border border-white/10 bg-black/25 p-3 text-sm">
          <label className="block">{t('snow.amount')}: <b>{inr(amount)}</b><input type="range" min={2000} max={50000} step={1000} value={amount} onChange={e => setAmount(+e.target.value)} /></label>
          <label className="block">{t('snow.rate')}: <b>{rate}%</b><input type="range" min={1} max={10} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} /></label>
          <label className="block">{t('snow.months')}: <b>{months}</b><input type="range" min={3} max={36} value={months} onChange={e => setMonths(+e.target.value)} /></label>
          <fieldset><legend>{t('snow.structure')}</legend>
            <div className="mt-1 flex gap-2">
              {(['bullet', 'emi'] as const).map(s => <button key={s} className={`btn btn-sm flex-1 ${structure === s ? '' : 'btn-ghost'}`} aria-pressed={structure === s} onClick={() => setStructure(s)}>{t(s === 'bullet' ? 'snow.bullet' : 'snow.emi')}</button>)}
            </div>
          </fieldset>
          <div className="rounded border border-[var(--accent-2)]/40 bg-[var(--accent-2)]/10 p-2 font-mono text-xs">
            <p>{t('snow.nominal')}: {rate}% × 12 = <b>{pct(nominalAnnual(rate / 100))}</b></p>
            <p>{t('snow.effective')}: (1+{rate / 100})¹² − 1 = <b className="text-bad">{pct(effectiveAnnual(rate / 100))}</b></p>
            <p className="mt-1 text-parchment/70">{t('snow.regNote', { eff: pct(effectiveAnnual(REG_MONTHLY), 2) })}</p>
          </div>
        </div>

        <div className="space-y-3">
          <table className="w-full text-sm">
            <thead><tr className="text-xs uppercase text-parchment/60"><th /><th className="text-right">{t('snow.informal')}</th><th className="text-right">{t('snow.regulated')}</th></tr></thead>
            <tbody>
              <Row k={t('snow.principal')} a={inr(amount)} b={inr(amount)} />
              <Row k={t('snow.interest')} a={inr(inf.interest)} b={inr(reg.interest)} />
              <Row k={t('snow.total')} a={inr(inf.totalPaid)} b={inr(reg.totalPaid)} />
              <Row k={t('snow.installment')} a={structure === 'bullet' ? t('snow.atMonth', { amt: inr(inf.installment), m: t('axis.month', { n: months }) }) : t('snow.perMonth', { amt: inr(inf.installment, true) })} b={t('snow.perMonth', { amt: inr(reg.installment, true) })} />
            </tbody>
          </table>
          <div className="rounded bg-black/25 p-2">
            <p className="mb-1 text-xs text-parchment/60">{t('snow.balanceTitle')}</p>
            <LineChart labels={labels} format={inrCompact}
              series={[{ name: t('snow.informal'), values: [amount, ...inf.balances], color: '#ff5d6c' }, { name: t('snow.regulated'), values: [amount, ...reg.balances], color: '#52e08a' }]} />
            <div className="flex gap-4 text-xs"><span className="text-bad">■ {t('snow.informal')}</span><span className="text-good">■ {t('snow.regulated')}</span></div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(s => !s)} aria-expanded={showTable}>{t('snow.timeline')}</button>
          {showTable && (
            <div className="scroll-thin max-h-48 overflow-y-auto">
              <table className="w-full font-mono text-xs">
                <thead className="text-parchment/60"><tr><th className="text-left">{t('sched.m')}</th><th className="text-right">{t('sched.opening')}</th><th className="text-right">{t('sched.interest')}</th><th className="text-right">{t('sched.principal')}</th><th className="text-right">{t('sched.closing')}</th></tr></thead>
                <tbody>{schedule.map(r => <tr key={r.month} className="border-t border-white/5"><td>{r.month}</td><td className="text-right">{inr(r.opening)}</td><td className="text-right">{inr(r.interest, true)}</td><td className="text-right">{inr(r.principal, true)}</td><td className="text-right">{inr(r.closing)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {!result && (
            <div className="rounded border-2 border-gold/50 bg-gold/5 p-3">
              <p className="font-pixel">{t('snow.choose')}</p>
              <div className="mt-2 flex flex-wrap gap-2"><button className="btn btn-good" onClick={() => pick(true)}>{t('snow.pickReg')}</button><button className="btn btn-bad" onClick={() => pick(false)}>{t('snow.pickInf')}</button></div>
            </div>
          )}
          {result === 'wrong' && (
            <ResultPanel win={false} onRetry={() => setResult(null)}>
              <p>{t('snow.wrong1', { total: inr(base.totalPaid), interest: inr(base.interest) })}</p>
              <p>{t('snow.wrong2', { total: inr(baseReg.totalPaid), emi: inr(baseReg.installment, true) })}</p>
              <p className="text-sm">{t('snow.wrong3')}</p>
            </ResultPanel>
          )}
          {result === 'win' && (
            <ResultPanel win onContinue={onComplete}>
              <p>{t('snow.win', { regInt: inr(baseReg.interest), infInt: inr(base.interest), save: inr(base.totalPaid - baseReg.totalPaid), emi: inr(EQUIPMENT_EMI) })}</p>
            </ResultPanel>
          )}
        </div>
      </div>
    </MinigameShell>
  )
}
