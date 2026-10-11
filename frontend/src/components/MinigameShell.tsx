import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import { usePlayMode } from '../minigames/PlayContext.tsx'

/** Frame shared by every minigame: title, instructions, optional timer/score slot. */
export function MinigameShell({ title, help, right, children }: { title: string; help: string; right?: ReactNode; children: ReactNode }) {
  // Story Mode leaves room for the HUD; Direct Mode only has a slim practice bar.
  const pad = usePlayMode() === 'direct' ? 'pt-14 sm:pt-16' : 'pt-[15.5rem] sm:pt-28'
  return (
    <motion.section
      className={`absolute inset-0 z-30 flex items-stretch justify-center bg-black/55 p-2 backdrop-blur-[2px] sm:p-4 ${pad}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label={title}
    >
      <motion.div className="panel flex w-full max-w-6xl flex-col overflow-hidden" initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', damping: 24 }}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-[var(--accent)]" aria-hidden />
            <h2 className="font-pixel text-lg text-[var(--accent)] sm:text-2xl">{title}</h2>
          </div>
          {right}
        </header>
        <p className="border-b border-white/5 px-4 py-2 text-sm text-parchment/80">{help}</p>
        <div className="scroll-thin flex-1 overflow-y-auto p-3 sm:p-5">{children}</div>
      </motion.div>
    </motion.section>
  )
}
