import { useState } from 'react'
import { Home, Play, Dumbbell, Lock, CheckCircle2, Circle, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useGame } from '../store/gameStore.ts'
import { useUi } from '../store/uiStore.ts'
import { useT } from '../i18n/useT.ts'
import { CATEGORIES, ISLANDS } from '../data/catalog.ts'
import { islandStats, storyPercent, storyViews } from '../lib/storyProgress.ts'
import { IslandMap } from './IslandMap.tsx'
import { Logo } from './Logo.tsx'
import { LanguageSelector } from './LanguageSelector.tsx'
import { audio } from '../lib/audio.ts'
import type { WorldId } from '../types.ts'


/** Story Mode's navigation hub: the archipelago, with each island's story status. */
export function StoryHub() {
  const t = useT()
  const g = useGame()
  const { mapFocus, setMapFocus, setDirectFocus } = useUi()
  const [selected, setSelected] = useState<WorldId | null>(mapFocus ?? g.activeWorld)
  const pct = storyPercent(g)
  const soundOn = g.audio.music || g.audio.sfx

  const enter = () => { audio.sfx('portal'); setMapFocus(null); g.setPhase('playing') }
  const practise = (id: WorldId) => {
    const cat = ISLANDS.find(i => i.id === id)!.category
    setDirectFocus(cat); g.setPhase('direct')
  }

  const panel = selected && (() => {
    const is = ISLANDS.find(i => i.id === selected)!
    const st = islandStats(g, selected)
    const cat = CATEGORIES.find(c => c.id === is.category)!
    const prev = ISLANDS.find(i => i.id === selected - 1)
    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-pixel text-xs uppercase tracking-wider text-parchment/60">{t('chapter', { n: is.id })} · {t(is.chapterKey)}</p>
          <h2 className="font-pixel text-2xl text-[var(--accent)]">{t(`world.${is.id}`)}</h2>
          <p className="text-parchment/80">{t(`world.${is.id}.topic`)}</p>
        </div>
        <p>{t(`island.${is.id}.desc`)}</p>
        <div>
          <p className="text-xs uppercase tracking-wider text-parchment/60">{t('map.topics')}</p>
          <ul className="mt-1 flex flex-wrap gap-1">{cat.topics.map(tp => <li key={tp} className="rounded-sm border border-white/10 bg-black/30 px-1.5 py-0.5 text-xs">{t(`topic.${tp}`)}</li>)}</ul>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-black/30 p-2"><div className="text-xs text-parchment/60">{t('map.status')}</div><b>{t(`map.${st.status === 'inProgress' ? 'inProgress' : st.status === 'completed' ? 'completed' : st.status === 'locked' ? 'locked' : 'available'}`)}</b></div>
          <div className="rounded bg-black/30 p-2"><div className="text-xs text-parchment/60">{t('map.mastery')}</div><b className="font-pixel">{st.mastery}</b></div>
        </div>
        <div>
          <div className="flex justify-between text-xs"><span>{t('map.progress')}</span><b>{st.progress}%</b></div>
          <div className="mt-1 h-2 overflow-hidden rounded-sm bg-black/40"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${st.progress}%` }} /></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><p className="text-xs text-parchment/60">{t('map.challengesDone')} ({st.done.length})</p>
            <ul>{st.done.length ? st.done.map(c => <li key={c} className="flex items-center gap-1"><CheckCircle2 size={13} className="text-good" />{t(c === 'crate' ? 'game.crate' : `act.${c}.name`)}</li>) : <li className="text-parchment/50">—</li>}</ul></div>
          <div><p className="text-xs text-parchment/60">{t('map.challengesLeft')} ({st.remaining.length})</p>
            <ul>{st.remaining.length ? st.remaining.map(c => <li key={c} className="flex items-center gap-1"><Circle size={13} className="text-parchment/50" />{t(c === 'crate' ? 'game.crate' : `act.${c}.name`)}</li>) : <li className="text-parchment/50">—</li>}</ul></div>
        </div>
        {st.status === 'locked' && prev && (
          <p className="flex items-start gap-2 rounded border border-warn/50 bg-warn/10 p-2"><Lock size={16} className="mt-0.5 shrink-0 text-warn" />{t('map.unlockHow', { boss: t(`island.${prev.id}.boss`), island: t(`world.${prev.id}`) })}</p>
        )}
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-parchment/60">{t('map.modes')}</p>
          <div className="grid gap-2">
            {(st.status === 'available' || st.status === 'inProgress') && (
              <button className="btn btn-gold" onClick={enter} autoFocus><Play size={16} aria-hidden />{st.status === 'available' ? t('map.enter') : t('map.resume')}</button>
            )}
            {st.status === 'completed' && <p className="flex items-center gap-2 text-good"><Trophy size={16} />{t('map.replayStory')}</p>}
            {st.status === 'locked' && <button className="btn" disabled><Lock size={16} aria-hidden />{t('modes.story')}</button>}
            <button className="btn btn-ghost" onClick={() => practise(selected)}><Dumbbell size={16} aria-hidden />{t('map.practice')}</button>
          </div>
        </div>
      </div>
    )
  })()

  return (
    <main className="relative h-full w-full">
      <IslandMap mode="story" views={storyViews(g)} selected={selected} onSelect={setSelected} panel={panel} />
      <header className="absolute inset-x-2 top-2 z-30 sm:inset-x-4 sm:top-3">
        <div className="panel-soft flex flex-wrap items-center gap-2 p-2 sm:gap-4">
          <Logo size="sm" tagline={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-pixel text-sm sm:text-base">{g.scorecard ? t('score.pass') : `${t('chapter', { n: g.activeWorld })} · ${t(`chapter.${g.activeWorld}`)}`}</p>
            <div className="flex items-center gap-2 text-xs text-parchment/70">
              <span>{t('hud.story')} {pct}%</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-black/40 sm:w-40"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
              <span className="hidden sm:inline">· {t('map.storyHint')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden md:block"><LanguageSelector compact /></div>
            <button className="btn btn-ghost btn-sm" aria-label={soundOn ? t('hud.soundOn') : t('hud.soundOff')} onClick={() => { audio.unlock(); g.setAudio({ music: !soundOn, sfx: !soundOn }) }}>{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
            {g.scorecard && <button className="btn btn-sm btn-gold" onClick={() => g.setPhase('ending')}><Trophy size={16} aria-hidden /></button>}
            <button className="btn btn-sm" onClick={() => g.setPhase('modes')} aria-label={t('map.back')}><Home size={16} aria-hidden /><span className="hidden sm:inline">{t('map.back')}</span></button>
          </div>
        </div>
      </header>
    </main>
  )
}
