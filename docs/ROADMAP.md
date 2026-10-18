# The T-Rex Game — development roadmap

Status: **agreed plan** (Cat approved the way forward on 2026-10-18). Updated 2026-10-18 by Claude after reviewing ChatGPT's first draft against the code.
Engine review behind this plan: [`docs/reviews/2026-10-18-architecture-review.md`](reviews/2026-10-18-architecture-review.md).
How we work together: [`docs/COLLABORATION.md`](COLLABORATION.md).

## Collaboration rules
- Roles: **Cat** = creative direction, gameplay feedback, final approval. **ChatGPT** = pixel art, animation, visual design, game design and gameplay specs. **Claude** = gameplay engineering, integration, testing, deployment.
- Work on topic branches and open pull requests; no direct commits to `main` for collaborative changes. Only Cat approves merges to `main`.
- Check current `main` and open PRs before each change; another assistant may be changing related files.
- Keep the 480×200 native canvas, hard-edged pixel art, and the sprite/JSON contract in `docs/ASSET_SPEC.md`.
- Test at native 1× and scaled display; verify keyboard and touch controls.
- No secrets or privileged service keys in client-side code. The Supabase anon key in `game.js` is public by design; score submissions still need server-side validation and RLS/abuse controls.

## Current state (verified 2026-10-18 on `main` @ 0e9afab, after merging PR #1)

### Worlds and level progression (canonical)
| # | World | Length | Notes |
|---|---|---|---|
| 1 | Grasslands | 1:00 | cacti, rocks, logs |
| 2 | Volcano | 1:30 | lava rocks, fire geysers, lava eruptions from the sky |
| 3 | Desert | 2:00 | cacti, rocks |
| 4 | Swamp | **endless today (bug)** → proposed 2:00 | mushrooms, fern logs, logs, stumps |
| 5 | Caverns | endless finale | ice shards read as cave crystals, stumps, rocks |

The older Grasslands / Forest / Ice / Volcano / Endless lineup is retired. Dying sends you back to level 1; score carries across levels.

### Controls (actual)
- **Jump**: tap screen, Space or ↑. Double jump allowed.
- **NOM**: **no button.** NOM happens automatically on contact: the airborne T-Rex's mouth zone catches pterodactyls (+50, once); the body catches small dino (+25), stegosaurus (+35), caveman (+40).
- **RAWR**: tap the RAWR button or press **R** = small RAWR (1.5 s cooldown, sound + animation only, **no gameplay effect**). Hold the button > 350 ms or press **E** = big RAWR (5 s cooldown): pterodactyls within 160 px flee (harmless but uneatable) and all chaseables panic and run away faster.

### Working
- Five parallax worlds with art, per-level music, level timers, level-complete screen, die → level 1.
- Pterodactyls as prey at three heights; 30–50% swoop at the head (eat them mid-jump or die).
- Chaseables with V03 art (small dino, stegosaurus, caveman who jumps obstacles).
- T-Rex atlas: idle, run, jump, fall, land, hurt, eat, celebrate, rawr.
- Sprite system supports any number of named animations, fallbacks, pivots, flip, transparency and one-shot animations.
- Local high score; online Hall of Fame (top 10) via Supabase.
- `?debug` (hitboxes) and `?placeholders` URL flags.

### Known bugs and debt (fix in M1)
1. Caverns is unreachable because Swamp never ends.
2. Physics run per screen refresh: 2× speed on 120 Hz phones/tablets, while level timers use real seconds.
3. Level timer keeps running while the tab is hidden.
4. Tapping within 1.2 s of dying starts a new run, then the Hall of Fame interrupts it.
5. Level-complete and death in the same frame: death wins.
6. Title text says "4 WORLDS + ENDLESS" and leaves out stegosaurus (+35); keyboard can't open the Hall of Fame.
7. Leaderboard submit is fire-and-forget; a new player's own score may be missing from the board; anyone with the public key can post any score unless Supabase RLS blocks it (unverified).
8. `sw.js` serves game code cache-first; the `CACHE` version must be bumped every release.

## Milestones (in order)

### M0 — Merge the engine branch ✅
PR #1 merged 2026-10-18. `main` now matches what everyone has been reviewing.

### M1 — Baseline fixes + smoke test (Claude)
- Swamp gets a duration (default 2:00, Cat to confirm) so Caverns is the endless finale.
- Fixed 60 Hz update loop; pause when the tab is hidden.
- Fix the death → Hall of Fame race and same-frame level-complete/death.
- Correct the title text; keyboard access to the Hall of Fame.
- `docs/SMOKE_TEST.md`: boot, start, jump/double jump, ptero catch, swoop, chaseables, small/big RAWR, obstacle death, every level transition, Caverns, leaderboard, restart, touch, 60/120 Hz.

### M2 — RAWR design + Phantom Raptor spec (ChatGPT spec, Cat approves)
Decide RAWR and the boss together, because the boss is what gives RAWR a purpose.
- What does small RAWR do? (Claude's suggestion: small RAWR reveals the cloaked boss; big RAWR reveals and stuns.)
- Should big RAWR keep scaring chaseables away? (Today it costs points.)
- NOM stays contact-based (recommended) or becomes a button?
- Which level hosts the boss: end of Desert, or a boss stage between Swamp and Caverns?
- RAWR animation/effects art brief (ChatGPT), without changing other atlas rows or pivots.

### M3 — Phantom Raptor placeholder prototype (Claude)
Placeholder art first; world keeps scrolling; controls stay Jump / NOM / RAWR.
One cycle first, behind a `?boss` URL flag:
1. **Enter**: boss runs in and settles ~120–150 px ahead. Normal spawning pauses.
2. **Attack**: ~0.75 s telegraph, then it drops one obstacle behind it (normal jump/collision rules).
3. **Cloak**: fades to near-invisible; a visible tell remains (dust footprints on the ground line).
4. **Reveal/stun**: RAWR in range → visible + stunned; it slows and drifts back toward the T-Rex for ~1.5 s.
5. **NOM**: touching the stunned boss scores a hit. Contact-based, no new button.
6. Stun expires untouched → it recovers and repeats from 2. After N hits (start with 1, expand to 3 only if fun) → defeated, level resumes.

Fairness rules: always-visible telegraph even while invisible; no unavoidable spawns; clear win/loss; no surprise input. Boss logic lives separately from level spawning; collisions and score can't trigger twice.
Engine changes: `boss` module with update/draw/onRawr/checkNom hooks; `applyRawr()` notifies the boss; spawner and level timer respect a `bossActive` flag; boss state in the `?debug` overlay. Boss art starts only after Cat has played the prototype.

### M4 — RAWR polish (ChatGPT art, Claude integration)
Final RAWR animation/effects once M2–M3 settle what RAWR does. Check cooldown display, sound, mobile control, reduced motion.

### M5 — Persistent leaderboard hardening (Claude; Cat checks Supabase dashboard)
- Confirm RLS: insert-only for anon, no update/delete; score range check or an RPC/Edge Function that sanity-checks score vs play time.
- Handle submit failure/offline; show the player's own score reliably; personal best; name sanitising and length.
- No service-role credentials in the browser.

### M6 — Arcade title screen (ChatGPT art, Claude wiring)
Title art with Start, Hall of Fame and Settings; fast start/restart; keyboard + touch; audio starts only after a user gesture.

### M7 — Environment art and difficulty balancing
- Finish open art notes: Grasslands bushes vs cactus green, Caverns mid-layer crystals that look like obstacles, mushroom/fern-log 1 px float, rock/cactus polish.
- Rebalance speeds, spawn rates and level lengths across all five worlds with the frame-rate fix in place.

### M8 — Regression testing and release
Run the smoke test on desktop + phone, check service-worker cache versioning, version tag and changelog.

## Next implementation PR
**M1 baseline fixes** (Claude), branched from `main`. In parallel, ChatGPT can draft the **M2 RAWR + Phantom Raptor spec** as a docs PR.
