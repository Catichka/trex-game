# SkiFree-inspired level feel — T-Rex Run
Status: implementation proposal for Claude review. Target viewport: 480×200.

## Design north star
Borrow SkiFree's **playful, apparently improvised obstacle field**, readable near-misses, incidental jokes, unexpected critters and one memorable pursuit. Do **not** borrow its free-direction movement or random unfair deaths. T-Rex remains a side-scrolling runner with JUMP, BITE and hold-to-RAWR; the current worlds, controls, art direction, music, scoring and eat follow-through stay intact.

## Screen-space rules
Use pixels measured at native 480×200, converted to world units using the current camera scale. Define `v` as current horizontal scroll speed in pixels/second; spawn spacing by **reaction time** rather than arbitrary frames. Required advance warning: >=0.75s for single ground obstacles (distance >=0.75v), >=1.1s for compound decisions (>=1.1v); use 1.35s for first appearance of a new hazard. If 480px viewport cannot fit the warning at current speed, cap speed or suppress that pattern. Keep a minimum 28px visible silhouette gap between adjacent independent hazards, and at least 48px clear landing space after a forced jump (increase if actual jump physics requires it). Validate against actual jump arc and hitboxes; never rely on visual gaps alone.

Create a **safe lane** through every combination: ground obstacle + aerial target must be avoidable without BITE; eating is a bonus, not mandatory. No blind landing trap; no airborne target directly overlapping a compulsory landing point. Spawn choices should be seeded for reproducible QA.

## Composition / rhythm
Build authored-feeling chunks of 3–6 seconds, selected from a small shuffled library per world: (a) calm landscape, (b) one readable hazard, (c) two-part rhythm, (d) optional reward/critters, (e) gag or surprise. Mix 2 calm chunks per 3 challenge chunks, and reserve 1 full 2-second breather after each set piece. Never put more than 2 high-attention decisions within any 1.5-second interval. Offset background props independently so chunks do not look tiled.

## World pattern library
World names should map to existing level definitions; these are biome archetypes, not instructions to rename worlds.

| Biome | Common pattern | Spacing / constraints | Surprise |
|---|---|---|---|
| Grasslands / early world | lone stump → empty patch → low rock; occasional pterodactyl overhead | 0.9–1.4s between hazards; at most 2 obstacles per 4s; first aerial enemy isolated | harmless butterfly swarm or tiny dino crossing behind T-Rex |
| Forest / dense greenery | alternating log and shrub; low branch as silhouette, not collision unless taught | 0.8–1.2s; never branch + log at same x on first encounter | squirrel-like critter steals a berry and darts away |
| Desert / dry world | cactus, then gap, then two offset stones | 0.9–1.3s; paired stones only after a 1.2s telegraph | tumbleweed rolls past, mostly harmless; rare moving one signalled clearly |
| Rocky / volcanic world | rock pair, open runway, single falling pebble warning | 1.0–1.5s; falling hazards require >=1.35s telegraph; max one falling object active near player | distant eruption with no hitbox, followed later by clearly marked falling rock |
| Snow / ice world (if present) | snow mound, long clear glide, low icy bump | 1.0–1.6s; slippery movement only if already part of mechanics | penguin-like spectator slips and recovers |

If a biome does not exist, **do not create it solely for this proposal**. Apply the matching pattern to actual existing worlds after checking their definitions.

## Set pieces (one per 45–75 seconds, not back-to-back)
1. **The picnic:** harmless caveman group and dropped food in the background; one foreground edible caveman only if BITE is taught, with clear approach and safe pass-by.
2. **The near miss:** pterodactyl swoops in at a safe height, narrowly misses a rock, and exits. Optional BITE timing; no forced double input.
3. **The chase:** after a visual/audio cue and 2s clear lead-in, a large comic predator enters from behind for 8–12s. Camera and obstacle frequency stay readable; no unavoidable acceleration. Escape by surviving, not by requiring a specific attack. One-time introduction, rare later reprises.
4. **The punchline:** predator trips over a tiny stump or gets distracted by a snack, then exits; reward with 2s obstacle-free runway. Avoid borrowing SkiFree's yeti artwork/identity.

## Critters and collision semantics
Add decorative critters as non-colliding scenery first. For edible enemies (pterodactyls, dinos, cavemen), collision alone **never** eats them. A valid BITE press must overlap the bite hitbox during the ~0.23s active window; successful contact triggers existing longer eat/caught animation. Failed bite has a short recovery and cannot auto-trigger a delayed eat. RAWR is hold-to-charge; charged roar may have a larger presentation but must not silently substitute for BITE unless separately specified. Provide a short tutorial moment: approach stationary food/enemy, on-screen BITE cue, optional safe retry.

## Difficulty progression
First 20s of a world: teach each new obstacle individually. Next 20s: combine familiar pairs. After 40s: introduce rare moving surprises. Density may rise by shortening empty chunks, but preserve warning windows and landing safety. Cap concurrent moving hazards at 1 in early worlds and 2 in later worlds. Target 80% familiar, 15% remixed, 5% surprise chunks, using seeded selection.

## Acceptance / QA
- At 480×200 all silhouettes remain distinct on the actual button-overlaid mobile viewport; hazards never hide under thumb controls.
- Automated seeded 2-minute runs at min/max scroll speeds: no impossible combinations using measured jump arc, BITE reach and collision geometry.
- Human playtest: first-time player recognizes each new hazard before it becomes lethal; BITE and RAWR remain optional for avoiding scenery.
- No enemy is consumed by passive collision; successful BITE plays existing eat follow-through.
- Chase cues, duration and exit are deterministic and can be disabled for accessibility.
- Humour remains quick and visual; no cutscenes that interrupt running.

## Implementation order
1. Inventory actual worlds, obstacles, speed and jump physics; translate archetypes to real names.
2. Build seeded chunk scheduler with timing-based spacing validator.
3. Ship grasslands 5-chunk library + 1 decorative gag.
4. Add one chase set piece behind a feature flag.
5. Extend per-world libraries and telemetry (avoidable-hit rate, bite success, deaths per chunk).
