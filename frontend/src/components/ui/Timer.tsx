import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { useIsPaused } from '../../store/uiStore.ts'
import { useT } from '../../i18n/useT.ts'

/**
 * Countdown hook. Counts down only while `running` is true and the game isn't paused.
 * Calls onExpire once when it reaches zero.
 */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [left, setLeft] = useState(seconds)
  const paused = useIsPaused()
  const cb = useRef(onExpire)
  useEffect(() => { cb.current = onExpire })
  useEffect(() => {
    if (!running || paused) return
    const id = setInterval(() => setLeft(l => Math.max(0, l - 0.1)), 100)
    return () => clearInterval(id)
  }, [running, paused])
  // Fire onExpire exactly once when the clock hits zero (kept out of the state updater on purpose).
  const fired = useRef(false)
  useEffect(() => {
    if (left <= 0 && running && !fired.current) { fired.current = true; cb.current() }
  }, [left, running])
  return { left, reset: () => { fired.current = false; setLeft(seconds) } }
}

export function TimerBar({ left, total, label }: { left: number; total: number; label: string }) {
  const t = useT()
  const p = left / total
  const color = p > 0.5 ? 'var(--accent)' : p > 0.2 ? 'var(--color-warn)' : 'var(--color-bad)'
  return (
    <div className="flex items-center gap-2" role="timer" aria-label={t('aria.seconds', { label, n: Math.ceil(left) })}>
      <Clock size={16} style={{ color }} aria-hidden />
      <div className="h-3 w-28 overflow-hidden rounded-sm border border-black/60 bg-black/40 sm:w-40">
        <div className="h-full transition-[width] duration-100" style={{ width: `${p * 100}%`, background: color }} />
      </div>
      <span className="min-w-9 font-pixel tabular-nums" style={{ color }}>{t('unit.sec', { n: Math.ceil(left) })}</span>
    </div>
  )
}
