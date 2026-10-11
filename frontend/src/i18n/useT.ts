import { useCallback } from 'react'
import { useGame } from '../store/gameStore.ts'
import { translate } from './strings.ts'

type Vars = Record<string, string | number>
export type TFn = (key: string, vars?: Vars) => string

/** Returns a t() function bound to the current language. Re-renders when the language changes. */
export function useT(): TFn {
  const lang = useGame(s => s.language)
  return useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang])
}

/** Non-React version for event handlers and stores: uses the language at the moment it is called. */
export const tNow: TFn = (key, vars) => translate(useGame.getState().language, key, vars)

/**
 * Text for a stored record (ledger row, sim log line) saved as { key, vars }.
 * Vars whose name ends in "Key" hold another key and are translated too:
 *   t('tx.day', { d: 7, itemKey: 'ev.rent' })  →  "Day 7: Weekly rent & rations"
 */
export function keyText(t: TFn, key: string, vars?: Vars) {
  if (!vars) return t(key)
  const out: Vars = {}
  for (const [k, v] of Object.entries(vars)) {
    if (k.endsWith('Key') && typeof v === 'string') out[k.slice(0, -3)] = t(v)
    else out[k] = v
  }
  return t(key, out)
}
