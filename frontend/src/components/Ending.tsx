import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { RotateCw, Home } from 'lucide-react'
import { useGame } from '../store/gameStore.ts'
import { useT } from '../i18n/useT.ts'
import { pappuImg } from '../data/worlds.ts'
import { MasteryScorecard } from './MasteryScorecard.tsx'
import { Logo } from './Logo.tsx'
import { audio } from '../lib/audio.ts'

/** Fade to white → back at the classroom desk → message + scorecard + replay. */
export function Ending() {
  const t = useT()
  const card = useGame(s => s.scorecard)
  const name = useGame(s => s.playerName)
  const reset = useGame(s => s.resetProgress)
  const setPhase = useGame(s => s.setPhase)
  useEffect(() => { audio.sfx('victory') }, [])
  return (
    <main className="relative h-full w-full overflow-y-auto bg-cover bg-center" style={{ backgroundImage: 'url(assets/bg/bg_classroom.jpg)' }}>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" aria-hidden />
      <div className="relative mx-auto grid min-h-full max-w-6xl items-center gap-6 p-4 py-10 md:grid-cols-[1fr_1.1fr]">
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }}>
          <Logo size="md" />
          <img src={pappuImg('success')} alt={name} className="pixel mx-auto h-64 sm:h-96" />
          <p className="glow-text mt-4 font-pixel text-2xl text-parchment sm:text-3xl">"{t('end.message')}"</p>
        </motion.div>
        {card && (
          <motion.section className="panel p-5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3 }} aria-label={t('score.title')}>
            <h2 className="mb-3 font-pixel text-2xl text-cyan">{t('score.title')} — {name}</h2>
            <MasteryScorecard card={card} />
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn btn-gold" onClick={() => { reset(); setPhase('setup') }}><RotateCw size={16} aria-hidden />{t('end.replay')}</button>
              <button className="btn btn-ghost" onClick={() => setPhase('modes')}><Home size={16} aria-hidden />{t('pause.mainMenu')}</button>
            </div>
          </motion.section>
        )}
      </div>
      {/* fade-to-white curtain */}
      <motion.div className="pointer-events-none fixed inset-0 bg-white" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1, duration: 1.6 }} aria-hidden />
    </main>
  )
}
