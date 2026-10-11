import { useState } from 'react'
import { motion } from 'framer-motion'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { useT } from '../i18n/useT.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

// Fixed scrambled start (never already-aligned) so the puzzle is the same for everyone.
const START = [90, 180, 270, 90, 270, 180]

function CrateSvg({ label, aligned }: { label: string; aligned: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className="pixel h-full w-full" aria-hidden>
      <rect x="2" y="2" width="28" height="28" fill="#8a5a2b" stroke="#2a1608" strokeWidth="2" />
      <rect x="4" y="4" width="24" height="24" fill="#a8723a" />
      <path d="M4 4 L28 28 M28 4 L4 28" stroke="#7a4c22" strokeWidth="3" />
      <rect x="9" y="11" width="14" height="10" fill="#e8d4a8" stroke="#2a1608" />
      <path d="M16 6 L21 11 H18 V14 H14 V11 H11 Z" fill={aligned ? '#3ee6f0' : '#ff5d6c'} stroke="#140f2b" strokeWidth=".8" />
      <text x="16" y="19" textAnchor="middle" fontSize="3.6" fontWeight="700" style={{ fontFamily: 'var(--font-body)' }} fill="#2a1608">{label}</text>
    </svg>
  )
}

export default function CrateAlign({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const [rot, setRot] = useState(START)
  const [done, setDone] = useState(false)
  const rotate = (i: number) => {
    if (done) return
    audio.sfx('click')
    const next = rot.map((r, k) => (k === i ? r + 90 : r)) // cumulative degrees so the spin always goes forward
    setRot(next)
    if (next.every(r => r % 360 === 0)) {
      setDone(true)
      // Reward goes straight into the real wallet so the HUD counts up from ₹0 to ₹15,000.
      play.commit([{ label: 'tx.cratePay', amount: 15000, account: 'wallet', kind: 'income' }], { text: '+₹15,000', coins: true })
      play.award('crate', 'budgeting', 50)
      play.report({ win: true, score: 100 })
    }
  }
  return (
    <MinigameShell title={t('crate.title')} help={t('crate.help')}>
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 sm:gap-5">
        {rot.map((r, i) => (
          <motion.button key={i} onClick={() => rotate(i)} disabled={done}
            className="aspect-square rounded-sm border-2 border-black/50 bg-black/20 p-2 hover:bg-white/5 disabled:cursor-default"
            animate={{ rotate: r }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            aria-label={t('crate.aria', { label: t(`crate.l.${i}`), state: r % 360 === 0 ? t('crate.aligned') : t('crate.rotated', { deg: r % 360 }) })}>
            <CrateSvg label={t(`crate.l.${i}`)} aligned={r % 360 === 0} />
          </motion.button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-parchment/70">{rot.filter(r => r % 360 === 0).length} / 6</p>
      {done && <div className="mx-auto mt-4 max-w-xl"><ResultPanel win onContinue={onComplete}><p>{t('crate.done')}</p></ResultPanel></div>}
    </MinigameShell>
  )
}
