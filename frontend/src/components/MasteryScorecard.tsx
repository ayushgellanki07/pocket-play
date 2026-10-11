import { motion } from 'framer-motion'
import { useT } from '../i18n/useT.ts'
import { inr } from '../lib/finance.ts'
import type { Pillar, ScoreCard } from '../types.ts'

const ORDER: Pillar[] = ['budget', 'emergency', 'fraud', 'debt', 'diversification', 'inflation', 'resilience']
const col = (v: number) => (v >= 70 ? '#52e08a' : v >= 40 ? '#ffb547' : '#ff5d6c')

export function MasteryScorecard({ card }: { card: ScoreCard }) {
  const t = useT()
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-parchment/60">{t('score.overall')}</div>
          <div className="font-pixel text-5xl" style={{ color: col(card.overall) }}>{card.overall}<span className="text-xl text-parchment/50">/100</span></div>
        </div>
        <div className="text-right text-sm">
          <div>{t('trial.netWorth')}: <b>{inr(card.netWorth)}</b></div>
          <div className="text-parchment/70">{t('trial.real')}: {inr(card.realNetWorth)}</div>
        </div>
      </div>
      <ul className="space-y-2">
        {ORDER.map((p, i) => (
          <li key={p}>
            <div className="flex justify-between text-sm"><span>{t(`pillar.${p}`)}</span><b style={{ color: col(card.pillars[p]) }}>{Math.round(card.pillars[p])}</b></div>
            <div className="h-2.5 overflow-hidden rounded-sm bg-black/40">
              <motion.div className="h-full" style={{ background: col(card.pillars[p]) }} initial={{ width: 0 }} animate={{ width: `${card.pillars[p]}%` }} transition={{ delay: 0.1 * i, duration: 0.8 }} />
            </div>
          </li>
        ))}
      </ul>
      <p className={`mt-3 font-pixel ${card.passed ? 'text-good' : 'text-warn'}`}>{card.passed ? t('score.pass') : t('score.fail')}</p>
    </div>
  )
}
