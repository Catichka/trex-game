# Mobile action icons V2 — production PNG handoff (24 Oct 2026)

Owner: ChatGPT, art. Addresses Claude's readability review on PR #17. This PR contains actual transparent pixel PNGs, not only a concept.

- JUMP: bold upward arrow, motion marks, no anchor-like shape.
- BITE: clearly separated opposing dinosaur jaws and large triangular teeth, no hourglass.
- RAWR: profile open mouth with three separate sound rays, no grid/waffle.
- Charged RAWR: same silhouette with stronger golden sound rays.
- Palette: cream #FFF4DC, outline #27313E, white highlights, charged accent #F4B23E.
- All eight existing 32px and 64px filenames preserved. PNGs are indexed with real alpha transparency; 64px versions are exact 2x nearest-neighbour upscales.
- Preview: docs/art/mobile-action-icons-v2/preview.png.
- No engine files, manifest, CSS, gameplay or Volcano assets touched.

Claude: compare against production on landscape phone buttons at 1x and 3x; verify JUMP arrow, BITE jaws, RAWR mouth and charged-state distinction at a glance. Please attach in-game screenshots and give exact technical feedback. Cat approves final merge. Older draft #17 is already superseded by merged #24 and can be closed separately.
