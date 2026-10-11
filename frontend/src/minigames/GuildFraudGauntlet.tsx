import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Check, X, Play, ArrowLeft, ArrowRight } from 'lucide-react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { TimerBar, useCountdown } from '../components/ui/Timer.tsx'
import { useT } from '../i18n/useT.ts'
import { useUi } from '../store/uiStore.ts'
import { audio } from '../lib/audio.ts'
import { inr } from '../lib/finance.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

// Prompt text is translated: gt.<id>.{from,text,why}.
interface Prompt { id: number; legit: boolean }
export const PROMPTS: Prompt[] = [
  { id: 1, legit: false },
  { id: 2, legit: true },
  { id: 3, legit: false },
  { id: 4, legit: true },
  { id: 5, legit: false },
  { id: 6, legit: true },
  { id: 7, legit: false },
  { id: 8, legit: false },
  { id: 9, legit: true },
  { id: 10, legit: false },
]
const TIME = 60

function SwipeCard({ p, onDecide }: { p: Prompt; onDecide: (approve: boolean) => void }) {
  const t = useT()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  const approveOpacity = useTransform(x, [20, 120], [0, 1])
  const rejectOpacity = useTransform(x, [-120, -20], [1, 0])
  return (
    <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9} style={{ x, rotate }}
      onDragEnd={(_, info) => { if (info.offset.x > 110) onDecide(true); else if (info.offset.x < -110) onDecide(false) }}
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      className="relative mx-auto w-full max-w-md cursor-grab touch-pan-y select-none rounded-lg border-4 border-black bg-gradient-to-b from-[#24346e] to-[#141b3d] p-5 active:cursor-grabbing">
      <motion.span style={{ opacity: approveOpacity }} className="absolute right-3 top-3 rounded border-2 border-good px-2 font-pixel text-good">{t('gauntlet.stampApprove')}</motion.span>
      <motion.span style={{ opacity: rejectOpacity }} className="absolute left-3 top-3 rounded border-2 border-bad px-2 font-pixel text-bad">{t('gauntlet.stampReject')}</motion.span>
      <p className="mt-6 text-xs uppercase tracking-wider text-parchment/60">#{p.id} · {t(`gt.${p.id}.from`)}</p>
      <p className="mt-2 text-lg leading-snug">{t(`gt.${p.id}.text`)}</p>
    </motion.div>
  )
}

export default function GuildFraudGauntlet({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const overlay = useUi(s => s.overlay)
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [feedback, setFeedback] = useState<{ ok: boolean; p: Prompt } | null>(null)
  const [result, setResult] = useState<'win' | 'fail' | 'time' | null>(null)
  // The timer pauses while feedback is shown, so reading never costs time.
  const timer = useCountdown(TIME, started && !feedback && !result, () => { setResult('time'); audio.sfx('fail'); play.report({ win: false, mistakes: [t('mg.ranOut')] }) })
  const correct = answers.filter(Boolean).length
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 100

  const decide = (approve: boolean) => {
    if (feedback || result || !started) return
    const p = PROMPTS[i]
    const ok = approve === p.legit
    audio.sfx(ok ? 'success' : 'fail')
    setAnswers(a => [...a, ok])
    setFeedback({ ok, p })
  }
  const next = () => {
    setFeedback(null)
    if (i + 1 < PROMPTS.length) { setI(i + 1); return }
    const allRight = answers.every(Boolean) && answers.length === PROMPTS.length
    if (allRight) {
      play.commit([{ label: 'tx.bounty', amount: 1000, account: 'wallet', kind: 'reward' }], { text: t('fx.bounty', { amt: inr(1000) }), coins: true })
      play.award('gauntlet', 'banking', 200); play.report({ win: true, score: 100 }); audio.sfx('victory'); setResult('win')
    } else {
      play.report({ win: false, score: answers.filter(Boolean).length * 10, mistakes: PROMPTS.filter((_, k) => answers[k] === false).map(p => `#${p.id}: ${t(`gt.${p.id}.why`)}`) })
      setResult('fail')
    }
  }
  const retry = () => { setI(0); setAnswers([]); setFeedback(null); setResult(null); timer.reset(); setStarted(true) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlay) return
      if (e.key === 'ArrowRight') decide(true)
      if (e.key === 'ArrowLeft') decide(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <MinigameShell title={t('gauntlet.title')} help={t('gauntlet.help')}
      right={started && <div className="flex flex-wrap items-center gap-3"><span className="font-pixel text-sm">{t('mg.accuracy')}: <b className={accuracy === 100 ? 'text-good' : 'text-bad'}>{accuracy}%</b> · {answers.length}/10</span><TimerBar left={timer.left} total={TIME} label={t('mg.timer')} /></div>}>
      {!started ? (
        <div className="py-8 text-center"><button className="btn btn-gold text-lg" onClick={() => setStarted(true)} autoFocus><Play size={18} aria-hidden />{t('common.start')}</button></div>
      ) : !result ? (
        <div className="space-y-4">
          <AnimatePresence mode="wait">{!feedback && <SwipeCard key={i} p={PROMPTS[i]} onDecide={decide} />}</AnimatePresence>
          {feedback ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mx-auto max-w-md rounded border-2 p-4 ${feedback.ok ? 'border-good bg-good/10' : 'border-bad bg-bad/10'}`} role="status">
              <p className={`font-pixel ${feedback.ok ? 'text-good' : 'text-bad'}`}>{feedback.ok ? t('gauntlet.correct') : t('gauntlet.wrong')} — {feedback.p.legit ? t('gauntlet.legit') : t('gauntlet.scam')}</p>
              <p className="mt-1 text-sm">{t(`gt.${feedback.p.id}.why`)}</p>
              <button className="btn mt-3" onClick={next} autoFocus>{t('common.next')}</button>
            </motion.div>
          ) : (
            <div className="flex justify-center gap-3">
              <button className="btn btn-bad min-w-32" onClick={() => decide(false)}><ArrowLeft size={16} aria-hidden /><X size={16} aria-hidden />{t('gauntlet.reject')}</button>
              <button className="btn btn-good min-w-32" onClick={() => decide(true)}>{t('gauntlet.approve')}<Check size={16} aria-hidden /><ArrowRight size={16} aria-hidden /></button>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          {result === 'win' && <ResultPanel win onContinue={onComplete}><p>{t('gauntlet.winText')}</p></ResultPanel>}
          {result !== 'win' && (
            <ResultPanel win={false} title={result === 'time' ? t('mg.timeUp') : undefined} onRetry={retry}>
              <p>{result === 'time' ? t('gauntlet.timeText', { n: answers.length }) : t('gauntlet.fail', { n: answers.filter(a => !a).length })}</p>
              <ul className="space-y-1 text-sm">
                {PROMPTS.map((p, k) => answers[k] === false && <li key={p.id}>✗ #{p.id}: {t(`gt.${p.id}.why`)}</li>)}
              </ul>
            </ResultPanel>
          )}
        </div>
      )}
    </MinigameShell>
  )
}
