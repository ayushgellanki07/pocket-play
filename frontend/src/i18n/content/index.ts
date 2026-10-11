// Every content area of the game's text. Add a new area here and it is merged into DICTS automatically.
import type { Area } from './types.ts'
import { catalog } from './catalog.ts'
import { games } from './games.ts'
import { ui } from './ui.ts'

export const AREAS: Area[] = [catalog, games, ui]
