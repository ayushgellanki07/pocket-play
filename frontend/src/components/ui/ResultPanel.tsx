import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowRight, AlertTriangle } from 'lucide-react'
import { useT } from '../../i18n/useT.ts'

/** Shared Victory / Failure panel. Failure always explains why and offers a retry. */
export function ResultPanel({ win, title, children, onRetry, onContinue }: { win: boolean; title?: string; children?: ReactNode; onRetry?: () => void; onContinue?: () => void }) {
  const t = useT()
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className={`rounded border-2 p-4 ${win ? 'border-good/70 bg-good/10' : 'border-bad/70 bg-bad/10'}`} role="status" aria-live="polite">
      <div className="mb-2 flex items-center gap-2">
        {win ? <Trophy className="text-gold" aria-hidden /> : <AlertTriangle className="text-bad" aria-hidden />}
        <h3 className={`font-pixel text-xl ${win ? 'text-good' : 'text-bad'}`}>{title ?? (win ? t('common.victory') : t('common.failed'))}</h3>
      </div>
      <div className="space-y-2 text-sm leading-relaxed sm:text-base">{children}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry && <button className="btn btn-ghost" onClick={onRetry}><RotateCcw size={16} aria-hidden />{t('common.retry')}</button>}
        {onContinue && <button className="btn btn-good" onClick={onContinue} autoFocus>{t('common.continue')}<ArrowRight size={16} aria-hidden /></button>}
      </div>
    </motion.div>
  )
}
