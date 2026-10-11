import { useGame } from '../store/gameStore.ts'
import type { Lang } from '../types.ts'
import { audio } from '../lib/audio.ts'
import { useT } from '../i18n/useT.ts'

const LANGS: { id: Lang; label: string }[] = [{ id: 'en', label: 'English' }, { id: 'te', label: 'తెలుగు' }, { id: 'hi', label: 'हिंदी' }]

/** English | తెలుగు | हिंदी — switching never touches game progress. */
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const t = useT()
  const lang = useGame(s => s.language)
  const set = useGame(s => s.setLanguage)
  return (
    <div className="inline-flex overflow-hidden rounded-sm border-2 border-black/70" role="radiogroup" aria-label={t('title.language')}>
      {LANGS.map(l => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} aria-label={l.label} lang={l.id}
          onClick={() => { audio.sfx('click'); set(l.id) }}
          className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-semibold transition-colors ${lang === l.id ? 'bg-[var(--accent)] text-ink' : 'bg-black/40 text-parchment hover:bg-white/10'}`}>
          {compact ? l.id.toUpperCase() : l.label}
        </button>
      ))}
    </div>
  )
}
