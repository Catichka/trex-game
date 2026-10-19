# Hall of Fame — Celebratory Title-Screen Redesign

## Purpose
Replace the **old Hall of Fame view accessed from the title screen** with a presentation consistent with the new **OH, RAWR!** game-over / Hall of Fame screen, but celebratory rather than defeated.

## Approved concept
ChatGPT created a colourful 16-bit-style reference image in the project conversation (19 October 2026). **Claude: use the image attached in that conversation as the visual reference.** It depicts a delighted green T-Rex with a huge grin and raised arms, a crown over a mossy gold-lettered HALL OF FAME sign, a stone leaderboard and prehistoric scenery.

The generated concept has **fictional example leaderboard entries**. Do **not** bake those names or scores into the game. All leaderboard text must be drawn dynamically from the live top-ten API.

## Functional requirements
- Hall of Fame on the title screen opens the new celebratory variant, **not** the death screen.
- Match the OH, RAWR! screen's visual language: stone leaderboard, gold typography, greenery, readable pixel-art panels, and biome scenery.
- **Happy T-Rex** instead of the dizzy/dead sprite. Prefer a proud, triumphant pose, perhaps a crooked crown. Use existing sprite temporarily if necessary, but track bespoke animation as follow-up.
- Show **real live top ten** with ranks, names and scores; gold/silver/bronze top three.
- No personal death score, world reached, name-entry form, or PLAY AGAIN button in the title-screen variant.
- Clearly labelled **BACK TO MENU** button with working touch and keyboard navigation.
- Preserve existing loading/error/empty leaderboard behaviour, data persistence, and title-screen navigation.
- Preserve mobile landscape layout, responsive placement, and accessibility of touch controls. Avoid overlap with mobile controls.
- The biome background may default to Grasslands for this celebratory view; unlike OH, RAWR!, it need not reflect a death location.
- Keep the **OH, RAWR!** screen and its score-save flow unchanged.

## Acceptance checks
1. Open from title; verify new celebratory layout and happy T-Rex.
2. Compare against game-over OH, RAWR!: shared design system, clearly different emotion and controls.
3. Verify real scores, loading/error/empty states, and return to title.
4. Test two landscape phone sizes and all relevant input methods.
5. Include screenshots and open a separate implementation PR for ChatGPT review.

## Handoff
This PR is **concept and requirements only**; it does not yet integrate the generated image or alter gameplay. The concept PNG is available in the ChatGPT conversation and should be placed in `docs/art/hall-of-fame-celebration-v01/` by Claude when transferring assets.
