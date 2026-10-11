import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useGame } from '../store/gameStore.ts'
import { useT } from '../i18n/useT.ts'
import { pappuImg } from '../data/worlds.ts'
import { Particles } from './ui/Particles.tsx'
import { audio } from '../lib/audio.ts'

export function CharacterSetup() {
  const t = useT()
  const newGame = useGame(s => s.newGame)
  const setPhase = useGame(s => s.setPhase)
  const [name, setName] = useState('')
  const begin = (e: React.FormEvent) => {
    e.preventDefault()
    audio.unlock(); audio.sfx('portal')
    newGame(name.trim() || t('setup.placeholder'))
  }
  return (
    <main className="relative flex h-full w-full items-center justify-center overflow-hidden bg-cover bg-center p-4" style={{ backgroundImage: 'url(assets/bg/bg_classroom.jpg)' }}>
      <div className="absolute inset-0 bg-ink/70" aria-hidden />
      <div className="glitch absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(62,230,240,.08)_0_2px,transparent_2px_40px)]" aria-hidden />
      <Particles kind="portal" />
      <motion.form onSubmit={begin} className="panel relative z-10 grid w-full max-w-3xl items-center gap-4 p-5 sm:grid-cols-[220px_1fr] sm:p-8" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <img src={pappuImg(name ? 'excited' : 'neutral')} alt="" className="pixel float mx-auto h-56 sm:h-80" />
        <div>
          <h1 className="font-pixel text-2xl text-cyan sm:text-3xl">{t('setup.title')}</h1>
          <p className="mt-2 italic text-parchment/80">{t('setup.intro')}</p>
          <label className="mt-5 block text-sm font-semibold" htmlFor="pname">{t('setup.prompt')}</label>
          <input id="pname" value={name} maxLength={18} onChange={e => setName(e.target.value)} placeholder={t('setup.placeholder')} autoFocus autoComplete="off"
            className="mt-1 w-full rounded-sm border-2 border-cyan/50 bg-black/40 px-3 py-2 font-pixel text-xl text-parchment outline-none focus:border-gold" />
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setPhase('title')}><ArrowLeft size={16} aria-hidden />{t('common.back')}</button>
            <button type="submit" className="btn btn-gold"><Sparkles size={16} aria-hidden />{t('setup.begin')}</button>
          </div>
        </div>
      </motion.form>
    </main>
  )
}
