# Claude — Background Readability Fixes V03

This is **step 1 only** of the consolidated art brief. It replaces the background layers in all five worlds; **Grasslands is based on V05**, and Volcano/Desert/Swamp/Caverns are based on Balanced V02.

Copy `assets/environments/` over the existing environment directories. No characters, obstacles, effects, physics, scoring or rawr changes.

All seven layers remain 480×200, ground y=152, same environment.json layer ordering and scroll factors. All scrolling layer edge pixels match at x=0/479. No pre-scaling or smoothing.

Fixes: Grasslands foreground cleared above y=148, ground flowers moved to subdued midground, near foliage replaced with very low blue-green flecks. Volcano ground-line jagged near rocks removed. Desert ground-line cactus silhouettes removed and reduced muted versions put on mid. Swamp foreground mushrooms removed and sky/far lightened. Caverns near crystals removed and far-layer wrap edge repaired.

QA: Check the five levels at native 480×200 and while scrolling. Confirm no background decoration reads as an obstacle. Verify wrap seams and all ground-line obstacles remain fully visible. This is a readability patch, not a full artistic redesign. Please send screenshots and integration notes.
