import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Particles } from './ui/Particles.tsx'
import type { WorldConfig } from '../data/worlds.ts'

/** World-specific animated set dressing layered over the illustration. */
function WorldLayer({ world }: { world: WorldConfig }) {
  switch (world.id) {
    case 1: // holographic glitch band over the frontier sky
      return <div className="glitch absolute inset-x-0 top-[12%] h-[18%] bg-gradient-to-r from-transparent via-cyan/25 to-transparent mix-blend-screen" aria-hidden />
    case 2: // pulsing security seals
      return (<>
        {[18, 50, 82].map(x => <div key={x} className="absolute top-[30%] h-16 w-16 animate-pulse rounded-full border-4 border-[#5aa9ff]/40 shadow-[0_0_30px_#5aa9ff66]" style={{ left: `${x}%` }} aria-hidden />)}
      </>)
    case 3: // flickering red lantern glow
      return <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,40,60,.18),transparent_60%)]" aria-hidden />
    case 4: // scrolling ticker tape (illustrative numbers, not live data)
      return (
        <div className="absolute inset-x-0 bottom-[38%] overflow-hidden border-y border-[#4fdc8f]/30 bg-black/50 py-1 font-mono text-xs sm:text-sm" aria-hidden>
          <div className="whitespace-nowrap" aria-hidden style={{ animation: 'ticker 28s linear infinite' }}>
            {'NIFTY 50 (sim) ▲0.8% · SOLARGRID ▲1.2% · HYPERVAPOR ▼4.6% · GOLD ▲0.3% · INDEX-ETF ▲0.7% · '.repeat(4)}
          </div>
          <style>{'@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }'}</style>
        </div>
      )
    case 5: // slowly orbiting golden ring
      return <div className="absolute left-1/2 top-[18%] h-[38vmin] w-[38vmin] -translate-x-1/2 rounded-full border-2 border-[#f5d26b]/40 shadow-[0_0_40px_#f5d26b33]" style={{ animation: 'portal-spin 40s linear infinite' }} aria-hidden />
  }
}

/** Full-screen world art with gentle mouse parallax, mood tint, vignette and particles. */
export function ParallaxBackground({ world }: { world: WorldConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * -18
      const y = (e.clientY / window.innerHeight - 0.5) * -10
      if (ref.current) ref.current.style.transform = `scale(1.06) translate(${x}px, ${y}px)`
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduce])
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" aria-hidden>
      <div ref={ref} className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out" style={{ backgroundImage: `url(${world.bg})`, transform: 'scale(1.06)' }} />
      <div className="absolute inset-0" style={{ background: world.tint }} />
      <WorldLayer world={world} />
      <Particles kind={world.particle} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,6,25,.75))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/90 to-transparent" />
    </div>
  )
}
