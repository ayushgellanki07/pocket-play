import { Wallet, Shield, Gauge, Star, ScrollText, Map, Pause, Volume2, VolumeX, Target, BookOpen, ChevronsRight } from 'lucide-react'
import { storyPercent } from '../lib/storyProgress.ts'
import { useGame } from '../store/gameStore.ts'
import { useUi } from '../store/uiStore.ts'
import { useT } from '../i18n/useT.ts'
import { inr } from '../lib/finance.ts'
import { AnimatedNumber } from './ui/AnimatedNumber.tsx'
import { LanguageSelector } from './LanguageSelector.tsx'
import { pappuImg } from '../data/worlds.ts'
import { audio } from '../lib/audio.ts'
import type { ReactNode } from 'react'

/** One HUD stat. Solid background + always-visible label so it reads over any island art. */
function Stat({ icon, label, children, tone, sub }: { icon: ReactNode; label: string; children: ReactNode; tone: string; sub?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-sm border-2 bg-[#0c0820]/95 px-2 py-1 shadow-[inset_3px_0_0_var(--tone)] sm:px-3 sm:py-1.5"
      style={{ borderColor: `color-mix(in srgb, ${tone} 55%, #0b0818)`, ['--tone' as string]: tone }}>
      <span className="shrink-0" style={{ color: tone }} aria-hidden>{icon}</span>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[10px] font-bold uppercase tracking-wider sm:text-[11px]" style={{ color: tone }}>{label}</div>
        <div className="flex items-baseline gap-1.5 font-pixel text-base font-bold text-white sm:text-xl" style={{ textShadow: '0 2px 0 #000' }}>
          <span className="sr-only">{label}: </span>{children}
          {sub && <span className="hidden text-[11px] font-semibold sm:inline" style={{ color: tone }}>{sub}</span>}
        </div>
      </div>
    </div>
  )
}

const scoreColor = (s: number) => (s >= 750 ? '#52e08a' : s >= 650 ? '#ffb547' : '#ff5d6c')
const scoreBand = (s: number) => (s >= 750 ? 'band.good' : s >= 650 ? 'band.fair' : 'band.low')

/** The persistent HUD. Every number is read straight from the game store. */
export function FinancialHUD({ objective, next }: { objective: string; next: string }) {
  const t = useT()
  const g = useGame()
  const setOverlay = useUi(s => s.setOverlay)
  const toggleSound = () => {
    const on = !(g.audio.music || g.audio.sfx)
    g.setAudio({ music: on, sfx: on })
    audio.unlock()
  }
  const soundOn = g.audio.music || g.audio.sfx
  return (
    <header className="absolute inset-x-0 top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="flex flex-wrap items-center gap-2 rounded border border-white/15 bg-[#140f2b]/90 p-1.5 shadow-[0_6px_20px_rgba(0,0,0,.45)] backdrop-blur-md sm:flex-nowrap sm:gap-3 sm:p-2">
        <div className="flex items-center gap-2 pr-1">
          <div className="h-10 w-10 overflow-hidden rounded-sm border-2 border-[var(--accent)]/60 bg-ink-3">
            <img src={pappuImg('neutral')} alt="" className="pixel h-[260%] w-auto max-w-none -translate-x-[22%] -translate-y-[4%]" />
          </div>
          <div className="leading-tight">
            <div className="max-w-[8rem] truncate font-pixel text-sm sm:text-base">{g.playerName}</div>
            <div className="text-[11px] text-[var(--accent)]">{t('chapter', { n: g.activeWorld })} · {t(`world.${g.activeWorld}`)}</div>
          </div>
        </div>
        <div className="order-3 grid w-full grid-cols-2 gap-1.5 sm:order-none sm:w-auto sm:flex-1 sm:grid-cols-4 sm:gap-2">
          <Stat icon={<Wallet size={20} />} label={t('hud.wallet')} tone="#f5c542"><AnimatedNumber value={g.wallet} format={n => inr(n)} /></Stat>
          <Stat icon={<Shield size={20} />} label={t('hud.reserve')} tone="#52e08a"><AnimatedNumber value={g.reserve} format={n => inr(n)} /></Stat>
          <Stat icon={<Gauge size={20} />} label={t('hud.cibil')} tone={scoreColor(g.cibilScore)} sub={t(scoreBand(g.cibilScore))}><AnimatedNumber value={g.cibilScore} format={n => String(Math.round(n))} /></Stat>
          <Stat icon={<Star size={20} />} label={t('hud.mastery')} tone="#7ef0ff"><AnimatedNumber value={g.masteryPoints} format={n => String(Math.round(n))} /></Stat>
        </div>
        <nav className="order-2 ml-auto flex items-center gap-1 sm:order-none" aria-label={t('aria.gameMenu')}>
          <div className="hidden md:block"><LanguageSelector compact /></div>
          <button className="btn btn-ghost btn-sm" onClick={() => setOverlay('ledger')} aria-label={t('hud.ledger')}><ScrollText size={16} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => g.setPhase('map')} aria-label={t('hud.mapHub')}><Map size={16} /></button>
          <button className="btn btn-ghost btn-sm" onClick={toggleSound} aria-label={soundOn ? t('hud.soundOn') : t('hud.soundOff')}>{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
          <button className="btn btn-sm" onClick={() => setOverlay('pause')} aria-label={t('hud.pause')}><Pause size={16} /></button>
        </nav>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <div className="inline-flex max-w-full items-center gap-2 rounded-sm border border-[var(--accent-2)]/40 bg-black/55 px-3 py-1 text-xs sm:text-sm" aria-live="polite">
          <Target size={14} className="shrink-0 text-[var(--accent-2)]" aria-hidden />
          <span className="text-parchment/60">{t('hud.objective')}:</span><span className="truncate font-semibold">{objective}</span>
        </div>
        <div className="hidden items-center gap-2 rounded-sm border border-white/10 bg-black/55 px-3 py-1 text-xs lg:inline-flex">
          <ChevronsRight size={14} className="text-parchment/60" aria-hidden /><span className="text-parchment/60">{t('hud.next')}:</span><span className="max-w-[16rem] truncate">{next}</span>
        </div>
        <div className="hidden items-center gap-2 rounded-sm border border-white/10 bg-black/55 px-3 py-1 text-xs sm:inline-flex" title={t(`chapter.${g.activeWorld}`)}>
          <BookOpen size={14} className="text-gold" aria-hidden /><span>{t(`chapter.${g.activeWorld}`)}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-sm bg-black/40"><div className="h-full bg-gold" style={{ width: `${storyPercent(g)}%` }} /></div>
          <span className="tabular-nums">{storyPercent(g)}%</span>
        </div>
      </div>
    </header>
  )
}
