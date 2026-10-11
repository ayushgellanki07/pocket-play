// Minimal SVG line chart (no chart library needed). Supports several series and a target line.
import { num } from '../../lib/finance.ts'
export interface Series { name: string; values: number[]; color: string; dashed?: boolean }

export function LineChart({ series, height = 160, target, labels, format = num }: {
  series: Series[]; height?: number; target?: { value: number; label: string }; labels?: string[]; format?: (n: number) => string
}) {
  const W = 600, H = height, pad = { l: 64, r: 12, t: 12, b: 24 }
  const all = series.flatMap(s => s.values).concat(target ? [target.value] : [])
  const maxLen = Math.max(2, ...series.map(s => s.values.length))
  let lo = Math.min(0, ...all), hi = Math.max(...all, 1)
  if (hi === lo) hi = lo + 1
  hi += (hi - lo) * 0.08
  const x = (i: number) => pad.l + (i / (maxLen - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b)
  const ticks = [lo, (lo + hi) / 2, hi]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={series.map(s => `${s.name}: ${format(s.values[s.values.length - 1] ?? 0)}`).join(', ')}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(243,234,215,.6)">{format(t)}</text>
        </g>
      ))}
      {lo < 0 && <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.3)" />}
      {target && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={y(target.value)} y2={y(target.value)} stroke="var(--color-gold)" strokeDasharray="6 4" />
          <text x={W - pad.r} y={y(target.value) - 4} textAnchor="end" fontSize="11" fill="var(--color-gold)">{target.label}</text>
        </g>
      )}
      {labels && labels.map((l, i) => (i % Math.ceil(labels.length / 10) === 0 || i === labels.length - 1) && (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(243,234,215,.5)">{l}</text>
      ))}
      {series.map(s => s.values.length > 0 && (
        <g key={s.name}>
          <polyline fill="none" stroke={s.color} strokeWidth={2.5} strokeDasharray={s.dashed ? '6 5' : undefined} strokeLinejoin="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={4} fill={s.color} />
        </g>
      ))}
    </svg>
  )
}
