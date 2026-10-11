// Small multiple-choice block reused by the calculator activities.
import { audio } from '../lib/audio.ts'
import { useT } from '../i18n/useT.ts'

export interface Q { q: string; opts: string[]; a: number; why: string }

export function QuizBlock({ qs, ans, onAnswer }: { qs: Q[]; ans: Record<number, number>; onAnswer: (i: number, o: number) => void }) {
  const t = useT()
  return (
    <div className="space-y-3">
      {qs.map((q, i) => (
        <fieldset key={i} className="rounded border border-white/10 bg-black/25 p-3">
          <legend className="px-1 text-sm font-semibold">{i + 1}. {q.q}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {q.opts.map((o, k) => (
              <button key={o} aria-pressed={ans[i] === k} onClick={() => { audio.sfx(k === q.a ? 'success' : 'warn'); onAnswer(i, k) }}
                className={`btn btn-sm ${ans[i] === k ? (k === q.a ? 'btn-good' : 'btn-bad') : 'btn-ghost'}`}>{o}</button>
            ))}
          </div>
          {ans[i] !== undefined && <p className={`mt-1 text-xs ${ans[i] === q.a ? 'text-good' : 'text-warn'}`}>{ans[i] === q.a ? '✓ ' : `${t('quiz.notQuite')} `}{q.why}</p>}
        </fieldset>
      ))}
    </div>
  )
}

