import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, LayoutGrid, Map as MapIcon, Home, Play, RotateCcw, Clock, Target, Trophy, ArrowRight, X, BookOpen, Sigma, Lightbulb, ChevronRight, Wallet, Shield, Gauge } from 'lucide-react'
import { useGame } from '../store/gameStore.ts'
import { useUi } from '../store/uiStore.ts'
import { useT } from '../i18n/useT.ts'
import { ACTIVITIES, CATEGORIES, DEFAULT_START, ISLANDS, activitiesIn, activityById, relatedActivity, type Activity, type CategoryId, type Difficulty } from '../data/catalog.ts'
import { CHARACTERS, WORLDS } from '../data/worlds.ts'
import { LEARNING } from '../data/learning.ts'
import { MINIGAMES } from '../minigames/index.ts'
import { DirectPlayProvider, usePlay, type Report } from '../minigames/PlayContext.tsx'
import { IslandMap, type IslandView } from './IslandMap.tsx'
import { LearningExtra } from './LearningWidget.tsx'
import { Logo } from './Logo.tsx'
import { LanguageSelector } from './LanguageSelector.tsx'
import { inr } from '../lib/finance.ts'
import { audio } from '../lib/audio.ts'
import type { DirectProgress, WorldId } from '../types.ts'

const islandOf = (c: CategoryId) => CATEGORIES.find(x => x.id === c)!.island
const DIFF_COLOR: Record<Difficulty, string> = { beginner: '#52e08a', intermediate: '#ffb547', advanced: '#ff5d6c' }

function statusOf(p: DirectProgress, id: string) {
  const r = p.topics[id]
  return !r ? 'new' : r.completed ? 'done' : 'tried'
}

/** Direct Mode: free access to every activity, with its own progress record. */
export function DirectMode() {
  const t = useT()
  const g = useGame()
  const focus = useUi(s => s.directFocus)
  const [view, setView] = useState<'library' | 'islands'>('library')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoryId | 'all'>(focus ?? 'all')
  const [diff, setDiff] = useState<Difficulty | 'all'>('all')
  const [running, setRunning] = useState<string | null>(null)
  const [selIsland, setSelIsland] = useState<WorldId | null>(focus ? islandOf(focus) : null)
  const p = g.direct

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return ACTIVITIES.filter(a =>
      (cat === 'all' || a.category === cat) && (diff === 'all' || a.difficulty === diff) &&
      (!needle || [t(`act.${a.id}.name`), t(`act.${a.id}.desc`), t(`type.${a.type}`), ...a.topics.map(k => t(`topic.${k}`)), t(`cat.${a.category}`)].some(s => s.toLowerCase().includes(needle))))
  }, [q, cat, diff, t])

  const continueId = p.recent.find(id => !p.topics[id]?.completed) ?? ACTIVITIES.find(a => !p.topics[a.id])?.id
  const start = (id: string) => { audio.sfx('click'); setRunning(id) }

  if (running) {
    const a = activityById(running)!
    return <DirectRunner key={running} activity={a} onExit={() => setRunning(null)} onOpen={id => setRunning(id)} />
  }

  const islandViews: IslandView[] = ISLANDS.map(island => {
    const acts = activitiesIn(island.category)
    const done = acts.filter(a => p.topics[a.id]?.completed).length
    const tried = acts.some(a => p.topics[a.id])
    return { island, status: done === acts.length ? 'completed' : tried ? 'inProgress' : 'available', progress: Math.round((done / acts.length) * 100) }
  })

  const card = (a: Activity) => {
    const r = p.topics[a.id]
    const st = statusOf(p, a.id)
    const w = WORLDS[islandOf(a.category)]
    return (
      <article key={a.id} className="flex flex-col rounded border-2 border-white/10 bg-[#1c163a]/90 p-3 transition-colors hover:border-[var(--c)]" style={{ ['--c' as string]: w.accent }}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-pixel text-lg leading-tight" style={{ color: w.accent }}>{t(`act.${a.id}.name`)}</h3>
          <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase ${st === 'done' ? 'bg-good text-ink' : st === 'tried' ? 'bg-warn text-ink' : 'bg-white/10'}`}>
            {st === 'done' ? t('direct.done') : st === 'tried' ? t('direct.tried') : t('direct.notStarted')}</span>
        </div>
        <p className="mt-1 text-sm text-parchment/85">{t(`act.${a.id}.desc`)}</p>
        <p className="mt-2 flex gap-1.5 text-xs text-parchment/70"><Target size={14} className="mt-0.5 shrink-0" aria-hidden />{t(`act.${a.id}.obj`)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-sm border px-1.5" style={{ borderColor: DIFF_COLOR[a.difficulty], color: DIFF_COLOR[a.difficulty] }}>{t(`diff.${a.difficulty}`)}</span>
          <span className="flex items-center gap-1 rounded-sm bg-black/30 px-1.5"><Clock size={11} aria-hidden />{t('direct.minutes', { n: a.minutes })}</span>
          <span className="rounded-sm bg-black/30 px-1.5">{t(`type.${a.type}`)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-xs text-parchment/70">{r ? <>{t('direct.best')}: <b className="text-gold">{r.bestScore}</b> · {t('direct.attempts')}: {r.attempts}</> : '—'}</span>
          <button className="btn btn-sm" onClick={() => start(a.id)}>{r ? <><RotateCcw size={14} aria-hidden />{t('direct.replay')}</> : <><Play size={14} aria-hidden />{t('direct.start')}</>}</button>
        </div>
      </article>
    )
  }

  const islandPanel = selIsland && (() => {
    const is = ISLANDS.find(i => i.id === selIsland)!
    return (
      <div className="space-y-3 text-sm">
        <div><p className="font-pixel text-xs uppercase tracking-wider text-parchment/60">{t(`cat.${is.category}`)}</p>
          <h2 className="font-pixel text-2xl text-[var(--accent)]">{t(`world.${is.id}`)}</h2></div>
        <p>{t(`island.${is.id}.desc`)}</p>
        <ul className="space-y-2">
          {activitiesIn(is.category).map(a => {
            const r = p.topics[a.id]
            return (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 p-2">
                <div className="min-w-0"><p className="truncate font-semibold">{t(`act.${a.id}.name`)}</p><p className="text-xs text-parchment/60">{t(`diff.${a.difficulty}`)} · {t('direct.minutes', { n: a.minutes })}{r ? ` · ${t('direct.best')} ${r.bestScore}` : ''}</p></div>
                <button className="btn btn-sm" onClick={() => start(a.id)}><Play size={14} aria-hidden />{r ? t('direct.replay') : t('direct.start')}</button>
              </li>
            )
          })}
        </ul>
        <button className="btn btn-ghost btn-sm w-full" onClick={() => { setCat(is.category); setView('library') }}><LayoutGrid size={14} aria-hidden />{t('direct.library')}</button>
      </div>
    )
  })()

  return (
    <main className="relative flex h-full w-full flex-col bg-ink">
      <header className="z-30 flex flex-wrap items-center gap-2 border-b border-cyan/30 bg-[#0f1f3a]/95 px-3 py-2 sm:px-4">
        <Logo size="sm" tagline={false} />
        <span className="rounded-sm bg-cyan px-2 py-0.5 font-pixel text-sm text-ink">{t('direct.title')}</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="inline-flex overflow-hidden rounded-sm border-2 border-black/70" role="tablist">
            <button role="tab" aria-selected={view === 'library'} onClick={() => setView('library')} className={`flex items-center gap-1 px-2 py-1 text-xs sm:text-sm ${view === 'library' ? 'bg-cyan text-ink' : 'bg-black/40'}`}><LayoutGrid size={14} aria-hidden />{t('direct.library')}</button>
            <button role="tab" aria-selected={view === 'islands'} onClick={() => setView('islands')} className={`flex items-center gap-1 px-2 py-1 text-xs sm:text-sm ${view === 'islands' ? 'bg-cyan text-ink' : 'bg-black/40'}`}><MapIcon size={14} aria-hidden />{t('direct.islands')}</button>
          </div>
          <div className="hidden md:block"><LanguageSelector compact /></div>
          <button className="btn btn-ghost btn-sm" onClick={() => g.setPhase('modes')} aria-label={t('map.back')}><Home size={16} aria-hidden /></button>
        </div>
      </header>

      {view === 'islands' ? (
        <div className="relative flex-1">
          <IslandMap mode="direct" views={islandViews} selected={selIsland} onSelect={setSelIsland} panel={islandPanel} mobileTop="3.5rem" />
          <p className="absolute left-3 top-3 rounded-sm bg-black/60 px-2 py-1 text-xs">{t('map.directHint')}</p>
        </div>
      ) : (
        <div className="scroll-thin flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[12rem] flex-1">
                <Search size={16} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-parchment/50" aria-hidden />
                <input id="direct-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('direct.search')} aria-label={t('direct.search')}
                  className="w-full rounded-sm border-2 border-cyan/40 bg-black/40 py-2 pl-8 pr-2 outline-none focus:border-gold" />
              </label>
              <select id="direct-diff" value={diff} onChange={e => setDiff(e.target.value as Difficulty | 'all')} aria-label={t('aria.difficulty')} className="rounded-sm border-2 border-cyan/40 bg-black/40 px-2 py-2 text-sm">
                <option value="all">{t('direct.anyLevel')}</option>
                {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => <option key={d} value={d}>{t(`diff.${d}`)}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('aria.category')}>
              {(['all', ...CATEGORIES.map(c => c.id)] as const).map(c => (
                <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}
                  className={`rounded-sm border-2 px-2.5 py-1 text-xs sm:text-sm ${cat === c ? 'border-cyan bg-cyan text-ink' : 'border-white/15 bg-black/30 hover:bg-white/10'}`}>
                  {c === 'all' ? t('direct.all') : t(`cat.${c}`)}</button>
              ))}
            </div>
            {(continueId || p.recent.length > 0) && (
              <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
                {continueId && (() => { const a = activityById(continueId)!; return (
                  <button onClick={() => start(a.id)} className="flex items-center gap-3 rounded border-2 border-gold/60 bg-gold/10 p-3 text-left hover:bg-gold/20">
                    <Play className="shrink-0 text-gold" aria-hidden />
                    <span><span className="block text-xs uppercase tracking-wider text-gold">{t('direct.continue')}</span><b className="font-pixel">{t(`act.${a.id}.name`)}</b></span>
                    <ChevronRight className="ml-auto" aria-hidden />
                  </button>) })()}
                {p.recent.length > 0 && (
                  <div className="rounded border border-white/10 bg-black/25 p-2">
                    <p className="mb-1 text-xs uppercase tracking-wider text-parchment/60">{t('direct.recent')}</p>
                    <div className="flex flex-wrap gap-1.5">{p.recent.slice(0, 6).map(id => { const a = activityById(id); return a && (
                      <button key={id} onClick={() => start(id)} className="rounded-sm border border-white/15 bg-black/30 px-2 py-1 text-xs hover:bg-white/10">{t(`act.${a.id}.name`)}{p.topics[id] ? ` · ${p.topics[id].bestScore}` : ''}</button>) })}</div>
                  </div>
                )}
              </div>
            )}
            {list.length === 0 && <p className="rounded border border-white/10 bg-black/25 p-4 text-center text-parchment/70">{t('direct.noResults')}</p>}
            {CATEGORIES.filter(c => list.some(a => a.category === c.id)).map(c => (
              <section key={c.id} aria-labelledby={`cat-${c.id}`}>
                <h2 id={`cat-${c.id}`} className="mb-2 flex items-center gap-2 font-pixel text-lg" style={{ color: WORLDS[c.island].accent }}>
                  <span className="h-3 w-3 rounded-sm" style={{ background: WORLDS[c.island].accent }} aria-hidden />{t(`cat.${c.id}`)}
                  <span className="text-xs text-parchment/50">· {t(`world.${c.island}`)}</span></h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.filter(a => a.category === c.id).map(card)}</div>
              </section>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

/** Sandbox numbers shown above a practice activity. Reads the sandbox, never the story. */
function PracticeBar({ onExit }: { onExit: () => void }) {
  const t = useT()
  const play = usePlay()
  return (
    <div className="absolute inset-x-2 top-2 z-40 flex flex-wrap items-center gap-2 rounded-sm border border-cyan/40 bg-[#0f1f3a]/95 px-3 py-1.5 text-xs sm:inset-x-4 sm:text-sm">
      <span className="font-pixel text-cyan">{t('direct.practiceWallet')}</span>
      <span className="flex items-center gap-1"><Wallet size={14} className="text-gold" aria-hidden />{inr(play.wallet)}</span>
      <span className="flex items-center gap-1"><Shield size={14} className="text-good" aria-hidden />{inr(play.reserve)}</span>
      <span className="flex items-center gap-1"><Gauge size={14} aria-hidden />{play.cibil}</span>
      <span className="hidden text-parchment/60 md:inline">· {t('direct.sandbox')}</span>
      <span className="ml-auto"><LanguageSelector compact /></span>
      <button className="btn btn-ghost btn-sm" onClick={onExit}><X size={14} aria-hidden />{t('direct.exit')}</button>
    </div>
  )
}

/** One activity in Direct Mode: intro → explore → practice → results → next action. */
function DirectRunner({ activity: a, onExit, onOpen }: { activity: Activity; onExit: () => void; onOpen: (id: string) => void }) {
  const t = useT()
  const lang = useGame(s => s.language)
  const record = useGame(s => s.recordDirectAttempt)
  const touch = useGame(s => s.touchRecent)
  const prevBest = useGame(s => s.direct.topics[a.id]?.bestScore ?? 0)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [run, setRun] = useState(0)
  const [showGuide, setShowGuide] = useState(true)
  const session = useRef({ fails: 0, mistakes: [] as string[], score: undefined as number | undefined, recorded: false })
  const [result, setResult] = useState<{ score: number; mistakes: string[]; newBest: boolean } | null>(null)
  const Game = MINIGAMES[a.id]
  const cat = CATEGORIES.find(c => c.id === a.category)!
  const w = WORLDS[cat.island]
  const mentor = CHARACTERS[cat.mentor]
  const card = LEARNING[lang][a.learningId] ?? LEARNING.en[a.learningId]
  const related = relatedActivity(a.id)

  useEffect(() => { touch(a.id) }, [a.id, touch]) // "recently played"

  const onReport = (r: Report) => {
    if (r.mistakes) session.current.mistakes.push(...r.mistakes)
    if (!r.win) session.current.fails += 1
    else session.current.score = r.score
  }
  const startPractice = () => { session.current = { fails: 0, mistakes: [], score: undefined, recorded: false }; setRun(n => n + 1); setStep(3) }
  const finish = () => {
    const s = session.current
    const score = s.score ?? Math.max(40, 100 - 15 * s.fails)
    record(a.id, { score, win: true }); s.recorded = true
    audio.sfx('victory')
    setResult({ score, mistakes: [...new Set(s.mistakes)], newBest: score > prevBest })
    setStep(4)
  }
  const leave = (then: () => void) => {
    // Leaving a practice run that had attempts but no win still counts as an attempt.
    const s = session.current
    if (step === 3 && !s.recorded && s.fails > 0) record(a.id, { score: 0, win: false })
    then()
  }
  const steps = ['direct.step1', 'direct.step2', 'direct.step3', 'direct.step4']

  return (
    <main className="relative h-full w-full overflow-hidden bg-ink" style={{ ['--accent' as string]: w.accent, ['--accent-2' as string]: w.accent2 }}>
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${w.bg})` }} aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 to-ink/95" aria-hidden />
      {step === 3 && Game ? (
        <DirectPlayProvider key={run} start={{ ...DEFAULT_START, ...a.start }} onReport={onReport}>
          <PracticeBar onExit={() => leave(onExit)} />
          <Game onComplete={finish} />
        </DirectPlayProvider>
      ) : (
        <div className="scroll-thin relative h-full overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => leave(onExit)}><X size={14} aria-hidden />{t('direct.exit')}</button>
              <LanguageSelector compact />
              <ol className="flex items-center gap-1 text-[11px] sm:text-xs" aria-label={t('aria.steps')}>
                {steps.map((k, i) => (
                  <li key={k} className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 ${step === i + 1 ? 'bg-[var(--accent)] text-ink' : step > i + 1 ? 'text-good' : 'text-parchment/50'}`} aria-current={step === i + 1 ? 'step' : undefined}>
                    {i + 1}. <span className="hidden sm:inline">{t(k)}</span></li>
                ))}
              </ol>
            </div>
            <header>
              <p className="font-pixel text-xs uppercase tracking-wider text-parchment/60">{t(`cat.${a.category}`)} · {t(`type.${a.type}`)} · {t(`diff.${a.difficulty}`)} · {t('direct.minutes', { n: a.minutes })}</p>
              <h1 className="font-pixel text-3xl text-[var(--accent)] sm:text-4xl">{t(`act.${a.id}.name`)}</h1>
            </header>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.section key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel space-y-3 p-4">
                  <p className="flex gap-2 text-base leading-relaxed"><Lightbulb className="mt-1 shrink-0 text-[var(--accent-2)]" aria-hidden />{t(`act.${a.id}.intro`)}</p>
                  <p className="flex gap-2 rounded bg-black/30 p-2 text-sm"><Target size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden /><span><b>{t('direct.objective')}:</b> {t(`act.${a.id}.obj`)}</span></p>
                  {showGuide && (
                    <div className="flex items-center gap-3 rounded border border-white/10 bg-black/30 p-2">
                      <img src={mentor.img} alt="" className="pixel h-14 w-auto" />
                      <p className="flex-1 text-sm"><span className="text-xs uppercase text-parchment/50">{t('direct.guide')} · {t(`char.${cat.mentor}.name`)}</span><br />“{t(`act.${a.id}.mentor`)}”</p>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowGuide(false)} aria-label={t('direct.hideGuide')}><X size={14} /></button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button className="btn" onClick={() => setStep(2)} autoFocus><BookOpen size={16} aria-hidden />{t('direct.toExplore')}</button>
                    <button className="btn btn-ghost" onClick={startPractice}><Play size={16} aria-hidden />{t('direct.skipToPractice')}</button>
                  </div>
                </motion.section>
              )}
              {step === 2 && card && (
                <motion.section key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel space-y-3 p-4">
                  <h2 className="font-pixel text-xl text-[var(--accent)]">{card.title}</h2>
                  <ul className="space-y-2 text-sm leading-relaxed">{card.points.map((pt, i) => <li key={i} className="border-l-2 border-[var(--accent)]/50 pl-3">{pt}</li>)}</ul>
                  {card.formula && <p className="flex items-center gap-2 rounded border border-[var(--accent-2)]/40 bg-[var(--accent-2)]/10 p-2 font-mono text-sm"><Sigma size={16} className="shrink-0 text-[var(--accent-2)]" aria-hidden />{card.formula}</p>}
                  {card.example && <p className="text-sm text-parchment/75">→ {card.example}</p>}
                  <LearningExtra id={a.learningId} />
                  <button className="btn btn-gold" onClick={startPractice} autoFocus><Play size={16} aria-hidden />{t('direct.toPractice')}</button>
                </motion.section>
              )}
              {step === 4 && result && (
                <motion.section key="s4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel space-y-4 p-4" aria-live="polite">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div><p className="text-xs uppercase tracking-wider text-parchment/60">{t('direct.score')}</p>
                      <p className="font-pixel text-6xl" style={{ color: result.score >= 70 ? '#52e08a' : result.score >= 40 ? '#ffb547' : '#ff5d6c' }}>{result.score}<span className="text-xl text-parchment/50">/100</span></p></div>
                    <div className="text-right text-sm">
                      {result.newBest && <p className="flex items-center gap-1 font-pixel text-gold"><Trophy size={16} />{t('direct.newBest')}</p>}
                      <p>{t('direct.best')}: <b>{Math.max(prevBest, result.score)}</b></p>
                      <p className="text-parchment/60">{t('direct.attempts')}: {useGame.getState().direct.topics[a.id]?.attempts ?? 1}</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-pixel text-sm">{t('direct.mistakes')}</p>
                    {result.mistakes.length === 0 ? <p className="text-good">{t('direct.noMistakes')}</p> :
                      <ul className="space-y-1 text-sm">{result.mistakes.slice(0, 8).map((m, i) => <li key={i} className="border-l-2 border-warn/60 pl-2">{m}</li>)}</ul>}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button className="btn" onClick={startPractice}><RotateCcw size={16} aria-hidden />{t('direct.retry')}</button>
                    <button className="btn btn-ghost" onClick={() => setStep(2)}><BookOpen size={16} aria-hidden />{t('direct.another')}</button>
                    <button className="btn btn-gold" onClick={() => onOpen(related.id)}><ArrowRight size={16} aria-hidden />{t('direct.related', { name: t(`act.${related.id}.name`) })}</button>
                    <button className="btn btn-ghost" onClick={onExit}><LayoutGrid size={16} aria-hidden />{t('direct.otherTopic')}</button>
                  </div>
                  <button className="btn btn-ghost btn-sm w-full" onClick={onExit}>{t('direct.backLibrary')}</button>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </main>
  )
}
