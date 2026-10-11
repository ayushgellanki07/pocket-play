import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, LayoutGrid, Play, Sparkles, ArrowLeft, Check } from 'lucide-react'
import { useGame } from '../store/gameStore.ts'
import { useUi } from '../store/uiStore.ts'
import { useT } from '../i18n/useT.ts'
import { ACTIVITIES } from '../data/catalog.ts'
import { storyPercent } from '../lib/storyProgress.ts'
import { pappuImg } from '../data/worlds.ts'
import { Logo } from './Logo.tsx'
import { LanguageSelector } from './LanguageSelector.tsx'
import { audio } from '../lib/audio.ts'

/** The two ways to play, explained side by side before the player picks one. */
export function ModeSelect() {
  const t = useT()
  const g = useGame()
  const setDirectFocus = useUi(s => s.setDirectFocus)
  const [confirmNew, setConfirmNew] = useState(false)
  const doneTopics = ACTIVITIES.filter(a => g.direct.topics[a.id]?.completed).length
  const go = (fn: () => void) => { audio.unlock(); audio.sfx('click'); fn() }

  return (
    <main className="relative h-full w-full overflow-y-auto bg-ink">
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-35 blur-[2px]" style={{ backgroundImage: 'url(assets/map/archipelago_small.png)', imageRendering: 'pixelated' }} aria-hidden />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,15,43,.35),rgba(20,15,43,.95)_75%)]" aria-hidden />
      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col gap-5 px-4 py-5">
        <div className="flex items-center justify-between gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => g.setPhase('title')}><ArrowLeft size={16} aria-hidden />{t('common.back')}</button>
          <LanguageSelector compact />
        </div>
        <div className="text-center"><Logo size="md" /><h1 className="mt-3 font-pixel text-xl text-parchment/90 sm:text-2xl">{t('modes.title')}</h1></div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* STORY */}
          <motion.section initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="relative overflow-hidden rounded border-2 border-gold/70 bg-gradient-to-br from-[#3a2a12]/95 to-[#1c163a]/95 p-5 shadow-[0_0_40px_rgba(245,197,66,.18)]" aria-labelledby="mode-story">
            <img src={pappuImg('excited')} alt="" className="pixel pointer-events-none absolute -right-4 bottom-0 h-44 opacity-90 sm:h-56" />
            <div className="relative max-w-[78%]">
              <h2 id="mode-story" className="flex items-center gap-2 font-pixel text-2xl text-gold sm:text-3xl"><BookOpen aria-hidden />{t('modes.story')}</h2>
              <p className="mt-2 text-parchment/90">{t('modes.storyDesc')}</p>
              <ul className="mt-3 space-y-1 text-sm">{['modes.story1', 'modes.story2', 'modes.story3'].map(k => <li key={k} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-gold" />{t(k)}</li>)}</ul>
              {g.hasSave && <p className="mt-3 rounded-sm bg-black/30 px-2 py-1 text-xs text-parchment/80">{t('modes.storySaved', { name: g.playerName, n: g.activeWorld, pct: storyPercent(g) })}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {g.hasSave && <button className="btn btn-gold" onClick={() => go(g.continueGame)} autoFocus><Play size={16} aria-hidden />{t('modes.resumeStory')}</button>}
                {!confirmNew ? (
                  <button className={`btn ${g.hasSave ? 'btn-ghost' : 'btn-gold'}`} onClick={() => (g.hasSave ? setConfirmNew(true) : go(() => g.setPhase('setup')))} autoFocus={!g.hasSave}>
                    <Sparkles size={16} aria-hidden />{t('modes.newStory')}</button>
                ) : (
                  <div className="w-full rounded border border-warn/60 bg-warn/10 p-2 text-xs" role="alertdialog" aria-label={t('modes.newStory')}>
                    <p>{t('modes.newWarn')}</p>
                    <div className="mt-2 flex gap-2"><button className="btn btn-sm btn-bad" onClick={() => go(() => g.setPhase('setup'))}>{t('modes.newConfirm')}</button><button className="btn btn-sm btn-ghost" onClick={() => setConfirmNew(false)}>{t('common.cancel')}</button></div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* DIRECT */}
          <motion.section initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="relative overflow-hidden rounded border-2 border-cyan/70 bg-gradient-to-br from-[#0f3346]/95 to-[#1c163a]/95 p-5 shadow-[0_0_40px_rgba(62,230,240,.16)]" aria-labelledby="mode-direct">
            <div className="pointer-events-none absolute -right-2 bottom-2 grid grid-cols-3 gap-1.5 opacity-60" aria-hidden>
              {Array.from({ length: 9 }, (_, i) => <span key={i} className={`h-9 w-9 rounded-sm border-2 border-black ${doneTopics > i ? 'bg-good/80' : 'bg-cyan/30'}`} />)}
            </div>
            <div className="relative max-w-[78%]">
              <h2 id="mode-direct" className="flex items-center gap-2 font-pixel text-2xl text-cyan sm:text-3xl"><LayoutGrid aria-hidden />{t('modes.direct')}</h2>
              <p className="mt-2 text-parchment/90">{t('modes.directDesc')}</p>
              <ul className="mt-3 space-y-1 text-sm">{['modes.direct1', 'modes.direct2', 'modes.direct3'].map(k => <li key={k} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-cyan" />{t(k)}</li>)}</ul>
              <p className="mt-3 rounded-sm bg-black/30 px-2 py-1 text-xs text-parchment/80">{t('modes.directSaved', { done: doneTopics, total: ACTIVITIES.length })}</p>
              <div className="mt-4"><button className="btn" onClick={() => go(() => { setDirectFocus(null); g.setPhase('direct') })}><LayoutGrid size={16} aria-hidden />{t('modes.openLibrary')}</button></div>
            </div>
          </motion.section>
        </div>
        <p className="mx-auto max-w-2xl text-center text-sm text-parchment/70">{t('modes.separate')}</p>
      </div>
    </main>
  )
}
