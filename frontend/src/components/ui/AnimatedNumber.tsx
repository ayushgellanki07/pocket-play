import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Counts smoothly from the previous value to the new one and briefly flashes green/red. */
export function AnimatedNumber({ value, format, className = '' }: { value: number; format: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const from = useRef(value)

  useEffect(() => {
    const start = from.current
    if (start === value) return
    setFlash(value > start ? 'up' : 'down')
    if (reduce) { setShown(value); from.current = value; return }
    const t0 = performance.now(), dur = 900
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(start + (value - start) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    const off = setTimeout(() => setFlash(null), 1200)
    return () => { cancelAnimationFrame(raf); clearTimeout(off); from.current = value }
  }, [value, reduce])

  const color = flash === 'up' ? 'text-good' : flash === 'down' ? 'text-bad' : ''
  return <span className={`tabular-nums transition-colors duration-500 ${color} ${className}`}>{format(shown)}</span>
}
