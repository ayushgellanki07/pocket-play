import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { History, FastForward, ChevronsRight, Lock, Gauge } from 'lucide-react'
import { DIALOGUE } from '../data/dialogue.ts'
import { CHARACTERS, pappuImg } from '../data/worlds.ts'
import { useGame } from '../store/gameStore.ts'
import { useUi } from '../store/uiStore.ts'
import { useT } from '../i18n/useT.ts'
import { localLine } from '../i18n/dialogueText.ts'
import { dialogueRules } from '../lib/dialoguePolicy.ts'
import { audio } from '../lib/audio.ts'
import { useFx } from '../store/fxStore.ts'
import { CharacterPortrait } from './CharacterPortrait.tsx'
import type { DialogueChoice, DialogueLine, Mood } from '../types.ts'

type T = (k: string, v?: Record<string, string | number>) => string

/** Applies a story choice's consequences once (re-reading a scene never applies them twice). */
function applyChoice(key: string, c: DialogueChoice, note: string | null, t: T) {
  const g = useGame.getState()
  if (!g.recordChoice(key, c.label) || !c.effect) return
  const e = c.effect
  if (e.toReserve && g.wallet >= e.toReserve) {
    g.applyTx([{ label: 'tx.toReserve', amount: -e.toReserve, account: 'wallet', kind: 'transfer' }, { label: 'tx.reserve', amount: e.toReserve, account: 'reserve', kind: 'transfer' }])
  }
  if (e.cibil) g.setCibil(g.cibilScore + e.cibil)
  if (e.mastery) useGame.setState(s => ({ masteryPoints: s.masteryPoints + e.mastery!, mastery: { ...s.mastery, choices: (s.mastery.choices ?? 0) + e.mastery! } }))
  const msg = [note, e.mastery ? t('choice.mastery', { n: e.mastery }) : ''].filter(Boolean).join(' · ')
  if (msg) useFx.getState().push(msg, e.cibil && e.cibil < 0 ? 'loss' : 'saving')
}

/** Wraps highlighted financial terms in a coloured span. */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const esc = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${esc.join('|')})`, 'g'))
  return <>{parts.map((p, i) => (terms.includes(p) ? <span key={i} className="term">{p}</span> : <span key={i}>{p}</span>))}</>
}

/**
 * Plays one dialogue script: typewriter text, portraits, choices, history and skip.
 * What the player may skip comes from dialogueRules() — see lib/dialoguePolicy.ts.
 * Calls onDone after the last line.
 */
export function DialogueController({ scriptId, guide, onDone }: { scriptId: string; guide: string; onDone: () => void }) {
  const t = useT()
  const reduce = useReducedMotion()
  const lang = useGame(s => s.language)
  const name = useGame(s => s.playerName)
  const cibil = useGame(s => s.cibilScore)
  const playthroughs = useGame(s => s.profile.storyPlaythroughsCompleted)
  const seen = useGame(s => s.profile.seenDialogue.includes(scriptId))
  const markSeen = useGame(s => s.markDialogueSeen)
  const overlay = useUi(s => s.overlay)
  const lines = DIALOGUE[scriptId] ?? []
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState(0)
  const [history, setHistory] = useState<DialogueLine[]>([])   // line objects, translated when shown
  const [showHistory, setShowHistory] = useState(false)
  const [mood, setMood] = useState<Mood>('neutral')
  const [fast, setFast] = useState(false)
  const lastAdvance = useRef(0)

  // Rules are fixed for the whole conversation (decided when it starts).
  const rules = useMemo(() => dialogueRules({ mode: 'story', playthroughs, seen, mandatory: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scriptId])

  const line = lines[idx]
  const fill = useCallback((s: string) => s.replaceAll('{name}', name).replaceAll('{cibil}', String(cibil)), [name, cibil])
  const local = useMemo(() => (line ? localLine(lang, scriptId, line) : null), [lang, scriptId, line])
  const text = useMemo(() => fill(local?.text ?? ''), [local, fill])
  const done = typed >= text.length

  // New line: reset the typewriter, play its trigger, update Pappu's mood.
  useEffect(() => {
    if (!line) return
    setTyped(reduce || fast ? Number.MAX_SAFE_INTEGER : 0)
    if (line.speaker === 'player' && line.mood) setMood(line.mood)
    if (line.trigger?.startsWith('sfx:')) audio.sfx(line.trigger.slice(4) as 'alert')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, reduce])

  // Language changed mid-line: stay on the same line and show it in full in the new language.
  const firstLang = useRef(lang)
  useEffect(() => {
    if (firstLang.current === lang) return
    firstLang.current = lang
    setTyped(Number.MAX_SAFE_INTEGER)
  }, [lang])

  // Typewriter: one character every 22ms, with a soft blip every few characters.
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => { setTyped(n => n + 1); if (typed % 3 === 0) audio.sfx('blip') }, 22)
    return () => clearTimeout(id)
  }, [typed, done])

  const finish = useCallback(() => { markSeen(scriptId); onDone() }, [markSeen, onDone, scriptId])

  const goTo = useCallback((nextId?: string | null) => {
    setHistory(h => [...h, line])
    const target = nextId ? lines.findIndex(l => l.id === nextId) : idx + 1
    if (target < 0 || target >= lines.length) finish()
    else setIdx(target)
  }, [idx, line, lines, finish])

  /** One press: finish the typing (if allowed) or go to the next line (only when the line is complete). */
  const advance = useCallback(() => {
    if (!line) return
    const now = Date.now()
    if (!done) {
      if (rules.canSkipTyping) { setTyped(Number.MAX_SAFE_INTEGER); lastAdvance.current = now }
      return // first playthrough: the line must finish typing on its own
    }
    if (line.choices?.length) return // must pick a choice
    if (now - lastAdvance.current < rules.advanceCooldownMs) return // rapid clicks can't skip lines
    lastAdvance.current = now
    audio.sfx('click')
    goTo(line.nextDialogueId)
  }, [done, goTo, line, rules])

  // Fast-forward (only after the first playthrough): lines appear instantly and move on by themselves.
  useEffect(() => {
    if (!fast || !line || line.choices?.length) return
    if (!done) { setTyped(Number.MAX_SAFE_INTEGER); return }
    const id = setTimeout(() => goTo(line.nextDialogueId), 700)
    return () => clearTimeout(id)
  }, [fast, done, line, goTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlay || showHistory || e.repeat) return // holding a key down never skips
      if (e.key === ' ' || e.key === 'Enter') {
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
        e.preventDefault(); advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, overlay, showHistory])

  useEffect(() => { if (!lines.length) onDone() }, [lines.length, onDone])
  if (!line || !local) return null

  const charName = (id: string) => t(`char.${id}.name`)
  const npcId = line.speaker === 'npc' ? line.character! : guide
  const npc = CHARACTERS[npcId]
  const speakerName = line.speaker === 'player' ? name : line.speaker === 'npc' ? `${charName(npcId)} · ${t(`char.${npcId}.title`)}` : ''
  const nameColor = line.speaker === 'player' ? '#f5c542' : npc.color
  const skipConversation = () => { setHistory(h => [...h, ...lines.slice(idx)]); finish() }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end" data-first-run={rules.firstRun || undefined}>
      {/* Portraits */}
      <div className="relative mx-auto flex w-full max-w-6xl items-end justify-between px-2 sm:px-8">
        <CharacterPortrait src={npc.img} alt={charName(npcId)} side="left" active={line.speaker === 'npc'} color={npc.color} className="h-[26vh] sm:h-[40vh]" />
        <CharacterPortrait src={pappuImg(mood)} alt={name} side="right" active={line.speaker === 'player'} color="#f5c542" className="h-[30vh] sm:h-[46vh]" />
      </div>

      {/* Dialogue box */}
      <div className="pointer-events-auto relative mx-auto mb-3 w-[calc(100%-1.5rem)] max-w-5xl sm:mb-6">
        <motion.div
          key={line.id} initial={{ y: 12, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }}
          className="panel scanlines relative cursor-pointer px-5 pb-4 pt-5 sm:px-7"
          onClick={advance} role="button" tabIndex={0} aria-live="polite" data-dialogue-line={line.id}
          aria-label={`${speakerName ? speakerName + ': ' : ''}${text}`}
        >
          {speakerName && (
            <div className="absolute -top-4 left-4 max-w-[90%] truncate rounded-sm border-2 border-black px-3 py-0.5 font-pixel text-sm text-ink sm:text-base" style={{ background: nameColor }}>
              {speakerName}
            </div>
          )}
          <p className={`min-h-[4.5rem] text-base leading-relaxed sm:text-lg ${line.speaker === 'narrator' ? 'italic text-parchment/80' : ''}`}>
            <Highlighted text={text.slice(0, typed)} terms={local.terms} />
            {!done && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-[var(--accent)] align-middle" />}
          </p>
          {done && line.choices && (
            <div className="mt-3 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
              {line.choices.map((c, i) => (
                <button key={c.label} className="btn btn-ghost text-left" data-choice={i}
                  onClick={() => { audio.sfx(c.correct === false ? 'warn' : 'success'); applyChoice(`${scriptId}:${line.id}`, c, local.notes[i], t); goTo(c.next) }}>
                  {local.choices[i]}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-parchment/60" onClick={e => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(true)} aria-label={t('dialogue.history')}><History size={14} aria-hidden /><span className="hidden sm:inline">{t('dialogue.history')}</span></button>
              {rules.canSkipConversation ? (
                <button className="btn btn-ghost btn-sm" onClick={skipConversation} aria-label={t('dialogue.skip')} data-testid="dialogue-skip"><FastForward size={14} aria-hidden /><span className="hidden sm:inline">{t('dialogue.skip')}</span></button>
              ) : (
                <button className="btn btn-ghost btn-sm" disabled aria-disabled title={t(rules.firstRun ? 'dialogue.skipLocked' : 'dialogue.skipUnseen')} aria-label={`${t('dialogue.skip')} — ${t(rules.firstRun ? 'dialogue.skipLocked' : 'dialogue.skipUnseen')}`} data-testid="dialogue-skip">
                  <Lock size={13} aria-hidden /><span className="hidden sm:inline">{t('dialogue.skip')}</span>
                </button>
              )}
              {!rules.firstRun && (
                <button className={`btn btn-sm ${fast ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setFast(f => !f)} aria-pressed={fast} aria-label={t('dialogue.fast')}><Gauge size={14} aria-hidden /><span className="hidden sm:inline">{t('dialogue.fast')}</span></button>
              )}
              {rules.firstRun && <span className="hidden text-parchment/50 md:inline">{t('dialogue.skipLocked')}</span>}
            </div>
            {done && !line.choices && (
              <button className="btn btn-sm" onClick={advance} data-testid="dialogue-continue"><ChevronsRight size={14} aria-hidden />{t('dialogue.continue')}</button>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)}>
            <div className="panel scroll-thin max-h-[80vh] w-full max-w-2xl overflow-y-auto p-5" onClick={e => e.stopPropagation()} role="dialog" aria-label={t('dialogue.history')}>
              <h2 className="mb-3 font-pixel text-xl text-[var(--accent)]">{t('dialogue.history')}</h2>
              <ul className="space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="text-sm">
                    <b style={{ color: h.speaker === 'player' ? '#f5c542' : h.speaker === 'npc' ? CHARACTERS[h.character!]?.color : '#aaa' }}>
                      {h.speaker === 'player' ? name : h.speaker === 'npc' ? charName(h.character!) : '—'}:
                    </b>{' '}{fill(localLine(lang, scriptId, h).text)}
                  </li>
                ))}
              </ul>
              <button className="btn mt-4" onClick={() => setShowHistory(false)} autoFocus>{t('common.close')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
