import { AnimatePresence } from 'framer-motion'
import { WORLDS } from '../data/worlds.ts'
import { useGame } from '../store/gameStore.ts'
import { ParallaxBackground } from './ParallaxBackground.tsx'
import { DialogueController } from './DialogueController.tsx'
import { LearningWidget } from './LearningWidget.tsx'
import { MINIGAMES } from '../minigames/index.ts'
import { StoryPlayProvider } from '../minigames/PlayContext.tsx'

/** Renders the current step of the active world: a dialogue, a learning card or a minigame. */
export function WorldScene({ onStepDone }: { onStepDone: () => void }) {
  const worldId = useGame(s => s.activeWorld)
  const sceneIndex = useGame(s => s.sceneIndex)
  const world = WORLDS[worldId]
  const step = world.steps[sceneIndex]
  const Game = step?.kind === 'game' ? MINIGAMES[step.id] : null
  const key = `${worldId}-${sceneIndex}`
  return (
    <div className="absolute inset-0">
      <ParallaxBackground world={world} />
      <AnimatePresence mode="wait">
        {step?.kind === 'dialogue' && <DialogueController key={key} scriptId={step.id} guide={world.guide} onDone={onStepDone} />}
        {step?.kind === 'learn' && <LearningWidget key={key} id={step.id} onDone={onStepDone} />}
        {Game && <StoryPlayProvider key={key}><Game onComplete={onStepDone} /></StoryPlayProvider>}
      </AnimatePresence>
    </div>
  )
}
