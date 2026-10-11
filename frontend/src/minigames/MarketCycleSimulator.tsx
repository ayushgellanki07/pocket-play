import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { LineChart } from '../components/ui/LineChart.tsx'
import { useT } from '../i18n/useT.ts'
import { inr, inrCompact, pct } from '../lib/finance.ts'
import { CASH_RATE, MARKET_FEES, MARKET_RETURNS, holdingsTotal, marketPath, marketYear, panicSell, rebalance, type Holdings } from '../lib/sims.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

type Choice = 'hold' | 'panic' | 'rebalance' | 'topup'
const START = 10000, TOPUP = 2000
const init = (): Holdings => ({ etf: START * 0.7, stock: START * 0.2, gold: START * 0.1, cash: 0 })
const COLORS = { etf: '#4fdc8f', stock: '#5aa9ff', gold: '#f5c542', cash: '#b9b2a5' }

export default function MarketCycleSimulator({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const wallet = play.wallet
  const [h, setH] = useState<Holdings>(init)
  const [year, setYear] = useState(0)
  const [values, setValues] = useState([START])
  const [rebal, setRebal] = useState(false)
  const [choice, setChoice] = useState<Choice | null>(null)
  const [result, setResult] = useState<'win' | 'fail' | null>(null)
  const needsDecision = year === 3 && !choice

  const advance = () => {
    let next = marketYear(h, year)
    if (rebal && year !== 2) next = rebalance(next)
    const y = year + 1
    audio.sfx(MARKET_RETURNS.etf[year] < 0 ? 'warn' : 'coin')
    setH(next); setYear(y); setValues(v => [...v, holdingsTotal(next)]); setRebal(false)
    if (y === 5) finish(next, choice)
  }
  const decide = (c: Choice) => {
    let next = h
    if (c === 'panic') next = panicSell(h)
    if (c === 'rebalance') next = rebalance(h)
    if (c === 'topup') next = rebalance({ ...h, etf: h.etf + TOPUP })
    audio.sfx(c === 'panic' ? 'fail' : 'click')
    setChoice(c); setH(next); setValues(v => [...v.slice(0, -1), holdingsTotal(next)])
  }
  const finish = (final: Holdings, c: Choice | null) => {
    if (c === 'panic') { audio.sfx('fail'); setResult('fail'); play.report({ win: false, mistakes: [t('market.mistake')] }); return }
    const invested = START + (c === 'topup' ? TOPUP : 0)
    play.commit([{ label: 'tx.invested', amount: -invested, account: 'wallet', kind: 'investment' }], { text: t('fx.portfolio', { amt: inr(holdingsTotal(final)) }), tone: 'invest' })
    play.setPortfolio({ etf: final.etf, stock: final.stock, gold: final.gold, cash: final.cash })
    play.award('market', 'investing', 200); play.report({ win: true, score: c === 'hold' ? 85 : 100 }); audio.sfx('victory'); setResult('win')
  }
  const retry = () => { setH(init()); setYear(0); setValues([START]); setChoice(null); setResult(null); setRebal(false) }

  const total = holdingsTotal(h)
  const hold = marketPath(START, 'hold').values
  const panic = marketPath(START, 'panic').values
  const showCompare = year === 5

  return (
    <MinigameShell title={t('market.title')} help={t('market.help')} right={<span className="font-pixel text-[var(--accent-2)]">{t('market.year', { y: year })} / 5</span>}>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <div className="rounded bg-black/25 p-2">
            <LineChart labels={values.map((_, i) => t('axis.year', { n: i }))} format={inrCompact}
              series={[{ name: t('market.you'), values, color: '#4fdc8f' }, ...(showCompare ? [{ name: choice === 'panic' ? t('market.stayInvested') : t('market.panicSell'), values: choice === 'panic' ? hold : panic, color: '#ff5d6c', dashed: true }] : [])]} />
            {showCompare && <p className="text-xs"><span className="text-good">{t('market.yourPath')}</span> · <span className="text-bad">┅ {choice === 'panic' ? t('market.ifStayed') : t('market.ifPanicked')}</span></p>}
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm"><span>{t('market.allocation')}</span><b className="font-pixel">{inr(total)}</b></div>
            <div className="flex h-6 overflow-hidden rounded-sm" aria-label={t('market.allocation')}>
              {(['etf', 'stock', 'gold', 'cash'] as const).map(k => h[k] > 0 && <motion.div key={k} layout style={{ width: `${(h[k] / total) * 100}%`, background: COLORS[k] }} title={`${t(`asset.${k}`)} ${inr(h[k])}`} />)}
            </div>
            <ul className="mt-1 flex flex-wrap gap-3 text-xs">{(['etf', 'stock', 'gold', 'cash'] as const).map(k => <li key={k}><span style={{ color: COLORS[k] }}>■</span> {t(`asset.${k}`)} {inr(h[k])} ({total ? ((h[k] / total) * 100).toFixed(0) : 0}%)</li>)}</ul>
          </div>
          <details className="rounded bg-black/25 p-2 text-xs">
            <summary className="cursor-pointer">{t('market.assumptions')}</summary>
            <table className="mt-2 w-full font-mono">
              <thead><tr><th className="text-left">{t('market.colAsset')}</th>{[1, 2, 3, 4, 5].map(y => <th key={y}>{t('axis.year', { n: y })}</th>)}<th>{t('market.colFee')}</th></tr></thead>
              <tbody>{(['etf', 'stock', 'gold'] as const).map(a => <tr key={a}><td>{t(`asset.${a}`)}</td>{MARKET_RETURNS[a].map((r, i) => <td key={i} className={`text-center ${r < 0 ? 'text-bad' : 'text-good'}`}>{pct(r, 0)}</td>)}<td className="text-center">{pct(MARKET_FEES[a], 1)}</td></tr>)}
                <tr><td>{t('asset.cash')}</td><td colSpan={5} className="text-center">{t('market.perYear', { pct: pct(CASH_RATE, 0) })}</td><td /></tr></tbody>
            </table>
          </details>
        </div>

        <div className="space-y-3">
          <p className="rounded bg-black/30 p-2 text-sm">{t('market.fromWallet', { wallet: inr(wallet), amt: inr(START) })}</p>
          {needsDecision && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="rounded border-2 border-bad bg-bad/10 p-3" role="alertdialog" aria-label={t('market.crash')}>
              <p className="flex items-center gap-2 font-pixel text-bad"><TrendingDown aria-hidden />{t('market.crash')}</p>
              <p className="text-sm">{inr(values[2])} → {inr(values[3])} ({(((values[3] - values[2]) / values[2]) * 100).toFixed(1)}%)</p>
              <div className="mt-2 grid gap-2">
                <button className="btn btn-bad btn-sm" onClick={() => decide('panic')}>{t('market.panic')}</button>
                <button className="btn btn-sm" onClick={() => decide('hold')}>{t('market.hold')}</button>
                <button className="btn btn-sm" onClick={() => decide('rebalance')}>{t('market.rebal')}</button>
                <button className="btn btn-good btn-sm" disabled={wallet < START + TOPUP} onClick={() => decide('topup')}>{t('market.topup')}</button>
              </div>
            </motion.div>
          )}
          {year < 5 && !needsDecision && (
            <div className="space-y-2 rounded border border-white/10 bg-black/25 p-3">
              {year > 0 && year !== 2 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={rebal} onChange={e => setRebal(e.target.checked)} />{t('market.rebalance')} {t('market.endOfYear', { y: t('axis.year', { n: year + 1 }) })}</label>}
              <button className="btn btn-gold w-full" onClick={advance} autoFocus>{t('market.advance', { y: year + 1 })}</button>
              {year === 2 && <p className="text-xs text-warn">{t('market.brace')}</p>}
            </div>
          )}
          {result === 'fail' && (
            <ResultPanel win={false} onRetry={retry}>
              <p>{t('market.fail1', { panic: inr(panic[5]), hold: inr(hold[5]), gap: inr(hold[5] - panic[5]) })}</p>
              <p className="text-sm">{t('market.fail2')}</p>
            </ResultPanel>
          )}
          {result === 'win' && (
            <ResultPanel win onContinue={onComplete}>
              <p>{t('market.win1', { total: inr(total), extra: choice === 'topup' ? t('market.winExtra', { amt: inr(START + TOPUP) }) : '', panic: inr(panic[5]) })}</p>
              <p className="text-sm">{t('market.win2')}</p>
            </ResultPanel>
          )}
        </div>
      </div>
    </MinigameShell>
  )
}
