import { motion, useReducedMotion } from 'framer-motion'
import { Lock, Award, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Island } from '../data/catalog.ts'
import { WORLDS, pappuImg } from '../data/worlds.ts'
import { useT } from '../i18n/useT.ts'
import { Particles } from './ui/Particles.tsx'
import { audio } from '../lib/audio.ts'
import type { WorldId } from '../types.ts'

export type IslandStatus = 'locked' | 'available' | 'inProgress' | 'completed'
export interface IslandView { island: Island; status: IslandStatus; progress: number }

const STATUS_KEY: Record<IslandStatus, string> = { locked: 'map.locked', available: 'map.available', inProgress: 'map.inProgress', completed: 'map.completed' }
const STATUS_COLOR: Record<IslandStatus, string> = { locked: '#9a94b0', available: '#3ee6f0', inProgress: '#f5c542', completed: '#52e08a' }

/** A small pixel cloud that drifts across the map. */
function Cloud({ top, dur, delay, scale }: { top: number; dur: number; delay: number; scale: number }) {
  return (
    <div className="pointer-events-none absolute left-0" style={{ top: `${top}%`, animation: `drift ${dur}s linear ${delay}s infinite`, transform: `scale(${scale})` }} aria-hidden>
      <svg viewBox="0 0 24 10" width={96} shape-rendering="crispEdges" className="opacity-80">
        <rect x="4" y="4" width="16" height="5" fill="#f4f6ff" /><rect x="7" y="1" width="7" height="4" fill="#f4f6ff" /><rect x="13" y="2" width="5" height="3" fill="#f4f6ff" />
        <rect x="4" y="8" width="16" height="1" fill="#c9d2f0" />
      </svg>
    </div>
  )
}

/** A little sailing boat that bobs along a straight course. */
function Boat({ x1, x2, y, dur, flip = false }: { x1: number; x2: number; y: number; dur: number; flip?: boolean }) {
  return (
    <div className="pointer-events-none absolute" style={{ top: `${y}%`, ['--x1' as string]: `${x1}%`, ['--x2' as string]: `${x2}%`, animation: `sail ${dur}s ease-in-out infinite alternate` }} aria-hidden>
      <svg viewBox="0 0 12 10" width={30} shape-rendering="crispEdges" style={{ animation: 'bob 2.2s ease-in-out infinite', transform: flip ? 'scaleX(-1)' : undefined }}>
        <rect x="5" y="0" width="1" height="7" fill="#5a3a1a" /><polygon points="6,1 11,6 6,6" fill="#f3ead7" /><polygon points="5,2 1,6 5,6" fill="#e05a4a" />
        <rect x="1" y="7" width="10" height="2" fill="#8a5a2b" /><rect x="2" y="9" width="8" height="1" fill="#5a3a1a" />
      </svg>
    </div>
  )
}

/**
 * The PocketPlay archipelago. Pure presentation: the caller decides each island's status
 * (Story progress or Direct Mode progress) and what the side panel shows.
 */
export function IslandMap({ views, selected, onSelect, mode, panel, mobileTop = '6.5rem' }: {
  views: IslandView[]; selected: WorldId | null; onSelect: (id: WorldId | null) => void; mode: 'story' | 'direct'; panel?: ReactNode; mobileTop?: string
}) {
  const t = useT()
  // Phones: no zoom (it would crop islands) and the map sits at the top, above the bottom-sheet panel.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  const reduce = useReducedMotion()
  const noZoom = reduce || narrow
  const sel = views.find(v => v.island.id === selected)
  // Glowing routes between consecutive islands. Lit once both ends are open (always lit in Direct Mode).
  const routes = views.slice(0, -1).map((v, i) => {
    const n = views[i + 1]
    const lit = mode === 'direct' || n.status !== 'locked'
    const a = v.island, b = n.island
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 6
    return { key: a.id, d: `M ${a.x} ${a.y * 0.5625} Q ${mx} ${my * 0.5625} ${b.x} ${b.y * 0.5625}`, lit }
  })
  const zoom = sel && !noZoom
    ? { transformOrigin: `${sel.island.x}% ${sel.island.y}%`, transform: `translate(${(42 - sel.island.x) * 0.45}%, ${(50 - sel.island.y) * 0.35}%) scale(1.28)` }
    : { transformOrigin: '50% 50%', transform: 'none' }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#10305a]">
      <style>{`
        @keyframes drift { from { transform: translateX(-140px) } to { transform: translateX(110vw) } }
        @keyframes sail { from { left: var(--x1) } to { left: var(--x2) } }
        @keyframes bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes shimmer { from { background-position: 0 0 } to { background-position: 160px 80px } }
        @keyframes dash { to { stroke-dashoffset: -4 } }
        @keyframes pulse-ring { 0% { transform: scale(.8); opacity: .9 } 100% { transform: scale(1.6); opacity: 0 } }
      `}</style>
      {/* The map keeps a 16:9 ratio and is centred; the ocean colour fills any spare space. */}
      <div className="absolute left-1/2 top-[var(--mt)] aspect-[16/9] w-[min(100%,calc(100dvh*16/9))] -translate-x-1/2 md:top-1/2 md:-translate-y-1/2" style={{ ['--mt' as string]: mobileTop }}>
        <div className="absolute inset-0 transition-transform duration-700 ease-out" style={zoom}>
          <img src="assets/map/archipelago.png" alt="" className="pixel absolute inset-0 h-full w-full select-none" draggable={false} />
          {/* animated light on the water */}
          <div className="pointer-events-none absolute inset-0 opacity-[.10] mix-blend-screen" aria-hidden
            style={{ backgroundImage: 'repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 22px)', animation: reduce ? undefined : 'shimmer 9s linear infinite' }} />
          <Particles kind="sparkle" density={0.35} />
          {/* routes */}
          <svg viewBox="0 0 100 56.25" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {routes.map(r => (
              <g key={r.key}>
                {r.lit && <path d={r.d} fill="none" stroke="#f5c542" strokeOpacity=".35" strokeWidth="1.2" style={{ filter: 'blur(.6px)' }} />}
                <path d={r.d} fill="none" stroke={r.lit ? '#ffe08a' : '#9a94b0'} strokeOpacity={r.lit ? 0.95 : 0.45} strokeWidth=".45" strokeDasharray="1.2 0.8"
                  style={{ animation: r.lit && !reduce ? 'dash 1.4s linear infinite' : undefined }} />
              </g>
            ))}
          </svg>
          <Boat x1={22} x2={40} y={88} dur={16} />
          <Boat x1={82} x2={66} y={70} dur={19} flip />
          <Boat x1={8} x2={20} y={38} dur={14} />
          {/* islands */}
          {views.map(v => {
            const { island: is, status } = v
            const w = WORLDS[is.id]
            const isSel = selected === is.id
            return (
              <div key={is.id} className="absolute" style={{ left: `${is.x}%`, top: `${is.y}%`, width: `${is.hit}%`, transform: 'translate(-50%,-50%)' }}>
                {status === 'locked' && <div className="pointer-events-none absolute inset-[-8%] rounded-[50%] bg-[#0b0818]/60 backdrop-grayscale" aria-hidden />}
                {(status === 'inProgress' || status === 'available') && (
                  <span className="pointer-events-none absolute inset-0 rounded-[50%] border-2" style={{ borderColor: STATUS_COLOR[status], animation: reduce ? undefined : 'pulse-ring 1.8s ease-out infinite' }} aria-hidden />
                )}
                <button
                  onClick={() => { audio.sfx('click'); onSelect(isSel ? null : is.id) }}
                  aria-pressed={isSel}
                  aria-label={`${t(`world.${is.id}`)} — ${t(STATUS_KEY[status])}, ${v.progress}%`}
                  className={`relative block aspect-[1.5] w-full rounded-[50%] transition-[background,box-shadow] duration-300 ${isSel ? 'bg-white/10 shadow-[0_0_40px_rgba(245,197,66,.6)]' : 'hover:bg-white/10'}`}
                >
                  {/* status emblem */}
                  <span className="absolute left-1/2 top-[-6%] flex -translate-x-1/2 -translate-y-full items-center justify-center">
                    {status === 'locked' && <span className="rounded-full border-2 border-black bg-[#2a2152] p-1.5"><Lock size={16} className="text-parchment/80" /></span>}
                    {status === 'completed' && <span className="rounded-full border-2 border-black bg-good p-1.5 shadow-[0_0_14px_#52e08a]"><Award size={18} className="text-ink" /></span>}
                    {status === 'available' && <ChevronDown size={28} className="text-cyan drop-shadow-[0_2px_0_#000]" style={{ animation: reduce ? undefined : 'bob 1.2s ease-in-out infinite' }} />}
                    {status === 'inProgress' && mode === 'story' && (
                      <span className="h-12 w-12 overflow-hidden rounded-full border-2 border-gold bg-ink-3 shadow-[0_0_14px_#f5c542]" title={t('map.current')}>
                        <img src={pappuImg('excited')} alt="" className="pixel h-[260%] w-auto max-w-none -translate-x-[22%] -translate-y-[3%]" />
                      </span>
                    )}
                  </span>
                </button>
                {/* name banner */}
                <div className="pointer-events-none absolute left-1/2 top-[96%] -translate-x-1/2 whitespace-nowrap rounded-sm border-2 border-black px-2 py-0.5 text-center shadow-[0_3px_0_#0b0818]"
                  style={{ background: status === 'locked' ? '#2a2152' : '#1c163a' }}>
                  <div className="font-pixel text-[11px] leading-tight sm:text-sm" style={{ color: status === 'locked' ? '#9a94b0' : w.accent }}>{is.id}. {t(`world.${is.id}`)}</div>
                  <div className="text-[9px] leading-tight sm:text-[11px]" style={{ color: STATUS_COLOR[status] }}>{t(STATUS_KEY[status])}{status !== 'locked' ? ` · ${v.progress}%` : ''}</div>
                </div>
              </div>
            )
          })}
          {!reduce && [{ top: 6, dur: 70, delay: -10, scale: 1 }, { top: 30, dur: 95, delay: -60, scale: 0.7 }, { top: 58, dur: 80, delay: -30, scale: 0.85 }, { top: 82, dur: 110, delay: -80, scale: 0.6 }].map((c, i) => <Cloud key={i} {...c} />)}
        </div>
      </div>
      {/* info panel: right side on desktop, bottom sheet on phones */}
      {sel && panel && (
        <motion.aside key={sel.island.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="panel scroll-thin absolute inset-x-2 bottom-2 z-20 max-h-[58%] overflow-y-auto p-4 md:inset-x-auto md:bottom-auto md:right-4 md:top-24 md:max-h-[calc(100%-7rem)] md:w-[380px]"
          style={{ ['--accent' as string]: WORLDS[sel.island.id].accent }} aria-label={t(`world.${sel.island.id}`)}>
          {panel}
        </motion.aside>
      )}
    </div>
  )
}
