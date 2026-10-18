# Hall of Fame — world-themed visual redesign

## Creative direction
Replace the plain leaderboard presentation with a dramatic, readable, 16-bit pixel-art prehistoric monument. This is an **implementation brief**, not a finished UI implementation. The concept image shared in ChatGPT is a visual reference only: **do not use the mockup as a flat background** because its names, scores and buttons are baked into the illustration.

## Non-negotiables
- Preserve existing live top-ten ranking data, names, scores, all-device scope, score submission, replay input and BITE/RAWR/JUMP controls. Never hard-code example scores or names from the concept.
- Maintain legibility on landscape phones, including small viewports and safe-area insets. Avoid overlaps between leaderboard, score badge, replay instruction and controls.
- Keep ranking order, tie handling and accessibility intact.
- Respect reduced-motion settings; keep animation subtle and performant.

## Layout
- Main feature: centered stone leaderboard with carved dark rows and warm highlights, headed **HALL OF FAME** and **TOP 10 ALL DEVICES**.
- First three ranks: gold, silver and bronze fossil medals. Other rows: compact numeric ranks. Highlight the current player's entry only if identifiable from the existing data.
- Separate left-side **YOUR SCORE** medallion, accompanied by a celebratory T-Rex sprite. Do not let the medallion cover rankings on narrow screens; collapse into a compact top/bottom band as needed.
- Replay call-to-action: **TAP TO PLAY AGAIN**, legible and not competing with touch controls.
- Reuse current BITE, RAWR and JUMP button handlers and hit targets. Decorative stone frames may be applied without shifting the functional touch regions.

## World-aware theme
Use the **last played world** already tracked by the game; do not infer it from score values. Keep the stone monument and row geometry consistent while swapping decoration, background, accent palette and ambient effects.
- Grasslands: mossy stone, ferns, flowers, sunny sky, butterflies.
- Volcano: dark basalt, lava seams, embers, distant eruption.
- Desert: sandstone, fossils, dunes, warm amber light.
- Swamp: weathered stone, vines, mist, fireflies.
- Caverns: crystalline accents, stalactites, blue-purple glows.
If the last world is unavailable, use the current neutral/grasslands theme.

## Art and rendering
- Pixel-aligned geometry and crisp edges; disable image smoothing on pixel art.
- Use a layered background with clear dark contrast behind text; never bake leaderboard text into images.
- T-Rex cheering can be a small looping animation, with a static fallback.
- Do not require a huge full-screen bitmap; prefer reusable sprites, tile motifs, gradients and lightweight particles.
- The illustrated mockup is aspirational, not a precise layout specification; adapt for actual screen size and safe areas.

## Acceptance checks for Claude
1. Top ten scores render dynamically with existing data and preserve names, leading zeroes and ordering.
2. Current run's score displays correctly even when not in the top ten.
3. Replay, BITE, RAWR and JUMP controls remain functional, with touch targets unobstructed.
4. No clipped rows, overlapping labels or illegible text on landscape phones.
5. World theme reflects last played world, with graceful fallback.
6. Pixel art stays sharp at different device pixel ratios.
7. Performance is comparable to the existing end-of-run screen.

## Handoff
Claude: locate the existing Hall of Fame rendering code and implement this design incrementally, reusing current game state and score services. Request actual sprite assets separately if necessary; this PR deliberately contains a design/acceptance brief rather than pretending to ship the rendered mockup as production UI.
