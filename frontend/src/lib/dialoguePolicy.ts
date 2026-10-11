// The single place that decides what a player may skip. The dialogue box and learning cards
// ask these rules instead of each inventing their own.
//
//   ADVANCING = going from a finished line to the next one. Always allowed (one line per press).
//   SKIPPING  = finishing the typewriter instantly, or jumping past a whole conversation.
//
// First Story Mode playthrough (storyPlaythroughsCompleted === 0): no skipping of any kind.
// Later playthroughs: typing can be skipped; whole conversations can be skipped once seen.
// Direct Mode has no mandatory story dialogue, so nothing there is locked.

export interface DialogueContext {
  mode: 'story' | 'direct'
  playthroughs: number      // profile.storyPlaythroughsCompleted
  seen: boolean             // this conversation was read to the end before
  mandatory: boolean        // story dialogue and learning cards are mandatory
}

export interface DialogueRules {
  firstRun: boolean
  canSkipTyping: boolean          // tap while text types → show the whole line
  canSkipConversation: boolean    // Skip button jumps to the end of the conversation
  advanceCooldownMs: number       // minimum gap between two advances (stops rapid-click skipping)
  learningMinReadMs: number       // "Got it" unlocks after this long on a mandatory card
}

export function dialogueRules(c: DialogueContext): DialogueRules {
  const firstRun = c.mode === 'story' && c.playthroughs === 0
  return {
    firstRun,
    canSkipTyping: !firstRun,
    canSkipConversation: c.mode === 'direct' || !c.mandatory || (!firstRun && c.seen),
    advanceCooldownMs: firstRun ? 400 : 150,
    learningMinReadMs: firstRun && c.mandatory ? 4000 : 0,
  }
}
