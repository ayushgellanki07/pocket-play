# PocketPlay

*Your Adventure. Your Money. Your Future.* A pixel-art RPG + financial simulator. Pappu (or whoever you name) falls through a portal from a classroom onto five islands and must master money to get home.

## Two ways to play

| | Story Mode | Direct Mode |
|---|---|---|
| Entry | Island map hub, islands unlock in order | Topic library (search, category & difficulty filters) or island view |
| Content | Mentor dialogue, choices with consequences, boss challenges | Intro → interactive explanation → practice → results → next action |
| Money | The story's own wallet / reserve / credit score | A throwaway practice sandbox per activity |
| Progress saved as | `storyProgress` | `directModeProgress` (best score, attempts, history, recents) |

Practising in Direct Mode never unlocks an island, skips a chapter or changes story money: minigames read and write money only through `usePlay()` (`src/minigames/PlayContext.tsx`), which points at the story in Story Mode and at a sandbox in Direct Mode.

## Run it

```bash
npm install
npm run dev        # play at http://localhost:5173
npm run build      # production build in dist/ (works from any folder — paths are relative)
npm run preview    # serve the build
```

Tests:

```bash
node --experimental-strip-types tests/finance.test.ts   # every formula + simulation
node --experimental-strip-types tests/i18n.test.ts      # EN/TE/HI key parity, placeholders, dialogue coverage
pip install playwright && playwright install chromium
(cd dist && python3 -m http.server 4173) &
python3 tests/playthrough.py ./shots                    # plays title → all 5 worlds → ending
python3 tests/screens.py ./shots                        # mobile, Telugu/Hindi, corrupt-save checks
python3 tests/dialogue_rules.py ./shots                 # first-playthrough skip lock, replay skipping, live language switch
python3 tests/lang_screens.py ./shots                   # opens every screen + all 15 activities in TE/HI, flags English left over
```

No API keys, no backend. Progress saves to `localStorage` automatically.

## How the code is organised

```
src/
  types.ts                 all TypeScript shapes (GameState, DialogueLine, ScoreCard…)
  lib/finance.ts           pure formulas: EMI, amortisation, effective rate, EPS, P/E, Rule of 72…
  lib/sims.ts              deterministic boss simulations (30-day ledger, credit model, market, 10-year trial)
  lib/audio.ts             music/SFX manager with synthesized fallback
  store/gameStore.ts       Zustand store; save v2 = { settings, storyProgress, directModeProgress };
                           v1 saves are migrated automatically (original kept as pocketplay.save.v1-backup)
  minigames/PlayContext.tsx  story vs sandbox money for every minigame
  data/catalog.ts          islands (map positions, chapters) + the 15 Direct Mode activities
  lib/storyProgress.ts     island status / completion / mastery for the map and HUD
  store/uiStore.ts         pause/ledger/map overlays (timers pause while open)
  store/fxStore.ts         floating "+₹15,000" toasts and coin bursts
  i18n/strings.ts          base English / తెలుగు / हिंदी dictionary, merged with every content area
  i18n/content/            catalog.ts (characters, islands, topics, activities) · games.ts (all minigame
                           and simulation text) · ui.ts · dialogue.ts (story lines in TE/HI, keyed script.line)
  i18n/useT.ts             t() hook, tNow() for event handlers, keyText() for saved {key, vars} records
  lib/dialoguePolicy.ts    the one rule book for skipping (first playthrough vs replays vs Direct Mode)
  data/worlds.ts           each world's art, palette, guide and ordered steps
  data/dialogue.ts         all dialogue as structured data
  data/learning.ts         learning cards in 3 languages
  components/              TitleScreen, CharacterSetup, GameShell, WorldScene, DialogueController,
                           FinancialHUD, LearningWidget, MinigameShell, TransactionLedger,
                           ProgressionMap, PauseMenu/SettingsPanel, WorldTransition, Ending, MasteryScorecard…
  minigames/               one file per minigame + index.ts registry
tools/make_assets.py       rebuilds backgrounds, Pappu cut-outs (hair fix included) and NPC portraits
tools/make_map.py          draws the pixel-art archipelago used by the island map
```

**Key design decisions**

- **Math never lives in components.** UI calls `lib/finance.ts` / `lib/sims.ts`, so every number is unit-tested.
- **One way to change money.** All wallet/reserve changes go through `applyTx`, which also writes the ledger — the HUD can't drift from the books.
- **Minigames commit only on success**, from click handlers (not effects), so nothing is double-counted on retries or React StrictMode re-runs.
- **Worlds are data.** A world is a list of `dialogue → learn → game` steps; `WorldScene` just walks the list.
- **Text is never stored, keys are.** Ledger rows, simulation logs and credit notes save an i18n key plus values
  (`{ label: 'tx.day', vars: { d: 7, itemKey: 'ev.rent' } }`) and are translated when shown, so switching
  language re-labels old history too. Numbers stay numbers; only `lib/finance.ts` formats them.
- **Numeral policy.** Western digits with Indian grouping (₹1,50,000) in every language. Digits and ₹ come from a
  "PP Digits" font face (Noto Sans limited by `unicode-range`) placed first in every font stack — Pixelify Sans
  draws a bold 5 that looks like 8/S and has no ₹ glyph, which was the cause of the "5" bug.
- **Dialogue skipping** is decided only by `dialogueRules()`: on the first Story playthrough
  (`profile.storyPlaythroughsCompleted === 0`) lines must finish typing and can only be advanced one at a time
  (400 ms cooldown, key-repeat ignored, Skip shown disabled with the reason). After one full completion the
  player can skip typing, skip conversations already seen, and fast-forward. Direct Mode is never restricted.
  The counter lives in the save's `profile`, rises once per successful ending, and survives new runs/resets.

## Adding content

- **Music:** drop MP3s into `public/assets/audio/` using the spec names (`bgm_acoustic_frontier.mp3`, `bgm_marble_halls.mp3`, `bgm_dark_granite.mp3`, `bgm_industrial_exchange.mp3`, `bgm_celestial_sovereign.mp3`, optional `bgm_title.mp3`) and list them in `public/assets/audio/manifest.json`. Unlisted tracks fall back to a generated ambient loop per world.
- **Art:** replace files in `public/assets/bg` and `public/assets/chars` (keep names). Broken images fall back to a drawn silhouette.
- **Dialogue:** edit `src/data/dialogue.ts`. Highlighted terms go in `highlightedTerms`.

## Features

Title screen with portal, Continue/New Game, language & sound settings, instructions · name entry · persistent HUD (wallet, reserve, credit score, mastery, objective) with animated counters · typewriter dialogue with first-playthrough skip lock, replay skip/fast-forward, history, choices, highlighted terms · ledger, journey map, pause menu, reset with confirmation · portal transitions · 11 minigames + crate puzzle: SurvivalSorter, BargainMatrix, OutpostLedger30Days, DepositMatchmaker, scam alert, GuildFraudGauntlet (swipe + buttons + arrow keys), CompoundingSnowball, EMIRestructuringSimulator, ValueDetective, MarketCycleSimulator, RuleOf72, MasterSovereignTrial · scored ending with fade to white · EN/TE/HI · reduced-motion support, keyboard play, touch-friendly click alternatives for every drag.

## Test checklist (Story + Direct)

- [ ] Title shows PocketPlay; Play → mode select explains both modes
- [ ] Story starts on the island map with only island 1 open; islands 2–5 locked with unlock hints
- [ ] Each boss win plays the portal and returns to the map with the next island unlocked
- [ ] Story choices (bounty → reserve, rushing Virendra's loan → −10 credit) apply once
- [ ] Direct Mode opens any activity on a fresh save; scores/attempts recorded; story save unchanged
- [ ] Refresh keeps both progress records; a v1 save migrates and is backed up
- [ ] First playthrough: Skip disabled, typing can't be skipped, rapid clicks advance one line only
- [ ] After finishing once: Skip, skip-typing and Fast-forward work; starting a new story keeps the count
- [ ] Switching language mid-dialogue keeps the same line; mid-minigame keeps the minigame state

## Original test checklist

- [ ] Title opens; New Game → name → World 1 with wallet ₹0
- [ ] Crate puzzle pays ₹15,000 and the HUD counts up
- [ ] Sorter rejects wrong piles / overspending; win pays ₹11,000 needs and moves ₹500 to reserve
- [ ] Bargain: A or C fails with worked example; B (₹80/unit) succeeds
- [ ] Ledger: bills days 7/14/21/28, ₹1,500 emergency day 18, ≥ ₹2,000 to win
- [ ] World 2 unlocks only after the ledger boss
- [ ] Deposit match, scam alert (PIN = fail), gauntlet needs 10/10
- [ ] Snowball shows 60% nominal vs 79.6% effective; regulated EMI ₹1,243.88
- [ ] EMI sim reaches 770 with 6 on-time payments and no vanity loans
- [ ] Value Detective: HyperVapor P/E "not meaningful", SolarGrid EPS ₹15, P/E 16
- [ ] Market: panic-sell fails with comparison; holding wins
- [ ] Rule of 72 quiz; 10-year trial scorecard depends on choices; pass → classroom ending
- [ ] Refresh mid-game → Continue restores; Reset clears after confirmation
- [ ] Switch EN/TE/HI mid-game without losing progress

## Notes & assumptions

All rates, prices, companies and market returns are fictional teaching values. The credit model is a simple teaching model, **not** the official CIBIL formula. Nothing here is financial advice.
