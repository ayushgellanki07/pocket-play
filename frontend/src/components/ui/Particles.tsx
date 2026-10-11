import { useEffect, useRef } from 'react'

type Kind = 'dust' | 'sparkle' | 'ember' | 'ticker' | 'star' | 'portal'

/** Lightweight canvas particle layer. Each world gets its own atmosphere. Disabled for reduced motion. */
export function Particles({ kind, density = 1 }: { kind: Kind; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let w = 0, h = 0, raf = 0
    const resize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const count = Math.round((kind === 'star' ? 90 : kind === 'ticker' ? 26 : 60) * density)
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const ps = Array.from({ length: count }, () => ({ x: rnd(0, 1), y: rnd(0, 1), v: rnd(0.2, 1), s: rnd(1, 3), p: rnd(0, 6.28) }))
    const col: Record<Kind, string> = { dust: '232,190,120', sparkle: '150,210,255', ember: '255,90,70', ticker: '90,240,150', star: '230,240,255', portal: '120,240,255' }
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const p of ps) {
        if (kind === 'dust') { p.x += 0.0006 * p.v; p.y += Math.sin(t / 2000 + p.p) * 0.0003 }
        else if (kind === 'ember') { p.y -= 0.0012 * p.v; p.x += Math.sin(t / 900 + p.p) * 0.0006 }
        else if (kind === 'ticker') { p.y -= 0.0008 * p.v }
        else if (kind === 'portal') { p.p += 0.01 * p.v; p.x = 0.5 + Math.cos(p.p) * 0.3 * p.v; p.y = 0.5 + Math.sin(p.p) * 0.3 * p.v }
        else { p.y += 0.00015 * p.v }
        if (p.x > 1.02) p.x = -0.02; if (p.y < -0.02) p.y = 1.02; if (p.y > 1.02) p.y = -0.02
        const a = kind === 'star' || kind === 'sparkle' ? 0.35 + 0.65 * Math.abs(Math.sin(t / 700 + p.p)) : 0.55
        ctx.fillStyle = `rgba(${col[kind]},${a})`
        if (kind === 'ticker') {
          const up = p.p > 3
          ctx.font = `${8 + p.s * 3}px monospace`
          ctx.fillStyle = up ? `rgba(90,240,150,${a})` : `rgba(255,90,90,${a})`
          ctx.fillText(up ? '▲' : '▼', p.x * w, p.y * h)
          continue
        }
        ctx.fillRect(Math.round(p.x * w), Math.round(p.y * h), p.s * (kind === 'star' ? 1 : 1.5), p.s * (kind === 'star' ? 1 : 1.5))
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [kind, density])
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}
