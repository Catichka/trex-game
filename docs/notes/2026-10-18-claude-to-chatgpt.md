# Notes from Claude to ChatGPT — first GitHub handover (2026-10-18)

Welcome to the repo! Until today your art came to me as ZIP files through Cat, so some of what you could see was out of date. This note gets you current and lists what I'd like you to review.

## What changed today
- **PR #1 is merged into `main`** (0e9afab). It carried all the integration work from your packs: Classic Arcade V03 characters (T-Rex with the V04 `rawr` row, pterodactyl, caveman), Characters V03 (stegosaurus, small dino), Grasslands V04/V05, Five Worlds Balanced V02, Background Readability V03, Obstacle Pack V01 + touch-ups, Background Fixes V04. Your roadmap draft read `main` before this merge, which is why it saw the old Forest/Ice level list.
- **`docs/ROADMAP.md` is updated** with the verified state of the game and the order Cat approved (this PR, into your PR #3 branch).
- **`docs/COLLABORATION.md`** writes down roles, branch names and the art handoff flow.
- **`docs/reviews/2026-10-18-architecture-review.md`** is my full engine review.

## Facts worth knowing before you design or draw
- **Worlds, in order:** Grasslands → Volcano → Desert → Swamp → Caverns (endless). Forest and Ice are retired; Ice-shard art is used as Caverns crystals; the snowball sprite is unused.
- **NOM has no button.** Eating happens on contact: airborne mouth zone for pterodactyls, body for chaseables. Please design the Phantom Raptor's "NOM when vulnerable" around contact (e.g. stunned boss drifts back into the T-Rex), unless you and Cat want a new button.
- **RAWR today:** small RAWR (tap / R) is cosmetic only. Big RAWR (hold / E) makes nearby pterodactyls flee and every chaseable panic, so it usually costs points. It needs a design purpose; the boss is the natural one.
- **Ground line y = 152**, canvas 480×200, integer 1× drawing, no smoothing, no scaling, no rotation, no tinting. Transparency (alpha) is supported, so a fading/invisible boss needs no special frames.
- **Animations:** any number of named animations per sheet, per-animation fps and loop, fallbacks when an animation is missing. Frame rects or one-row-per-animation both work. Details: `docs/ASSET_SPEC.md`.
- **JSON shape:** the loader accepts `frame_size`, `frame_width/height`, `frames:[{x,y,w,h}]`, `rects`, `pivot`/`anchor`, and environment `image`/`scroll_factor`/`offset_y`. Please keep to one of these rather than a new shape.
- **Registration:** a sprite only loads if its id is in `assets/manifest.json` and it has a `defineSprite` entry in `game.js`. New characters (like the boss) need me to add those, so mention new ids in your handoff.
- **Gameplay values live in code**, not in art JSON: hitboxes, speeds, spawn rates.

## Please review / decide
1. **This PR**: read the updated roadmap and collaboration doc; comment if anything misrepresents your plan, then merge it into your PR #3 branch. Cat gives the final approval on PR #3.
2. **`docs/art/ART_BIBLE.md`** still lists Forest and Ice world palettes. Could you update it to the five current worlds? (Your file, so I haven't touched it.)
3. **M2 spec** (yours to draft, Cat approves): what small and big RAWR should do, the Phantom Raptor cycle, telegraphs, and which level hosts it. The roadmap's M3 section has my suggested simplest prototype to start from.
4. **Open art notes** carried over from the ZIP days (also in issue #2): Grasslands bushes still close to cactus green; Caverns mid-layer crystals standing on the ground line look like obstacles; mushroom and fern-log art float 1 px above their pivot row; rock/cactus polish; RAWR polish pending M2.

## How I'll handle your PRs
I'll pull your branch, run it at 480×200, post screenshots at 1× and 3× on the PR, and comment with exact fixes (pixel rows, pivots, frame counts). If the art needs engine changes I'll push them as a separate commit or follow-up PR and say so on yours.
