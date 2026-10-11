import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useFx, type FxTone } from '../store/fxStore.ts'

const TONE: Record<FxTone, string> = {
  income: '#f5c542', expense: '#ff5d6c', saving: '#52e08a', loss: '#ff5d6c', shield: '#7ef0ff', invest: '#4fdc8f', unlock: '#c99bff', info: '#f3ead7',
}

/** Floating notifications + a coin shower that flies toward the wallet in the HUD. */
export function FxLayer() {
  const items = useFx(s => s.items)
  const coins = useFx(s => s.coins)
  const [showers, setShowers] = useState<number[]>([])
  useEffect(() => {
    if (!coins) return
    setShowers(s => [...s, coins])
    const id = setTimeout(() => setShowers(s => s.filter(x => x !== coins)), 1600)
    return () => clearTimeout(id)
  }, [coins])
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-live="polite">
      <div className="absolute left-1/2 top-[18%] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {items.map(i => (
            <motion.div key={i.id} initial={{ y: 20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }}
              className="rounded-sm border-2 border-black bg-ink/90 px-4 py-1.5 font-pixel text-lg shadow-lg sm:text-xl" style={{ color: TONE[i.tone], boxShadow: `0 0 24px ${TONE[i.tone]}55` }}>
              {i.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {showers.map(s => (
        <div key={s} aria-hidden>
          {Array.from({ length: 18 }, (_, k) => (
            <motion.span key={k} className="absolute block h-4 w-4 rounded-full border-2 border-[#8a5a00] bg-gold shadow-[0_0_10px_#f5c542]"
              initial={{ left: '50%', top: '60%', opacity: 1, scale: 1 }}
              animate={{ left: ['50%', `${40 + Math.random() * 20}%`, '30%'], top: ['60%', `${30 + Math.random() * 20}%`, '3%'], opacity: [1, 1, 0], scale: [1, 1.2, 0.5] }}
              transition={{ duration: 1.1 + Math.random() * 0.4, delay: k * 0.03, ease: 'easeInOut' }} />
          ))}
        </div>
      ))}
    </div>
  )
}
