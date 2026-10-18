# Hall of Fame — animated torches and cheering effects (art handoff)

**Owner:** ChatGPT (art and motion design). **Integrator:** Claude. **Status:** source art delivered, rasterisation and integration pending.  
**Reference:** world-themed stone Hall of Fame merged via PR #39; existing score layout and the five world backdrops must stay intact.

## Source assets (included in this PR)
- `hall_torch_atlas.svg`: six 24×32 frames in a single horizontal 144×32 sprite strip. Real pixel-art flame with a bronze/stone wall sconce, gold core, warm orange outline and slight flicker. **Transparent** background, crisp integer geometry. The flame reads at 1×, unlike the previous tiny code-drawn fire.
- `hall_cheer_sparkles_atlas.svg`: six 24×24 frames in a 144×24 strip. Multicolour star and confetti burst for the cheering T-Rex, readable at 1×, designed to loop intermittently rather than constantly shower the screen.

Both SVGs are **editable art sources**, not browser runtime sprites. Rasterise each at exactly 1 SVG unit = 1 PNG pixel, with RGBA transparency and **no antialiasing**; place output PNGs at `assets/fx/hall_torch_atlas.png` and `assets/fx/hall_cheer_sparkles_atlas.png`. No manual tracing or artistic changes needed. If rasterisation creates blurred pixels, use nearest-neighbour or pixel-aligned SVG rasterisation.

## Proposed animation contract (Claude to integrate)
```json
{
  "torch": {"frameWidth":24,"frameHeight":32,"frames":6,"fps":8,"loop":true},
  "cheer": {"frameWidth":24,"frameHeight":24,"frames":6,"fps":12,"loop":false}
}
```
- Use a **dedicated Hall of Fame UI effect loader** or register these ids in the existing sprite system (Claude chooses). Do not overwrite the generic `fx-dust`, `fx-chomp` or `fx-catch` assets.
- Existing `game.js` already renders `boardDino=new Animator('celebrate')` via `drawArt('trex',...)`. **That is the real T-Rex sprite**: preserve it. This art pass adds small animated confetti around that existing cheering character, rather than replacing the approved dinosaur.
- Place torches symmetrically on the outer monument pillars, centred around x≈118 and x≈362, flame top around y≈74; ensure the entire 24×32 image stays **outside score text and buttons**. Existing code draws tiny torches at `tx=MON_X-12` and `tx=MON_X+MON_W+11`, `ty=79`. Replace only that visual primitive, preserving fallback if asset fails to load.
- Position confetti to either side of the existing T-Rex at x≈384, near its head/arms; do not cover the on-screen JUMP button or the top-10 rows.
- Reduced motion: freeze torches on frame 0, no confetti animation, no added flashing.
- If loading fails, preserve current code-drawn flames and the existing `celebrate` T-Rex.
- Do not change the score layout, input zones, last-world background, ranking logic, or gameplay engine.

## Acceptance
1. At native 480×200, each torch has a distinct readable flame, not a 2–3 pixel dot.
2. At 3× and landscape-phone size, no score text, crowns, controls or CTA is covered.
3. The existing T-Rex `celebrate` atlas plays without jitter; confetti is a small secondary effect.
4. Torch motion is subtle and independent of the board's score refresh; reduced motion is respected.
5. All five world backgrounds and colour treatments remain unchanged.

**Integration note for Claude:** This is intentionally a design/art-only PR. Convert the two source strips to PNG, wire them into the Hall of Fame using an engine-owned follow-up PR, and post native 480×200 + 3× screenshots for review. No merges to `main` without Cat's approval.
