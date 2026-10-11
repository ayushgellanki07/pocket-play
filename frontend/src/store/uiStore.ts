// Non-saved UI state: overlays, and where the map / Direct Mode should open.
import { create } from 'zustand'
import type { WorldId } from '../types.ts'
import type { CategoryId } from '../data/catalog.ts'

type Overlay = null | 'pause' | 'ledger'
interface Ui {
  overlay: Overlay
  setOverlay: (o: Overlay) => void
  mapFocus: WorldId | null               // island to pre-select when the Story map opens
  setMapFocus: (w: WorldId | null) => void
  directFocus: CategoryId | null         // category filter when Direct Mode opens
  setDirectFocus: (c: CategoryId | null) => void
}
export const useUi = create<Ui>((set) => ({
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  mapFocus: null,
  setMapFocus: (mapFocus) => set({ mapFocus }),
  directFocus: null,
  setDirectFocus: (directFocus) => set({ directFocus }),
}))
/** Timers stop whenever an overlay (pause menu, ledger) is open. */
export const useIsPaused = () => useUi(s => s.overlay !== null)
