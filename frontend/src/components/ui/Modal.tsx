import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

/** Accessible modal: traps initial focus, closes on Escape, dims the scene behind. */
export function Modal({ title, onClose, children, wide = false, labelClose = 'Close' }: { title: string; onClose?: () => void; children: ReactNode; wide?: boolean; labelClose?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`panel relative flex max-h-[92vh] w-full flex-col outline-none ${wide ? 'max-w-5xl' : 'max-w-xl'}`}
        initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <h2 className="font-pixel text-xl text-[var(--accent)] sm:text-2xl">{title}</h2>
          {onClose && <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label={labelClose}><X size={18} /></button>}
        </div>
        <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </motion.div>
  )
}
