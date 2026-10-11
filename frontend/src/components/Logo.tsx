import { useT } from '../i18n/useT.ts'

/**
 * PocketPlay emblem: a gold coin that doubles as an explorer's compass, with a portal swirl,
 * a tiny island and a ₹ at its heart — adventure + money, without looking like a bank.
 */
export function Emblem({ size = 64, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="h-full max-h-full w-full max-w-full shrink-0" style={{ maxWidth: size, maxHeight: size }}>
      <defs>
        <radialGradient id="pp-portal" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#e8fdff" />
          <stop offset="35%" stopColor="#3ee6f0" />
          <stop offset="75%" stopColor="#5b3fd1" />
          <stop offset="100%" stopColor="#1c163a" />
        </radialGradient>
        <linearGradient id="pp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="55%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#c98a12" />
        </linearGradient>
      </defs>
      {/* coin rim with milled edge */}
      <circle cx="50" cy="50" r="47" fill="url(#pp-gold)" stroke="#5a3a00" strokeWidth="3" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2
        return <line key={i} x1={50 + Math.cos(a) * 42} y1={50 + Math.sin(a) * 42} x2={50 + Math.cos(a) * 46} y2={50 + Math.sin(a) * 46} stroke="#a86f0a" strokeWidth="2" />
      })}
      {/* portal face */}
      <circle cx="50" cy="50" r="36" fill="url(#pp-portal)" stroke="#5a3a00" strokeWidth="2.5" />
      <g style={spin ? { transformOrigin: '50px 50px', animation: 'portal-spin 14s linear infinite' } : undefined}>
        <path d="M50 22 C66 26 74 40 70 52 C66 64 52 66 46 58 C42 52 48 44 54 48" fill="none" stroke="#bdf6ff" strokeWidth="2" opacity=".7" />
        {/* compass star */}
        <polygon points="50,12 55,45 50,50 45,45" fill="#f3ead7" stroke="#1c163a" strokeWidth="1.2" />
        <polygon points="50,88 55,55 50,50 45,55" fill="#7a5cff" stroke="#1c163a" strokeWidth="1.2" />
        <polygon points="12,50 45,45 50,50 45,55" fill="#3ee6f0" stroke="#1c163a" strokeWidth="1.2" />
        <polygon points="88,50 55,45 50,50 55,55" fill="#3ee6f0" stroke="#1c163a" strokeWidth="1.2" />
      </g>
      {/* little island + palm */}
      <ellipse cx="50" cy="73" rx="16" ry="4.5" fill="#e0b46a" stroke="#5a3a00" strokeWidth="1.2" />
      <path d="M53 72 Q55 64 54 60" stroke="#6b3f17" strokeWidth="2" fill="none" />
      <path d="M54 60 q-7 -3 -11 2 M54 60 q6 -4 10 1 M54 60 q-2 -6 -7 -7" stroke="#2fbf71" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* rupee hub */}
      <circle cx="50" cy="50" r="9" fill="url(#pp-gold)" stroke="#5a3a00" strokeWidth="1.5" />
      <text x="50" y="54.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#5a3a00" fontFamily="Noto Sans, sans-serif">₹</text>
    </svg>
  )
}

export function Logo({ size = 'md', tagline = true, spin = false }: { size?: 'sm' | 'md' | 'lg'; tagline?: boolean; spin?: boolean }) {
  const t = useT()
  const emblem = size === 'lg' ? 96 : size === 'md' ? 60 : 34
  const word = size === 'lg' ? 'text-[2.6rem] sm:text-8xl' : size === 'md' ? 'text-4xl sm:text-5xl' : 'text-2xl'
  const emblemCls = size === 'lg' ? 'h-14 w-14 sm:h-24 sm:w-24' : ''
  return (
    <div className="inline-flex flex-col items-center">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className={emblemCls}><Emblem size={emblem} spin={spin} /></span>
        <span className={`font-pixel font-bold leading-none tracking-tight ${word}`} style={{ textShadow: '0 3px 0 #0b0818, 0 0 22px rgba(62,230,240,.45)' }}>
          <span className="text-parchment">Pocket</span><span className="text-gold">Play</span>
        </span>
      </div>
      {tagline && <p className={`mt-2 font-pixel text-cyan ${size === 'lg' ? 'text-lg sm:text-2xl' : 'text-sm sm:text-base'}`}>{t('app.subtitle')}</p>}
    </div>
  )
}
