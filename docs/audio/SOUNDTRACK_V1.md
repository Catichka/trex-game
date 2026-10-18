# Soundtrack V1 — Hybrid retro/indie direction (Cat selected C)
Owner: ChatGPT (music composition / audio direction). Claude owns code integration.

## Diagnosis from current `game.js` on main
Current `SONGS` arrays contain a single melody note at a time; the optional third element labelled `optionalHarmonyFreq` is **never played** by `musicTick()`. All five worlds therefore play as thin monophonic triangle tones. `setTimeout()` schedules the *next* note on the JS main thread, not the Web Audio clock; rendering and browser scheduling can make rhythms uneven. `chipNote()` plays directly into the destination with a relatively high 0.11 sustain and no music bus or ducking, so effects compete with music. No drum or bass parts are sequenced. These are architectural causes of the 'janky' sound; merely changing the notes won't fix them.

## Creative brief
**C: Mega Drive / classic arcade melodic hooks with modern indie-game harmonic richness.** Not copies of existing soundtrack melodies. Warm pulse/triangle bass, square/pulse lead, soft filtered pad/arpeggio, snappy noise percussion, controlled dynamics. Distinct 8-bar seamless loops; motifs may recur across worlds. Prioritize a tune you can hum and a groove that remains enjoyable over repeated attempts.

| World | Tempo | Key/mode | Character |
|---|---:|---|---|
| Grasslands | 132 BPM | G major | sunny syncopated adventure hook, octave bass, playful percussion |
| Volcano | 148 BPM | E minor | syncopated bass, driving tom/kick, crunchy minor melody |
| Desert | 116 BPM | A Dorian | spacious plucked lead, galloping low pulse, unusual percussion |
| Swamp | 108 BPM | D minor/Dorian | cheeky offbeat bass, wobbly reed-like lead, swampy muted drums |
| Caverns | 154 BPM | C minor | crystalline arpeggios, pulsing bass, anxious but melodic endless loop |
| Phantom Raptor | 160 BPM | F# minor | angular chase motif, halftime feint, rapid bass ostinato |

## Grasslands prototype: 'Little Legs, Big Adventure'
Time: 4/4; **132 BPM**; 8 bars (approximately 14.55 s). Grid: 16 eighth notes per 2 bars. All pitches MIDI integers, C4=60. Steps are eighth-note indices 0–63, duration in eighths. The data below is **original composition**, not derived from existing game themes.

Harmony: | G | D/F# | Em | C | G | D | C D | G |
Lead (start,duration,MIDI note):
```
(0,1,74) (1,1,79) (2,2,81) (4,1,79) (5,1,76) (6,2,74)
(8,1,72) (9,1,74) (10,2,78) (12,1,76) (13,1,74) (14,2,69)
(16,1,71) (17,1,74) (18,2,76) (20,1,79) (21,1,76) (22,2,74)
(24,2,72) (26,1,76) (27,1,79) (28,2,76) (30,2,72)
(32,1,74) (33,1,79) (34,2,81) (36,1,83) (37,1,81) (38,2,79)
(40,1,78) (41,1,81) (42,2,79) (44,1,76) (45,1,74) (46,2,69)
(48,1,76) (49,1,79) (50,2,76) (52,1,74) (53,1,76) (54,2,78)
(56,1,79) (57,1,74) (58,2,71) (60,2,74) (62,2,79)
```
Bass root per bar: G2=43, F#2=42, E2=40, C2=36, G2=43, D2=38, C2=36 / D2=38 (half bar each), G2=43.
Suggested bass pattern each bar: root on steps 0 (2 eighths), 3 (1), 4 (2), 7 (1); fifth at steps 2 and 6 (1 each). Kick at eighth steps 0 and 4; snare at 2 and 6; closed hat every eighth with alternating velocity. Add a light chord stab on offbeats 3 and 7. These rhythms are a production starting point, not a requirement.

## Audio engine integration contract (proposal, Claude to implement)
1. Prefer Web Audio `AudioContext.currentTime` look-ahead scheduler (schedule 100–150 ms ahead, timer wakes ~25 ms). **Never use setTimeout as the musical clock.**
2. Four independent voices: lead (pulse or rounded square), bass (filtered triangle/saw), harmony (soft triangle pad or short stabs), percussion (filtered noise + tonal kick). Limit polyphony and use gain envelopes.
3. Master/music/SFX gain buses, headroom and a gentle limiter/compressor. Default music quieter than SFX; music should not mask RAWR or obstacle warning. Duck music briefly for big RAWR/boss telegraph.
4. Schedule by **absolute beat positions** and use exact loop length; never let rests or suspended tabs drift the sequence.
5. Start audio only after user gesture; stop and release oscillators on death/transition; handle visibility pause/resume and repeated `startMusic()` without overlapping loops.
6. Implement first for **Grasslands only** behind `?music=v2` or another reversible opt-in flag. Keep old music as fallback until Cat listens. Avoid touching unrelated gameplay logic.
7. Once approved, extend to all five worlds and boss; crossfade at transitions and test on mobile Safari.
8. Add a **mute/music volume control** before release; honor user preference across sessions.

## Acceptance
- Cat can listen to Grasslands V2 in the browser before replacing any soundtrack.
- No audible rhythmic hitch at loop boundary, at 60/120 Hz or during heavy spawns.
- Music remains pleasant after 10 minutes and SFX (especially RAWR and telegraph) are always intelligible.
- No surprise autoplay; no multiple tracks playing after restart, death, or tab return.
- Original melodies and arrangements; no imitation of copyrighted game themes.

## Handoff
This document is composition and audio direction, not an engine edit. Claude: please implement a *small* opt-in music prototype PR with the Grasslands melody/bass/drum groove and send Cat a play link. I can iterate the composition from listening feedback.
