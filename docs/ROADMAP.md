# The T-Rex Game — development roadmap

Status: working plan, pending Cat and Claude review. Updated 2026-10-18.

## Collaboration rules
- Work on topic branches and submit pull requests; avoid direct commits to `main`.
- Check current `main` and open PRs before each change; Claude may be changing gameplay concurrently.
- Keep 480×200 native canvas, hard-edged pixel art, and current sprite/JSON contracts.
- Test at native 1× resolution and scaled display; verify keyboard and touch controls.
- No secrets or privileged service keys in client-side code. Supabase anon/public keys are not secrets, but score submissions need server-side validation and suitable RLS/abuse controls.

## Current observations (verified from main)
- `game.js` includes a Supabase REST score submission and top-10 loading implementation; persistence exists in code but needs live functional/security testing.
- `game.js` has RAWR sound functions and a running-game implementation.
- `LEVEL_CFG` currently describes Grasslands, Forest, Ice, Volcano and Endless; earlier art plans described Grasslands, Volcano, Desert, Swamp and Caverns. Resolve this discrepancy before changing assets or level order.
- Latest inspected commit: `f15fc049` (spawn/frequency changes).

## Milestones

### M0 — Audit and baseline
- Inventory assets, game states, level config, current UI and controls.
- Verify deployed version matches `main`, and check existing open PRs.
- Document reproducible smoke tests: boot, start, jump, NOM, RAWR, capture, obstacle death, level transition, leaderboard, restart, touch.

### M1 — Chaseable character V03
- Integrate V03 stegosaurus and small-dino sprites only after Claude's final QA.
- Confirm grounded pivots, animation FPS, panic, capture and score-once semantics.

### M2 — RAWR polish
- Improve T-Rex roar animation without changing unrelated atlas rows or pivots.
- Verify cooldown, effects, sound, mobile control and accessibility/reduced-motion considerations.

### M3 — Title screen
- Add arcade title art and Start, Leaderboard, Settings controls.
- Preserve fast start/restart; support keyboard and touch; audio starts only after user gesture.

### M4 — Persistent leaderboard
- Audit existing Supabase integration before redesign.
- Verify submission success/failure handling, ranking, name sanitisation, duplicate/spam resistance, RLS, and graceful offline behaviour.
- Add clear top-10 UI, personal best and accessible name entry; don't put service-role credentials in browser.

### M5 — Phantom Raptor boss chase prototype
- Prototype with placeholder sprites first. Keep world scrolling and controls unchanged: Jump, NOM, RAWR.
- Boss stays ahead of player. Telegraphed obstacle attacks, temporary camouflage, reveal/stagger by timed RAWR, then NOM window.
- Start with one attack, one reveal and one NOM cycle; expand to three only if the first cycle is fun.
- Fairness rules: always-visible telegraph even while invisible; no unavoidable spawns; clear win/loss; no surprise input requirement.
- Separate boss encounter logic from level spawning; verify collisions and score cannot trigger repeatedly.

### M6 — Art, level and difficulty consistency
- Agree canonical five-level naming/order and map existing backgrounds/obstacles.
- Polish remaining rocks and cactus variants; review 1× readability.

### M7 — Release quality
- Regression tests for all levels, leaderboard, audio, touch, restart, mobile sizing, and caching.
- Version release and changelog.

## First implementation PR after this plan
A small, reviewable **baseline audit and smoke-test checklist**. Then integrate V03 character assets, followed by RAWR improvements. Do not begin boss art until prototype controls and timing are validated.
