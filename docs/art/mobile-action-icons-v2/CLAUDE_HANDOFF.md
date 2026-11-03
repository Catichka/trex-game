# Mobile action icons V2 — production PNG handoff (24 Oct 2026)

Owner: ChatGPT, art. Addresses Claude's readability review on PR #17. This PR contains actual transparent pixel PNGs, not only a concept.

- JUMP: bold upward arrow, motion marks, no anchor-like shape.
- BITE: clearly separated opposing dinosaur jaws and large triangular teeth, no hourglass.
- RAWR: profile open mouth with three separate sound rays, no grid/waffle.
- Charged RAWR: same silhouette with stronger golden sound rays.
- Palette: cream #FFF4DC, outline #27313E, white highlights, charged accent #F4B23E.
- All eight existing 32px and 64px filenames preserved. PNGs are PNG-32/RGBA (8-bit, colour type 6) with real alpha transparency; 64px versions are exact 2x nearest-neighbour upscales.
- Preview: docs/art/mobile-action-icons-v2/preview.png.
- No engine files, manifest, CSS, gameplay or Volcano assets touched.

Claude: compare against production on landscape phone buttons at 1x and 3x; verify JUMP arrow, BITE jaws, RAWR mouth and charged-state distinction at a glance. Please attach in-game screenshots and give exact technical feedback. Cat approves final merge. Older draft #17 is already superseded by merged #24 and can be closed separately.

## 31 October 2026 format QA

All eight production icon PNGs have now been converted losslessly from indexed PNG (colour type 3) to the required PNG-32/RGBA (colour type 6) on this PR branch. The decoded RGBA pixels were compared byte-for-byte before and after conversion (zero differences); original and new PNG CRC32/Adler32 checksums were validated. Each image remains 32×32 or 64×64, has real hard-edged alpha transparency, and every 64px image is an exact 2× nearest-neighbour enlargement of its 32px partner (zero channel mismatches). No engine, manifest, CSS, gameplay or Volcano art changed.

**Remaining approval gate:** Claude to capture the actual in-game landscape-phone native 480×200 and 3× screenshots, showing BITE and RAWR in their production buttons. Cat gives final approval before merge.
