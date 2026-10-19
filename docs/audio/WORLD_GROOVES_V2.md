# Distinct world grooves & Phantom Raptor audio — composition handoff v1
**Owner:** ChatGPT (composition and sound direction). **Integration:** Claude. **Status:** DESIGN PROPOSAL; **not approved** by Cat. **Date:** 2026-10-20.

## Why this exists
Claude's [review on PR #9](https://github.com/Catichka/trex-game/pull/9#issuecomment-6245371732) confirmed that the first four-voice engine in [PR #10](https://github.com/Catichka/trex-game/pull/10) uses the **same Grasslands bass/drum/stab groove** for all worlds. That's a sensible first implementation, but it makes the different biomes sound less distinctive than their artwork. This spec gives Claude concrete per-world arrangements to prototype **without rewriting the melodies**.

**Protect the approved choices:**
- **Grasslands V4** remains Cat's approved, catchy original scored tune. Preserve its note sequence and its baseline groove.
- [PR #31](https://github.com/Catichka/trex-game/pull/31) subsequently made the **Folk Dance in D recording the default Grasslands music**, and the **Baroque recording the default Caverns music**. Those recordings and the music toggle/A-B comparison are approved alpha-test behavior. **Do not replace or re-render either recording based on this spec.** Changes below affect *scored-mode arrangements only*, where the Web Audio sequencer plays the draft scores.
- Volcano **visual/gameplay level is locked** by Cat; audio ideas here do not authorize visual or gameplay edits.
- Phantom Raptor music remains draft until Cat listens.

## Musical goal
The same hook-first, hum-it-after-two-listens approach that made Grasslands V4 work, but each world gets its own **rhythmic fingerprint**. Use warm, rounded leads; keep the melody in front. The drums should feel playful and supportive, not loud or scratchy.

## Timing and notation
Each bar is **4/4, eight eighth-note steps 0–7**. Event arrays below contain **step indices**, not MIDI pitches. Bar variants alternate A/B every bar unless specified. Kick/snare/hat values are hits at those eighth steps. Bass events are `[step, offsetFromRootInSemitones, durationInEighths]`; `+7` is the fifth. Chord stabs are positions in eighth steps. Empty arrays mean silence for that voice. Use absolute audio-clock scheduling as already implemented in `audio.js`.

| Track | BPM | Feel | Bass events per bar | Kick | Snare | Hat | Stabs |
|---|---:|---|---|---|---|---|---|
| **Grasslands** | 144 | **unchanged** cheerful 16-bit march | `[[0,0,1.6],[2,7,1.6],[4,0,1.6],[6,7,1.6]]` | `[0,4]` | `[2,6]` | `[0,2,4,6]` | `[3,7]` |
| **Volcano** | 156 | urgent double-pulse, racing over hot ground | `[[0,0,1.4],[2,0,0.9],[3,7,0.8],[4,0,1.4],[6,7,0.8],[7,0,0.8]]` | `[0,3,4,7]` | `[2,6]` | `[0,1,2,3,4,5,6,7]` quiet | `[3,7]` short |
| **Desert** | 124 | light gallop with space between phrases | `[[0,0,2.1],[3,7,0.7],[4,0,1.1],[6,7,1.5]]` | `[0,3,4]` | `[2,6]` soft rim | `[0,3,4,7]` | `[5]` only |
| **Swamp** | 112 | offbeat, cheeky funk / swamp shuffle | `[[0,0,1.1],[3,7,0.8],[5,0,0.8],[7,7,0.8]]` | `[0,5]` | `[2,6]` plus ghost at `5` every second bar | `[1,3,5,7]` | `[3,7]` muted |
| **Caverns** | 152 | sparkling momentum, increasingly urgent | `[[0,0,1.5],[2,7,1.5],[4,0,1.5],[6,7,1.5]]` | `[0,4]` | `[2,6]` | `[0,1,2,3,4,5,6,7]` quiet | `[3,7]` airy |
| **Phantom Raptor** | 168 | dangerous chase with **half-time snare** | `[[0,0,1.4],[1,0,0.7],[3,7,0.8],[4,0,1.4],[6,0,0.8],[7,7,0.8]]` | `[0,3,4,7]` | `[4]` (half-time; no `[2,6]`) | `[0,1,2,3,4,5,6,7]` quiet | `[3]` only |

These are **composition targets, not runtime code**. If exact event shapes are inconvenient, Claude can adapt to a stable schema, but please preserve timing and musical intent. Do not accidentally interpret a bass note duration as a step count to the next event; short bass notes should release cleanly.

## World-specific production notes
### Volcano — *Hot Feet!*
- Bass has repeated-root urgency; let kick pulse through without adding distortion.
- Short, slightly sharper lead articulation than Grasslands, but the same rounded waveform family. Keep obstacle warnings louder than music.
- No audio-triggered visual or gameplay changes.

### Desert — *Sand in My Shoes*
- Gallop should be **recognisable without sounding like a Western-film cliché**.
- Leave space around long melody notes; fewer hats and only one chord stab per bar.
- Use a plucked, soft lead with a brief decay; avoid bright noise-heavy percussion.

### Swamp — *Bog Hop Boogie*
- Offbeat hats and anticipatory bass should feel mischievous, not sluggish.
- A tiny 3:1 long-short articulation or gentle swing can be tried **only if melody, bass and percussion stay synchronised**. Do not apply swing to the whole scheduler or change song duration.
- Muted chord stabs and a little wobble are fine, but no pitch instability.

### Caverns — *Glowstone Gallop*
- Scored-mode only: quiet, bell-like arpeggio notes may trace each bar's triad on eighths `[0,2,4,6]`; keep them below the melody. The approved Baroque WAV remains untouched and default.
- Avoid the Caverns score becoming a wall of bright high frequencies after several minutes.

### Phantom Raptor — *Something Behind You!*
- The entry sting must **communicate danger**, not mask the first boss telegraph. Duck the music for the telegraph and big RAWR, with the boss's ground warning and footstep cues still audible.
- The scored melody reaches **MIDI 90 / F#6** in bar 6. Try **a one-octave-down variant for those two peak notes (MIDI 90→78 and 88→76)** in a listening A/B before deciding; avoid clipping or painfully bright tones. Do not silently replace the original draft without noting the change.
- When boss begins, fade world track and trigger a short warning sting before the boss groove. On defeat, stop boss loop, play a short victory flourish, then resume the **same world and same selected music mode** (recorded vs scored). Do not restart the wrong biome or switch the player's chosen soundtrack.
- Boss music must not be the only warning: gameplay tells must work muted.

## Suggested score data contract (for Claude to implement if useful)
Optional fields per theme; no need to change `game.js` or UI:
```js
arrangement: {
  bass: [[0,0,1.4],[2,7,1.0],[4,0,1.4],[6,7,1.0]],
  kick: [0,4],
  snare: [2,6],
  hat: [0,2,4,6],
  stabs: [3,7]
}
```
A theme without `arrangement` **must** use the current V4 default. A/B test at `music.html` before any replacement. Implementation and exact schema belong to Claude; this document does not modify `audio.js` or `docs/audio/theme_scores.js`.

## Test checklist for the next playable alpha
1. Grasslands V4 scored mode unchanged; recorded Folk Dance in D still default where selected.
2. Caverns Baroque recording unchanged; scored Caverns variation accessible for comparison.
3. Volcano, Desert, Swamp and Caverns scored themes now sound rhythmically different **without changing melody pitches**.
4. Boss entry/defeat transitions preserve music mode, no two tracks overlap, no first-attack warning drowned out.
5. 10-minute loop test and 60/120 Hz / phone tests show no timing drift, audible clipping or sudden volume spikes.
6. Cat listens to draft themes in the jukebox and approves individually before any final soundtrack lock.

## Handoff
Claude: please review this *design-only* PR, comment on the preferred optional arrangement schema, and implement on a separate `claude/` branch when useful. No need to interrupt Cat for an implementation choice; reserve creative approval for the next listening/playable build.
