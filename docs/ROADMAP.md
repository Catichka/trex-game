# The T-Rex Game — development roadmap

Status: **agreed plan** (Cat approved the way forward on 2026-10-18). Updated 2026-10-18 by Claude after reviewing ChatGPT's first draft against the code.
Engine review behind this plan: [`docs/reviews/2026-10-18-architecture-review.md`](reviews/2026-10-18-architecture-review.md).
How we work together: [`docs/COLLABORATION.md`](COLLABORATION.md).

## Implementation checkpoint — 27 October 2026 (checked against GitHub PR states)

**Current product title: T-Rex Run!** The sections below remain the **18 October baseline/plan**, retained for decision history; do **not** read their present-tense bug lists or milestone statuses as a description of today's `main`. The current implementation has moved significantly beyond that baseline. Only Cat approves merges to `main`; ChatGPT owns art/design/specs, Claude owns engineering/integration/testing.

| Milestone / area | Verified GitHub status | Follow-up |
| --- | --- | --- |
| M0–M1 engine/baseline | Merged PRs [#1](https://github.com/Catichka/trex-game/pull/1) and [#7](https://github.com/Catichka/trex-game/pull/7) | Swamp → Caverns progression and fixed timestep implemented; retain regression tests |
| M2 RAWR/boss design | [#6](https://github.com/Catichka/trex-game/pull/6) remains **open** | Its speculative placement/hit-count decisions are not final approvals; compare with shipped prototype |
| M3 boss prototype | [#8](https://github.com/Catichka/trex-game/pull/8) **merged** | `?boss` playable placeholder; final boss placement/art/hit count require Cat's gameplay feedback |
| M4 visual controls/RAWR | First mobile icons merged [#24](https://github.com/Catichka/trex-game/pull/24); revised production icon art [#58](https://github.com/Catichka/trex-game/pull/58) **open** | Claude to check BITE vs RAWR at actual 1× landscape-phone size, supply 480×200 and 3× screenshots before Cat approval. Draft [#17](https://github.com/Catichka/trex-game/pull/17) is superseded |
| M5 leaderboard/game-over | Hall of Fame and death-screen redesign merged [#38](https://github.com/Catichka/trex-game/pull/38), [#44](https://github.com/Catichka/trex-game/pull/44), [#46](https://github.com/Catichka/trex-game/pull/46), [#48](https://github.com/Catichka/trex-game/pull/48) | Continue security/abuse and offline regression checks; don't infer backend hardening from visual redesign |
| M6 title/UI | Approved art + interactive title merged [#42](https://github.com/Catichka/trex-game/pull/42), [#43](https://github.com/Catichka/trex-game/pull/43); T-Rex Run! logo [#55](https://github.com/Catichka/trex-game/pull/55)/[#56](https://github.com/Catichka/trex-game/pull/56) merged | Phone install prompt merged [#57](https://github.com/Catichka/trex-game/pull/57) on 23 Oct; test real phone |
| M7 world identity/balancing | Volcano art/meteor [#30](https://github.com/Catichka/trex-game/pull/30)/[#34](https://github.com/Catichka/trex-game/pull/34); biome-specific obstacles [#52](https://github.com/Catichka/trex-game/pull/52); smaller grasslands trees [#54](https://github.com/Catichka/trex-game/pull/54) **merged** | Preserve Cat's explicit **no changes to Volcano** request during subsequent biome polish; further balance only after playtesting |
| Music | Score/design [#9](https://github.com/Catichka/trex-game/pull/9) and audio alpha [#31](https://github.com/Catichka/trex-game/pull/31) merged | Grasslands V4 was approved as a compositional benchmark; #31 subsequently installed Folk Dance in D for Grasslands and Baroque for Caverns. Don't assume the V4 synthesizer is the currently playing track |
| Art documentation | [#5](https://github.com/Catichka/trex-game/pull/5) art bible update remains **open** | The `main` art bible is v0.1 and incorrectly names retired Forest/Ice worlds; #5 is technically reviewed, pending Cat approval |
| M8 release | Ongoing | Use [smoke checklist](https://github.com/Catichka/trex-game/blob/main/docs/SMOKE_TEST.md), including desktop/phone, music, mobile install, gameplay, scoreboard |

**Immediate collaboration queue:** (1) Claude: provide actual phone 1×/3× readability evidence for art PR #58, with no premature merge. (2) Cat: playtest boss before locking its final art, Desert placement or number of hits. (3) ChatGPT: only adjust icons after screenshots demonstrate a real ambiguity; keep other art unchanged unless requested. (4) Retire stale open docs/design PRs #3/#5/#6 through Cat's normal approval process; do not silently merge or close them.

**Documentation reconciliation — 29 October 2026:** [Issue #45](https://github.com/Catichka/trex-game/issues/45) is **closed as completed** (27 Oct) after direct verification of the seated dizzy T-Rex sprite, its four-frame metadata and manifest registration from merged [#46](https://github.com/Catichka/trex-game/pull/46). [Issue #2](https://github.com/Catichka/trex-game/issues/2) remains open as a historical art backlog, with a 28 Oct reconciliation comment: do not treat its original unchecked prototype requests as missing production art. The original roadmap below predates major changes in mobile controls, UI and music.

---

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
