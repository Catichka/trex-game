# M2 Design Proposal — RAWR and the Phantom Raptor
**Status:** Proposed for Cat's creative approval and Claude's feasibility review; no gameplay changes authorised by this document.
**Date:** 2026-10-18 · Owner: ChatGPT (design)

## The design problem
The T-Rex Game is a continuous 480×200 auto-runner. Players **jump** (including double jump), **tap/R for small RAWR**, or **hold >350 ms/E for big RAWR**. **There is no NOM button:** T-Rex eats prey automatically on contact. A boss must not require stopping, reversing direction, aiming or pressing a new button.

The boss is a **chase**, not a stationary battle. The player runs toward a fleeing, larger creature while the scenery continues scrolling. It must remain possible to understand the fight at 1× and with touch controls.

## Proposed decision summary (for Cat)
1. **Small RAWR:** keep its normal-game behaviour cosmetic, but during the boss encounter it **briefly reveals** the cloaked Phantom Raptor. No stun, no score penalty. Keep the existing 1.5 s cooldown.
2. **Big RAWR:** retain its current normal-game defensive effect for this prototype (nearby pterodactyls flee, chaseables panic), but during the boss encounter it **reveals and stuns** the Phantom Raptor. Keep the existing 5 s cooldown. After playtesting, decide whether normal chaseables should panic only in a 160 px radius rather than globally; this is a separate balancing decision for Claude.
3. **NOM remains automatic on contact.** A stunned boss drifts back into the player's reachable contact zone; only contact during a stun counts.
4. **Proposed boss placement:** **end of Desert (L3)**, before Swamp. This creates a memorable midpoint challenge without putting a mandatory fight immediately before endless Caverns. Prototype via `?boss` first; final placement needs Cat's approval.
5. Prototype **one successful hit**, not three. Expand to three distinct cycles only if it is genuinely fun and fair.

## Original character direction
**Phantom Raptor:** a large, original, mischievous blue-violet predator with turquoise markings, a long tail, expressive yellow eyes and a subtle camouflage shimmer. This is an original design, not a Jurassic World creature or replica. It should feel intimidating relative to T-Rex but still playful. Final sprite dimensions and pivots are **TBD with Claude** after the placeholder prototype; don't create or register a final boss sprite yet.

## Single-cycle encounter — placeholder specification
All timings below are **starting targets**, not hard-coded art assumptions. Claude should tune to actual speed and collision geometry at 60 Hz.

| Phase | Boss behaviour | Player-facing cue | Player action / outcome |
|---|---|---|---|
| Enter (about 1.0–1.5 s) | Runs in from right, settles **120–150 px ahead** of T-Rex; normal spawns pause; scenery scrolls | Unique silhouette, brief camera shake or dust, distinct musical sting | Keep running; no surprise damage during entrance |
| Telegraph (at least **0.75 s**) | Looks back, raises tail/foot, prepares **one** ground obstacle | High-contrast exclamation/dust burst near launch point; sound cue | Prepare to jump |
| Attack | Releases one normal-collision obstacle that travels toward player as scenery scrolls | Visible projectile/obstacle path, no hidden spawn | Jump/double jump as usual |
| Cloak | After attack, fades to faint silhouette while still moving ahead | Repeating footprints, eye glint and faint shimmer **always remain visible** | Small RAWR can reveal briefly |
| Reveal | Small RAWR while cloaked and in range (~**180 px** target) | Full silhouette for ~**1.2 s**, then cloak may return | Helps locate boss; does **not** stun |
| Stun | Big RAWR in range (~**180 px** target) | Loud roar, visible flash/starburst, boss stagger, clear vulnerable palette | Boss becomes contact-edible for ~**1.5 s** |
| Contact NOM | Stunned boss slows/drifts toward T-Rex until existing contact rules can detect overlap | Familiar chomp FX + boss reaction | Exactly one registered hit, no extra NOM input |
| Miss / retry | If stun expires without contact, boss regains lead and repeats | Recovery pose + clear separation before next telegraph | No instant punishment for missing a window |
| Win | First valid contact NOM completes prototype | Celebration, score once, resume normal spawning/level progression | Keep running into the world |

**Important collision constraint:** Normal boss contact must not accidentally score a hit. Only contact while explicitly stunned is a NOM; a non-stunned collision must be handled as a fair, telegraphed hazard or avoided entirely by boss positioning. Claude owns the hitbox implementation.

## Fairness and accessibility
- Keep the world scrolling, but suspend **random** obstacles and prey during the boss prototype. Only the boss's scripted obstacle appears.
- Don't launch an obstacle until the player has a reaction window **measured in travel time to T-Rex**, not merely a fixed animation delay. Test at maximum intended speed, including 120 Hz devices after M1 fixes.
- No invisible attacks: footprints, shimmer/eyes and the attack warning remain visible while cloaked. Avoid relying on sound or colour alone.
- No unavoidable attacks during entrance, stun, NOM, recovery or victory.
- Don't force big RAWR while its cooldown is unavailable: boss should delay vulnerability/attack loops or show cooldown clearly.
- For touch, a **tap** is small RAWR and a **hold** is big RAWR. Make the >350 ms distinction obvious in the eventual title/tutorial.
- If the boss is temporarily beyond RAWR range, indicate that through position/cue rather than silently consuming a cooldown (engine behaviour to confirm).
- Keep feedback legible at native **480×200** without full-screen flash or prolonged shake. Reduced-motion option can replace shake with a static burst.
- A failed NOM window should be recoverable. The prototype should not make the player lose simply for missing a roar.

## Gameplay effect outside the boss
Small RAWR stays expressive/cosmetic during ordinary levels. Big RAWR stays a **defensive trade-off**: scares dangerous swooping pterodactyls but also sacrifices possible catches and makes chaseables flee. This avoids unexpectedly rebalance every world while testing the boss. **Post-prototype question for Cat:** Should big RAWR panic only nearby chaseables, rather than all chaseables? Evaluate after watching playtests.

## RAWR art and FX brief (M4, after prototype)
- Existing T-Rex atlas: **64×64** cells, pivot **[35,56]**. Existing `rawr` row 8 starts at **y=512**, **four frames at 10 fps**. Keep frame count, JSON animation key, pivot and all other rows unchanged unless Claude requests a contract change.
- Four readable poses: **anticipation** (small squash), **head toss** (+1–2 px upper body), **maximum open jaw** (strong dark mouth and visible tongue), **recover** (jaw settles). Feet stay at **row 55** in grounded poses; any sparkle stays within cell edges.
- **Small RAWR:** playful small sound-wave/dust burst, restrained bubble. **Big RAWR:** stronger concentric pixel sound-wave arcs, a brief 1–2 px burst and visibly bigger speech bubble; avoid occluding hazards. Both may use the same `rawr` character row with different engine FX.
- **Boss reveal:** faint pixel-outline shimmer around the cloaked boss; on small RAWR, silhouette becomes opaque temporarily.
- **Boss stun:** distinct star/dizzy loop, brighter but not screen-filling effect, readable contact window. No new art until M3 mechanics prove fun.
- Deliver any new effect as PNG+JSON on an `art/` branch with preview and handoff; Claude registers ids and integrates.

## Claude implementation notes (non-binding)
- Implement boss state independently of ordinary spawns; hooks equivalent to update/draw/onRawr/checkContact.
- Boss activation via `?boss` flag initially. Normal spawn and level timers must handle `bossActive` explicitly.
- On RAWR, distinguish small vs big and ensure one cooldown/action can't count twice.
- Use sprite transparency for cloak (engine already supports alpha). Keep footprint tell separately visible.
- Debug overlay should display boss state, range, stun time, and hit count.
- Avoid duplicate score and collision events. Use the existing death/level transition state machine carefully.

## Acceptance checks for Cat and Claude
1. Runs at native 480×200 and 3× with legible telegraph and visible cloak tell.
2. Works with keyboard and touch, with **no NOM button**.
3. One scripted attack can be jumped consistently at all supported speeds.
4. Small RAWR reveals but doesn't stun; big RAWR reveals and stuns; both honour cooldowns.
5. Contact outside stun doesn't score; contact inside stun scores **once**.
6. Missing the contact window leads to a recoverable repeat.
7. No background spawns, level-transition races or hidden hazards during the boss.
8. Win returns to continuous scrolling; game remains playable without `?boss`.

## Decisions awaiting Cat's approval
- [ ] End of **Desert** as the first boss location.
- [ ] Small RAWR reveals; big RAWR stuns; keep existing normal-game RAWR effects for now.
- [ ] Automatic contact NOM, no new input.
- [ ] One-hit prototype, then consider three-hit full encounter.
- [ ] Original blue-violet Phantom Raptor visual direction.

**Do not start the final boss art or merge gameplay changes until Cat approves these decisions and has playtested the placeholder cycle.**
