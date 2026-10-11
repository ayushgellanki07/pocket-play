import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCw, HelpCircle, Volume2, VolumeX, Settings } from 'lucide-react'
import { useGame } from '../store/gameStore.ts'
import { useT } from '../i18n/useT.ts'
import { LanguageSelector } from './LanguageSelector.tsx'
import { SettingsPanel } from './PauseMenu.tsx'
import { Modal } from './ui/Modal.tsx'
import { Particles } from './ui/Particles.tsx'
import { audio } from '../lib/audio.ts'
import { pappuImg } from '../data/worlds.ts'
import { Logo } from './Logo.tsx'

/** Cinematic title: the real-world classroom and the frontier, split by a dimensional portal. */
export function TitleScreen() {
  const t = useT()
  const g = useGame()
  const [modal, setModal] = useState<null | 'help' | 'settings'>(null)
  const soundOn = g.audio.music || g.audio.sfx
  const start = (fn: () => void) => { audio.unlock(); audio.sfx('portal'); fn() }
  return (
    <main className="relative h-full w-full overflow-hidden bg-ink">
      {/* two worlds */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(assets/bg/bg_classroom.jpg)', clipPath: 'polygon(0 0,100% 0,85% 100%,0 100%)' }} aria-hidden />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-70" style={{ backgroundImage: 'url(assets/bg/bg_frontier_outpost.jpg)', clipPath: 'polygon(15% 0,100% 0,100% 100%,0 100%)' }} aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,15,43,.2),rgba(20,15,43,.92)_70%)]" aria-hidden />
      <Particles kind="portal" />
      <Particles kind="star" density={0.5} />

      <div className="relative z-10 flex h-full flex-col items-center justify-between px-4 py-6 text-center">
        <div className="flex w-full items-start justify-between gap-2">
          <span />
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button className="btn btn-ghost btn-sm" aria-label={soundOn ? t('hud.soundOn') : t('hud.soundOff')} onClick={() => { audio.unlock(); g.setAudio({ music: !soundOn, sfx: !soundOn }) }}>{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
          </div>
        </div>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }}>
          <h1 className="sr-only">PocketPlay</h1>
          <Logo size="lg" spin />
        </motion.div>

        {/* Hero: the portal and Pappu get their own row in the layout, so they can never slide under the buttons. */}
        <div className="relative flex min-h-[9rem] w-full flex-1 items-center justify-center py-3" aria-hidden>
          <div className="relative aspect-[0.75] h-full max-h-[44vh]">
            <div className="absolute inset-0 rounded-[50%] opacity-90" style={{ background: 'conic-gradient(from 0deg,#3ee6f0,#7a5cff,#f5c542,#ff5d6c,#3ee6f0)', animation: 'portal-spin 6s linear infinite', filter: 'blur(16px)' }} />
            {/* deep-indigo core (not white) so Pappu's yellow shirt and brown hair stand out against it */}
            <div className="absolute inset-[10%] rounded-[50%] bg-[radial-gradient(circle_at_50%_40%,#7fe9ff_0%,#4a3bb0_38%,#231a5c_70%,#140f2b_100%)]" />
            <div className="absolute bottom-[7%] left-1/2 h-[6%] w-[46%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-[3px]" />
            <motion.img src={pappuImg('excited')} alt="" className="pixel absolute bottom-[9%] left-1/2 h-[74%] w-auto max-w-none"
              initial={{ x: '-50%', y: 30, opacity: 0 }} animate={{ x: '-50%', y: [0, -6, 0], opacity: 1 }}
              transition={{ opacity: { delay: 0.6, duration: 0.6 }, y: { delay: 0.6, duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }}
              style={{ filter: 'drop-shadow(0 0 1.5px #0b0818) drop-shadow(0 0 3px rgba(255,236,190,.55)) drop-shadow(0 8px 10px rgba(0,0,0,.6))' }} />
          </div>
        </div>

        <motion.nav className="flex w-full max-w-sm flex-col gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} aria-label={t('aria.mainMenu')}>
          <button className="btn btn-gold py-3 text-lg" onClick={() => start(() => g.setPhase('modes'))} autoFocus><Play size={18} aria-hidden />{t('title.play')}</button>
          {g.hasSave && (
            <>
              <button className="btn btn-ghost py-2" onClick={() => start(g.continueGame)}><RotateCw size={16} aria-hidden />{t('title.continueStory')}</button>
              <p className="-mt-1 text-xs text-parchment/70">{t('title.savedAs', { name: g.playerName, world: g.activeWorld })}</p>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-ghost" onClick={() => { audio.unlock(); setModal('help') }}><HelpCircle size={16} aria-hidden />{t('title.instructions')}</button>
            <button className="btn btn-ghost" onClick={() => { audio.unlock(); setModal('settings') }}><Settings size={16} aria-hidden />{t('title.sound')}</button>
          </div>
          <p className="mt-2 text-[11px] text-parchment/50">{t('disclaimer')}</p>
        </motion.nav>
      </div>

      {modal === 'help' && (
        <Modal title={t('title.instructions')} onClose={() => setModal(null)} labelClose={t('common.close')}>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed sm:text-base">
            {['title.howto1', 'title.howto2', 'title.howto3', 'title.howto4'].map(k => <li key={k}>{t(k)}</li>)}
          </ol>
        </Modal>
      )}
      {modal === 'settings' && <Modal title={t('title.sound')} onClose={() => setModal(null)} labelClose={t('common.close')}><SettingsPanel /></Modal>}
    </main>
  )
}
