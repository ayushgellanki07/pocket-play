import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Pixel-art portrait with an animated entrance. If an image is missing, a drawn
 * silhouette is shown instead of a broken-image icon.
 */
export function CharacterPortrait({ src, alt, side, active, color, className = '' }: { src: string; alt: string; side: 'left' | 'right'; active: boolean; color: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <motion.div
      key={src}
      initial={{ opacity: 0, x: side === 'left' ? -60 : 60 }}
      animate={{ opacity: 1, x: 0, filter: active ? 'brightness(1) saturate(1)' : 'brightness(.74) saturate(.85)', scale: active ? 1 : 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 160 }}
      className={`relative ${className}`}
    >
      <div className="absolute inset-x-[10%] bottom-0 h-1/3 rounded-full blur-2xl" style={{ background: color, opacity: active ? 0.35 : 0.1 }} aria-hidden />
      {broken ? (
        <svg viewBox="0 0 36 46" className="pixel relative h-full w-auto" role="img" aria-label={alt}>
          <rect x="11" y="9" width="14" height="18" fill={color} opacity=".7" />
          <polygon points="3,46 6,33 12,30 24,30 30,33 33,46" fill={color} opacity=".5" />
        </svg>
      ) : (
        <img src={src} alt={alt} onError={() => setBroken(true)} className={`pixel relative h-full w-auto select-none object-contain ${active ? 'float' : ''}`} draggable={false} />
      )}
    </motion.div>
  )
}
