// Tiny event store for transient visual effects (floating "+₹15,000", coin bursts, toasts).
// Kept separate from the saved game state because effects should never be persisted.
import { create } from 'zustand'

export type FxTone = 'income' | 'expense' | 'saving' | 'loss' | 'shield' | 'invest' | 'unlock' | 'info'
export interface FxItem { id: number; text: string; tone: FxTone }

let n = 0
export const useFx = create<{ items: FxItem[]; coins: number; push: (text: string, tone: FxTone) => void; burst: () => void }>((set, get) => ({
  items: [],
  coins: 0,
  push: (text, tone) => {
    const id = ++n
    set({ items: [...get().items, { id, text, tone }] })
    setTimeout(() => set({ items: get().items.filter(i => i.id !== id) }), 2600)
  },
  burst: () => set({ coins: get().coins + 1 }),
}))
