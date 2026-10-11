// Derived Story Mode numbers shared by the map, HUD and mode-select screen.
import { WORLDS } from '../data/worlds.ts'
import { ISLANDS, storyChallenges } from '../data/catalog.ts'
import type { GameState, WorldId } from '../types.ts'
import type { IslandStatus, IslandView } from '../components/IslandMap.tsx'

type S = Pick<GameState, 'activeWorld' | 'sceneIndex' | 'scorecard' | 'completedChallenges' | 'mastery'>

const TOTAL_STEPS = ([1, 2, 3, 4, 5] as WorldId[]).reduce((n, w) => n + WORLDS[w].steps.length, 0)

/** Share of all story steps done, 0–100. */
export function storyPercent(s: S) {
  if (s.scorecard) return 100
  let done = 0
  for (let w = 1 as WorldId; w < s.activeWorld; w = (w + 1) as WorldId) done += WORLDS[w].steps.length
  return Math.round(((done + s.sceneIndex) / TOTAL_STEPS) * 100)
}

export function islandStatus(s: S, id: WorldId): IslandStatus {
  if (s.scorecard || id < s.activeWorld) return 'completed'
  if (id > s.activeWorld) return 'locked'
  return s.sceneIndex > 0 ? 'inProgress' : 'available'
}

export function islandStats(s: S, id: WorldId) {
  const status = islandStatus(s, id)
  const steps = WORLDS[id].steps.length
  const progress = status === 'completed' ? 100 : status === 'locked' ? 0 : Math.round((s.sceneIndex / steps) * 100)
  const all = storyChallenges(id)
  const done = all.filter(c => s.completedChallenges.includes(c))
  const mastery = done.reduce((n, c) => n + (s.mastery[`ch:${c}`] ?? 0), 0)
  return { status, progress, done, remaining: all.filter(c => !done.includes(c)), mastery }
}

export const storyViews = (s: S): IslandView[] => ISLANDS.map(island => {
  const st = islandStats(s, island.id)
  return { island, status: st.status, progress: st.progress }
})
