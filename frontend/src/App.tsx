import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from './store/gameStore.ts'
import { audio } from './lib/audio.ts'
import { TitleScreen } from './components/TitleScreen.tsx'
import { CharacterSetup } from './components/CharacterSetup.tsx'
import { GameShell } from './components/GameShell.tsx'
import { Ending } from './components/Ending.tsx'
import { FxLayer } from './components/FxLayer.tsx'
import { ModeSelect } from './components/ModeSelect.tsx'
import { StoryHub } from './components/StoryHub.tsx'
import { DirectMode } from './components/DirectMode.tsx'

/** Top-level router between the four phases of the game. */
export default function App() {
  const phase = useGame(s => s.phase)
  const lang = useGame(s => s.language)
  const world = useGame(s => s.activeWorld)
  const prefs = useGame(s => s.audio)

  useEffect(() => { document.documentElement.lang = lang }, [lang])
  useEffect(() => { audio.setPrefs(prefs.music, prefs.sfx, prefs.volume) }, [prefs])
  // Music: each island in Story Mode, the final citadel at the ending, the title theme elsewhere.
  useEffect(() => { audio.playMusic(phase === 'playing' ? world : phase === 'ending' ? 5 : 0) }, [phase, world])

  // Browsers block audio until the first interaction; unlock on the first click/key.
  useEffect(() => {
    const once = () => audio.unlock()
    window.addEventListener('pointerdown', once, { once: true })
    window.addEventListener('keydown', once, { once: true })
    return () => { window.removeEventListener('pointerdown', once); window.removeEventListener('keydown', once) }
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={phase} className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          {phase === 'title' && <TitleScreen />}
          {phase === 'modes' && <ModeSelect />}
          {phase === 'map' && <StoryHub />}
          {phase === 'direct' && <DirectMode />}
          {phase === 'setup' && <CharacterSetup />}
          {(phase === 'playing' || phase === 'transition') && <GameShell />}
          {phase === 'ending' && <Ending />}
        </motion.div>
      </AnimatePresence>
      <FxLayer />
    </>
  )
}
