import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useT } from '../i18n/useT.ts'
import { WORLDS } from '../data/worlds.ts'
import { Particles } from './ui/Particles.tsx'
import { audio } from '../lib/audio.ts'
import type { WorldId } from '../types.ts'

/** Cinematic portal sequence between worlds. */
export function WorldTransition({ to, onDone }: { to: WorldId; onDone: () => void }) {
  const t = useT()
  const w = WORLDS[to]
  useEffect(() => {
    audio.sfx('portal')
    const id = setTimeout(onDone, 4200)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <motion.div className="fixed inset-0 z-[70] flex cursor-pointer items-center justify-center overflow-hidden bg-ink" onClick={onDone}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-label={`${t('transition.entering')} ${t(`world.${to}`)}`}>
      <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${w.bg})` }}
        initial={{ scale: 0.2, opacity: 0, borderRadius: '50%' }} animate={{ scale: [0.2, 0.5, 1.15], opacity: [0, 0.6, 1], borderRadius: ['50%', '45%', '0%'] }} transition={{ duration: 3.6, ease: 'easeIn' }} />
      <div className="absolute h-[70vmin] w-[70vmin] rounded-full opacity-80" style={{ background: `conic-gradient(from 0deg, ${w.accent}, transparent, ${w.accent2}, transparent, ${w.accent})`, animation: 'portal-spin 2.4s linear infinite', filter: 'blur(14px)' }} />
      <Particles kind="portal" density={1.5} />
      <motion.div className="relative text-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: [0, 1, 1, 0] }} transition={{ duration: 4, times: [0, 0.2, 0.8, 1] }}>
        <div className="font-pixel text-sm tracking-[.3em] text-parchment/80 sm:text-base">{t('transition.unlocked')}</div>
        <div className="glow-text mt-2 font-pixel text-4xl sm:text-6xl" style={{ color: w.accent }}>{t(`world.${to}`)}</div>
        <div className="mt-2 text-parchment/85">{t(`world.${to}.topic`)}</div>
      </motion.div>
    </motion.div>
  )
}
