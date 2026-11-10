# Roadmap (PR #3) and architecture review

Reviewed 2026-10-18 by Claude against `main` (f15fc04) and PR #1 branch `claude/sprite-engine-ifrm97` (cd16e92). PR #3 head: 82ad62d.

> Update (same day): Cat approved the plan and PR #1 was merged into `main` (0e9afab), so "main is stale" below no longer applies. File/line references are to `game.js` as merged.

## TL;DR

- **The roadmap was written against `main`, but `main` is stale.** All art and engine work from the last two days lives on draft PR #1 (14 commits ahead, nothing on `main` it lacks). Several "current observations" are therefore out of date.
- **The level discrepancy is already settled in code on PR #1:** Grasslands, Volcano, Desert, Swamp, Caverns, with all five environment art sets loaded. Merging PR #1 resolves it for `main`.
- **But Caverns is unreachable.** Level 4 (Swamp) has an infinite duration, so the game never advances to level 5. Same bug on `main` (there it's "Volcano" that's endless and "Endless" that's unreachable).
- **There is no NOM button.** NOM happens automatically on contact. The boss plan says "NOM when vulnerable", which works if NOM stays contact-based.
- **Small RAWR does nothing to gameplay.** Only the held/big RAWR affects enemies, and it makes chaseables *harder* to catch.
- **Physics are tied to screen refresh rate.** On 120 Hz phones/iPads the game runs twice as fast while level timers stay in real seconds.
- **Phantom Raptor is feasible** with modest changes; the sprite engine already supports transparency (`opts.alpha`) for the invisibility effect.
- **Recommended next task:** merge PR #1 (with Cat's OK), then one small "baseline fixes" PR: reachable Caverns, fixed timestep, death-screen race, smoke-test checklist.

## 1. Roadmap accuracy (PR #3)

| Roadmap says | Reality | Fix in roadmap |
|---|---|---|
| "Current observations (verified from main)" | `main` is 14 commits behind the real working version (PR #1, draft). | Say observations come from PR #1; add "merge PR #1" as step zero. |
| `LEVEL_CFG` = Grasslands, Forest, Ice, Volcano, Endless; resolve before more art | On PR #1 `LEVEL_CFG` + `THEMES` = Grasslands, Volcano, Desert, Swamp, Caverns, each with art (`assets/environments/*`). Cat chose this lineup on 2026-10-17. | Mark resolved. Canonical order: **1 Grasslands → 2 Volcano → 3 Desert → 4 Swamp → 5 Caverns (endless)**. |
| (not mentioned) | Level 4 is `dur: Infinity`, so level 5 is never reached (`game.js:54`, check at `game.js:1180`). | Add to M0/M6: give Swamp a duration. |
| M1: integrate V03 stegosaurus and small-dino "after Claude's final QA" | Already integrated and approved on PR #1 (cd16e92). | M1 becomes "merge PR #1". |
| Controls "Jump, NOM, RAWR" | Inputs are Jump (tap/Space/↑, double jump) and RAWR (button, R = small, E = big). NOM is automatic on contact. | Clarify NOM is contact-based, or schedule a NOM input as a design decision. |
| M2 "verify cooldown" | Cooldowns exist: small 1.5 s, big 5 s. RAWR art row exists (4 frames, 10 fps) and plays. | Fine; also decide what small RAWR *does* (see §2.4). |
| M3 title screen | A canvas title screen exists with Start + Hall of Fame. Its text says "4 WORLDS + ENDLESS" and omits stegosaurus (+35). | Fine as "replace with title art"; keyboard can't reach Hall of Fame. |
| M4 leaderboard | Accurate. Couldn't test live from here (Supabase host blocked by this session's network policy). | Needs Cat to check Supabase RLS (see §2.3). |
| M0 "verify deployed version matches main" | Good idea. Also note `sw.js` serves game code cache-first and must have `CACHE` bumped every release or players keep old code. | Add to M7. |
| Collaboration rules, fairness rules for boss, placeholder-first boss | Good, agree. | Keep. |

## 2. Architecture review

Structure: `index.html` + `game.js` (~1200 lines, one global script) + `sprites.js` (asset loader and `Animator`) + `sw.js` (PWA cache). No build step, no tests. Art is data-driven via `assets/manifest.json` and per-sheet JSON sidecars, falling back to placeholder drawings.

### 2.1 Working (PR #1; booted headless with no console errors)
- Five themed levels with parallax art, per-level music, timers, level-complete screen, cumulative score across levels, die → back to level 1.
- Jump + double jump, pterodactyls as prey (airborne mouth catch, +50, once), swooping pterodactyls (30–50% per level), chaseables: small dino +25, stegosaurus +35, caveman +40 (cavemen jump obstacles).
- Volcano lava eruptions with warning telegraph.
- Sprite atlases for T-Rex (idle/run/jump/fall/land/hurt/eat/celebrate/rawr), pterodactyl, caveman, small dino, stegosaurus, 15 obstacles, 3 FX.
- `?debug` hitboxes and `?placeholders` mode.
- Local high score, player name prompt, online Hall of Fame (top 10).

### 2.2 Incomplete or inconsistent
- **Caverns unreachable** (Swamp endless). Title text says "4 worlds + endless", which matches the intent of 4 timed + 1 endless.
- **Difficulty ramp** only applies on levels 4–5 (`levelIdx>=3`), speed cap 13 / 22.
- **NOM** has no input; ground bites don't exist.
- **Small RAWR** is cosmetic only.
- Unused art/code: snowball sprite, `drawForestExtra` reused as Swamp background extras when art fails, caveman `respawn`, pterodactyl `hurt`, chaseable `stumble` (no art, never plays).
- Keyboard can't hold RAWR (uses R/E instead) and can't open Hall of Fame.

### 2.3 Leaderboard: persistent, but not trustworthy
- Persistent in code: Supabase REST `POST /rest/v1/scores` and `GET ... order=score.desc&limit=10` (`game.js:17-30`). I could not reach the Supabase host from this session, so **live behaviour is unverified**.
- `submitScore` is fire-and-forget: no response check, failures are silent.
- When a new player enters their name, the board loads at the same moment as the submit, so their own score often isn't shown yet (`game.js:1193`).
- Anyone with the public anon key (it's in the page) can POST any name/score unless Supabase RLS or a check constraint blocks it. Needs Cat (or someone with dashboard access) to confirm RLS. Recommended: insert-only policy, `score` range check, or an RPC/Edge Function that sanity-checks score against play time.
- High score (`trex-hi`) is local per device only.
- `trex-lv` persists the current level across reloads, so a reload after completing a level starts a fresh run mid-game with score 0. Minor.

### 2.4 How RAWR works today
- Input: tap the RAWR button (<350 ms) or press **R** = small RAWR; hold the button (>350 ms) or press **E** = big RAWR.
- Small: plays roar sound, 28-tick "RAWR!" bubble and `rawr` animation, cooldown 90 ticks (1.5 s). **No gameplay effect.**
- Big: louder sound, 50-tick "RAAAWR!" bubble with star burst, cooldown 300 ticks (5 s), and `applyRawr()` (`game.js:878`): pterodactyls within 160 px flee (become harmless *and* uneatable, so it saves you from a swoop but forfeits +50) and **every** chaseable panics and runs away faster (makes them harder to catch).
- Net effect: RAWR is a defensive panic button that usually costs points. The boss gives it a real purpose; RAWR's design should be settled alongside the boss.

### 2.5 Sprite system and further animations
Yes, it supports more animations without engine changes:
- Any number of named animations per sheet (rows or explicit frame rects), per-animation fps and loop, fallback chains for missing animations, anchors/pivots, horizontal flip, transparency (`opts.alpha`), centred FX, one-shot animations via `Animator.playOnce` with locking.
- New characters need a `defineSprite` entry in `game.js` + manifest entry + gameplay code to choose animations.
- Limits: integer 1× only (no scaling/rotation/tint), no per-frame events or hitboxes, no palette swaps (a boss "flash" would need its own frames or alpha blinking).

### 2.6 Bugs and technical debt (most important first)
1. **Frame-rate dependent.** All movement/physics/cooldowns advance per `requestAnimationFrame`, but level timers use wall-clock time. On 120 Hz displays (recent iPhones/iPads, many laptops) the game runs at double speed. Fix: fixed 60 Hz timestep accumulator. High priority before boss timing work.
2. **Caverns unreachable** (above).
3. **Background tab:** level timer keeps running while the tab is hidden; returning can instantly complete the level. Pause on `visibilitychange`.
4. **Death → board race:** with a saved name, tapping within 1.2 s of dying restarts the run, then the delayed `goToBoard` yanks the player to the Hall of Fame mid-game (`game.js:1197`).
5. Same-frame level-complete + collision can overwrite `LVLDONE` with `DEAD`.
6. `sw.js` caches `game.js`/`sprites.js` cache-first; forgetting to bump `CACHE` ships stale code. Paths are absolute (`/sw.js`, `/`), which breaks if hosted under a sub-path (e.g. GitHub Pages project site).
7. One 1200-line global script with shared mutable globals; no tests. Fine for now, but the boss should live in its own section/file with a narrow interface.
8. Placeholder drawing code for every sprite stays in `game.js`; can be pruned once art is final.

## 3. Phantom Raptor feasibility

**Feasible.** Continuous scrolling, the obstacle list, collision and the sprite engine all support it. Nothing requires a rewrite.

### Simplest playable prototype (one cycle)
Placeholder art: reuse the T-Rex atlas flipped/tinted-by-alpha, or a coloured placeholder drawing. Trigger with `?boss` URL flag and, later, at a fixed time in one level.

State machine on a single `boss` object (x relative to screen, world keeps scrolling):
1. **Enter**: runs in from the right, settles ~120–150 px ahead of T-Rex. Normal spawning pauses.
2. **Attack**: telegraph (dust/flash for ~0.75 s), then drops one obstacle behind it into the existing `obstacles` list. Normal jump/collision rules apply.
3. **Cloak**: fades to near-invisible (`alpha` ~0.15); a visible telegraph stays on (footprint dust on the ground line) per the roadmap fairness rules.
4. **Reveal/stun**: big RAWR (or small, see decision below) while the boss is within range → boss becomes visible and **stunned**, slows and drifts back toward the T-Rex for ~1.5 s.
5. **NOM**: if the T-Rex body/mouth touches the stunned boss → +bonus, hit counted. Contact-based, so no new button.
6. Stun expires untouched → boss recovers, returns ahead, repeat from 2. After N hits (start with 1, then 3) → defeated animation, level resumes.
Loss = the usual death from an obstacle. Touching the boss while *not* stunned: harmless in the prototype (it is ahead of you, so this is rare).

### Changes required
- New `boss` module with `update/draw/onRawr/checkNom` hooks, called from the main loop.
- `applyRawr()` calls `boss.onRawr()`.
- Spawner and level-complete check respect a `bossActive` flag.
- Frame-rate fix (2.6 #1) first, so timing windows feel identical on all devices.
- A tiny debug HUD (boss state + timers) behind `?debug`.

### Decisions for Cat / ChatGPT before building
- Does small RAWR reveal, or only big RAWR? (Recommend: small RAWR reveals, big RAWR reveals + stuns. Gives small RAWR a job.)
- Is NOM contact-only (recommended) or a new button?
- Which level hosts the boss: end of Desert (L3) or a separate boss stage between Swamp and Caverns?

## 4. Proposed priority order

Cat's order is sound; recommended adjustments:

0. **Merge PR #1** (Cat approval), so `main` matches what everyone is looking at.
1. **Baseline fixes + smoke checklist** (engine): reachable Caverns, fixed timestep, pause when hidden, death-board race, title text. This is the roadmap's own "first PR".
2. Character animation integration: essentially done; remaining is art polish rows (stumble, ptero hurt) as ChatGPT supplies them.
3. **RAWR design + animation/effects**, decided together with the boss so the mechanic is built once.
4. **Phantom Raptor placeholder prototype** — moved up ahead of title screen and leaderboard: it's the riskiest design question and drives RAWR. Title and leaderboard are independent and can follow or run alongside.
5. Leaderboard hardening (needs Supabase dashboard check by Cat).
6. Title screen (ChatGPT art, Claude wiring; add keyboard access to Hall of Fame).
7. Environment art polish + difficulty balancing.
8. Regression testing and release polish (including service-worker cache versioning).

## 5. Next engineering task

After PR #1 is merged: one PR, "Baseline fixes", off `main`:
- Swamp gets a duration (default **2:00**; Cat to confirm) so Caverns is the endless finale.
- Fixed 60 Hz update loop; pause level timer when the tab is hidden.
- Fix the death → Hall of Fame race and same-frame level-complete/death.
- Title text: stegosaurus +35, correct world count wording.
- `docs/SMOKE_TEST.md`: boot, start, jump/double jump, ptero catch, swoop, chaseables, small/big RAWR, obstacle death, each level transition, Caverns, leaderboard, restart, touch, 60/120 Hz.
- Screenshots per level.
