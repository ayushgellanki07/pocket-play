import { useState } from 'react'
import { motion } from 'framer-motion'
import { BellRing, ShieldCheck, AlertTriangle } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { useT } from '../i18n/useT.ts'
import { useFx } from '../store/fxStore.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

/** Payment Security Challenge: three urgent phone notifications. The first is the ₹50,000 fake prize. */
// All alert text is translated: scam.<n>.{app,from,headline,body,detail,risky,safe,lesson,flags}.
const ALERTS = [{ from: 'luckydraw.guild@okpay' }, { from: null }, { from: null }] // null → translated sender

export default function ScamAlert({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const push = useFx(s => s.push)
  const [i, setI] = useState(0)
  const [state, setState] = useState<'ask' | 'fell' | 'safe'>('ask')
  const [slips, setSlips] = useState<string[]>([])
  const f = (k: string) => t(`scam.${i}.${k}`)
  const from = ALERTS[i].from ?? f('from')
  const last = i === ALERTS.length - 1

  const choose = (risky: boolean) => {
    if (risky) {
      audio.sfx('fail'); push(t('fx.scamWorked'), 'loss')
      setSlips(s => [...s, `${f('headline')}: ${f('lesson')}`])
      play.report({ win: false, mistakes: [`${f('app')}: ${f('lesson')}`] })
      setState('fell')
    } else { audio.sfx('success'); push(t('fx.scamBlocked'), 'shield'); setState('safe') }
  }
  const next = () => {
    if (state === 'fell') { setState('ask'); return } // retry the same alert
    if (!last) { setI(i + 1); setState('ask'); return }
    play.award('scam', 'banking', 75)
    play.report({ win: true, score: Math.max(40, 100 - slips.length * 20) })
    onComplete()
  }

  return (
    <MinigameShell title={t('scam.title')} help={t('obj.scam')} right={<span className="font-pixel text-sm">{i + 1} / {ALERTS.length}</span>}>
      <div className="mx-auto max-w-md">
        <motion.div key={i} className="rounded-2xl border-4 border-black bg-[#0d0a1e] p-3 shadow-[0_0_40px_rgba(255,93,108,.35)]"
          initial={{ y: -20, opacity: 0 }} animate={state === 'ask' ? { y: 0, opacity: 1, x: [0, -4, 4, -3, 3, 0] } : { y: 0, opacity: 1 }}
          transition={{ x: { repeat: state === 'ask' ? Infinity : 0, repeatDelay: 1.6, duration: 0.4 } }}>
          <div className="rounded-lg bg-gradient-to-b from-[#2a1f5c] to-[#1a1240] p-4">
            <div className="flex items-center gap-2 text-xs text-parchment/60"><BellRing size={14} className="text-bad" aria-hidden /> {f('app')} · {t('scam.now')}</div>
            <p className="mt-2 font-pixel text-xl text-gold">{f('headline')}</p>
            <p className="mt-1">{f('body')}</p>
            <div className="mt-3 rounded border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-parchment/70">{t('scam.from')}: <span className="font-mono">{from}</span></p>
              <p className="mt-1">{f('detail')}</p>
            </div>
            {state === 'ask' && (
              <div className="mt-4 grid gap-2">
                <button className="btn btn-bad" onClick={() => choose(true)}><AlertTriangle size={16} aria-hidden />{f('risky')}</button>
                <button className="btn btn-good" onClick={() => choose(false)}><ShieldCheck size={16} aria-hidden />{f('safe')}</button>
              </div>
            )}
          </div>
        </motion.div>
        {state !== 'ask' && (
          <div className="mt-4">
            <ResultPanel win={state === 'safe'} title={state === 'safe' ? (last ? t('common.victory') : t('gauntlet.correct')) : undefined}
              onRetry={state === 'fell' ? next : undefined} onContinue={state === 'safe' ? next : undefined}>
              <p className="font-semibold text-gold">{f('lesson')}</p>
              <p className="text-sm">{t('scam.redFlags', { flags: f('flags') })}</p>
            </ResultPanel>
          </div>
        )}
      </div>
    </MinigameShell>
  )
}
