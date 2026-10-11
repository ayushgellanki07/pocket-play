import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore.ts'
import { useUi } from '../store/uiStore.ts'
import { useT } from '../i18n/useT.ts'
import { WORLDS } from '../data/worlds.ts'
import { FinancialHUD } from './FinancialHUD.tsx'
import { WorldScene } from './WorldScene.tsx'
import { PauseMenu } from './PauseMenu.tsx'
import { TransactionLedger } from './TransactionLedger.tsx'
import { WorldTransition } from './WorldTransition.tsx'
import { useFx } from '../store/fxStore.ts'
import type { WorldId } from '../types.ts'

/** The in-game screen: HUD + current world + overlays + world-to-world transitions. */
export function GameShell() {
  const t = useT()
  const worldId = useGame(s => s.activeWorld)
  const sceneIndex = useGame(s => s.sceneIndex)
  const advance = useGame(s => s.advanceScene)
  const unlock = useGame(s => s.unlockNextWorld)
  const overlay = useUi(s => s.overlay)
  const setOverlay = useUi(s => s.setOverlay)
  const setMapFocus = useUi(s => s.setMapFocus)
  const setPhase = useGame(s => s.setPhase)
  const push = useFx(s => s.push)
  const [transitionTo, setTransitionTo] = useState<WorldId | null>(null)

  const world = WORLDS[worldId]
  const step = world.steps[Math.min(sceneIndex, world.steps.length - 1)]
  const objective = t(step.objective, { who: t(`char.${world.guide}.name`) })
  const nextStep = world.steps[sceneIndex + 1]
  const next = nextStep ? t(nextStep.objective, { who: t(`char.${world.guide}.name`) }) : worldId < 5 ? `${t('transition.unlocked')}: ${t(`world.${worldId + 1}`)}` : t('end.message')

  const onStepDone = useCallback(() => {
    const s = useGame.getState()
    const w = WORLDS[s.activeWorld]
    if (s.sceneIndex + 1 < w.steps.length) { advance(); return }
    if (s.activeWorld < 5) {
      const next = (s.activeWorld + 1) as WorldId
      unlock() // progress is saved before the cinematic plays
      push(`${t('transition.unlocked')}: ${t(`world.${next}`)}`, 'unlock')
      setTransitionTo(next)
    }
  }, [advance, unlock, push, t])

  // Escape opens the pause menu (modals handle their own Escape to close).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !useUi.getState().overlay) setOverlay('pause') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOverlay])

  return (
    <main className="relative h-full w-full overflow-hidden" style={{ ['--accent' as string]: world.accent, ['--accent-2' as string]: world.accent2 }}>
      <WorldScene onStepDone={onStepDone} />
      <FinancialHUD objective={objective} next={next} />
      <AnimatePresence>
        {overlay === 'pause' && <PauseMenu key="p" onClose={() => setOverlay(null)} />}
        {overlay === 'ledger' && <TransactionLedger key="l" onClose={() => setOverlay(null)} />}
        {transitionTo && <WorldTransition key="t" to={transitionTo} onDone={() => { setTransitionTo(null); setMapFocus(transitionTo); setPhase('map') }} />}
      </AnimatePresence>
    </main>
  )
}
