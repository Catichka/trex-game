# Grasslands theme — Cat-approved V4 (18 October 2026)

Cat listened to iterations V1–V4 and explicitly approved **V4 Earworm**: "loving this one. great for grsaslands!"

**Do not implement the older V1 melody in SOUNDTRACK_V1.md as final.** It was superseded by V4. The approved sound is a hook-forward, 144 BPM, G-major, eight-bar arcade jingle, with repeated opening motif and strong cadence. V4 demo file was generated in the ChatGPT conversation as `trex_grasslands_v4_earworm.wav` (not yet uploaded to this repo).

## Canonical V4 lead melody

Eighth-note grid; tuples are `(position within bar, duration in eighths, MIDI note)`; 8 bars, 144 BPM, G major. C4=60.

```js
const GRASSLANDS_V4_MELODY = [
 [[0,1,67],[1,1,67],[2,1,71],[3,1,74],[4,2,71],[6,2,69]],
 [[0,1,67],[1,1,67],[2,1,71],[3,1,74],[4,2,76],[6,2,74]],
 [[0,1,76],[1,1,76],[2,1,74],[3,1,71],[4,2,69],[6,2,67]],
 [[0,1,69],[1,1,71],[2,2,69],[4,4,67]],
 [[0,1,67],[1,1,67],[2,1,71],[3,1,74],[4,2,71],[6,2,69]],
 [[0,1,67],[1,1,67],[2,1,71],[3,1,74],[4,2,79],[6,2,78]],
 [[0,1,76],[1,1,76],[2,1,74],[3,1,71],[4,2,72],[6,2,69]],
 [[0,1,71],[1,1,69],[2,2,67],[4,4,67]]
];
```

Bass root MIDI notes by bar: `[43,38,40,36,43,38,36,43]`; quarter-note pulse on eighth positions 0,2,4,6, alternate root and fifth. Soft chord stabs on eighth positions 3 and 7. Kick on 0 and 4, snare on 2 and 6, gentle hi-hat on even eighths. Rounded lead sine-based synth (68% fundamental, 25% second harmonic, 7% third); soft bass and subtle percussion; **no scratchy distortion**. Melody has priority over embellishment.

## Handoff

Claude: use THIS melody rather than V1 when implementing the opt-in `?music=v2` prototype. Preserve the motif, tempo, phrase rhythm and cadence. Keep music bus below gameplay SFX, ensure sample-accurate loop scheduling, and make it possible for Cat to A/B against the demo. Do not merge to main without Cat's approval. Other world themes should follow this hook-first approach.
