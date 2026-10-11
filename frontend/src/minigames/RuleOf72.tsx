import { useState } from 'react'
import { MinigameShell } from '../components/MinigameShell.tsx'
import { ResultPanel } from '../components/ui/ResultPanel.tsx'
import { useT } from '../i18n/useT.ts'
import { exactDoubling, inr, ruleOf72 } from '../lib/finance.ts'
import { audio } from '../lib/audio.ts'
import type { GameProps } from './common.ts'
import { usePlay } from './PlayContext.tsx'

// Question text: r72.q<n>, options r72.q<n>o (separated by |), explanation r72.q<n>why.
const ANSWERS = [1, 1, 1]

export default function RuleOf72({ onComplete }: GameProps) {
  const t = useT()
  const play = usePlay()
  const QUESTIONS = ANSWERS.map((a, i) => ({ q: t(`r72.q${i}`), opts: t(`r72.q${i}o`).split('|'), a, why: t(`r72.q${i}why`) }))
  const [rate, setRate] = useState(8)
  const [ans, setAns] = useState<Record<number, number>>({})
  const [won, setWon] = useState(false)
  const approx = ruleOf72(rate), exact = exactDoubling(rate)
  const years = 36
  const all = QUESTIONS.every((q, i) => ans[i] === q.a)

  const choose = (i: number, o: number) => {
    const next = { ...ans, [i]: o }
    setAns(next); audio.sfx(o === QUESTIONS[i].a ? 'success' : 'warn')
    if (o !== QUESTIONS[i].a) play.report({ win: false, mistakes: [`${QUESTIONS[i].q} → ${QUESTIONS[i].why}`] })
    if (!won && QUESTIONS.every((q, k) => next[k] === q.a)) { setWon(true); play.award('rule72', 'resilience', 125); play.report({ win: true }) }
  }

  return (
    <MinigameShell title={t('r72.title')} help={t('r72.help')}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded border border-white/10 bg-black/25 p-3">
          <label className="block text-sm">{t('r72.rate')}: <b className="font-pixel text-xl text-[var(--accent)]">{rate}%</b>
            <input type="range" min={1} max={20} value={rate} onChange={e => setRate(+e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded bg-[var(--accent)]/10 p-2"><div className="text-xs">{t('r72.approx')}: 72 ÷ {rate}</div><div className="font-pixel text-2xl">{t('r72.years', { n: approx.toFixed(1) })}</div></div>
            <div className="rounded bg-black/30 p-2"><div className="text-xs">{t('r72.exact')}: ln2 ÷ ln(1+{rate / 100})</div><div className="font-pixel text-2xl">{t('r72.years', { n: exact.toFixed(1) })}</div></div>
          </div>
          <p className="text-xs text-parchment/70">{t('r72.error', { n: Math.abs(approx - exact).toFixed(2) })}</p>
          {/* growth bars: ₹10,000 compounding over 36 years, doubling points marked */}
          <div className="flex h-40 items-end gap-[2px]" aria-label={t('r72.growAria', { amt: inr(10000), rate, total: inr(10000 * Math.pow(1 + rate / 100, years)), years })}>
            {Array.from({ length: years + 1 }, (_, y) => {
              const v = Math.pow(1 + rate / 100, y), max = Math.pow(1 + rate / 100, years)
              const isDouble = Math.floor(y / approx) !== Math.floor((y - 1) / approx) && y > 0
              return <div key={y} className="flex-1 rounded-t-sm" style={{ height: `${(v / max) * 100}%`, background: isDouble ? 'var(--accent-2)' : 'var(--accent)', opacity: isDouble ? 1 : 0.55 }} title={`${t('axis.year', { n: y })}: ${inr(10000 * v)}`} />
            })}
          </div>
          <p className="text-xs text-parchment/70"><span className="text-[var(--accent-2)]">■</span> {t('r72.legend', { amt: inr(10000), years })}</p>
        </div>
        <div className="space-y-3">
          {QUESTIONS.map((q, i) => (
            <fieldset key={i} className="rounded border border-white/10 bg-black/25 p-3">
              <legend className="px-1 text-sm font-semibold">{i + 1}. {q.q}</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {q.opts.map((o, k) => (
                  <button key={o} onClick={() => choose(i, k)} aria-pressed={ans[i] === k}
                    className={`btn btn-sm ${ans[i] === k ? (k === q.a ? 'btn-good' : 'btn-bad') : 'btn-ghost'}`}>{o}</button>
                ))}
              </div>
              {ans[i] !== undefined && <p className={`mt-1 text-xs ${ans[i] === q.a ? 'text-good' : 'text-warn'}`}>{ans[i] === q.a ? '✓ ' : `${t('quiz.notQuite')} `}{q.why}</p>}
            </fieldset>
          ))}
          {all && <ResultPanel win onContinue={onComplete}><p>{t('r72.win')}</p></ResultPanel>}
        </div>
      </div>
    </MinigameShell>
  )
}
