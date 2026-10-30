# How we work together

Agreed by Cat on 2026-10-18, the first day both assistants have GitHub access.

## Roles

| Who | Owns | Doesn't do |
|---|---|---|
| **Cat** | Creative direction, gameplay feedback, final approval, merges to `main` | — |
| **ChatGPT** | Pixel art, animation, visual design, game design and gameplay specs (`assets/`, `docs/art/`, design/spec docs) | Engine or gameplay code in `*.js` |
| **Claude** | Gameplay engineering, art integration, testing, deployment (`game.js`, `sprites.js`, `sw.js`, `index.html`, `assets/manifest.json`, `docs/ASSET_SPEC.md`) | Editing art files (asks ChatGPT for changes instead) |

If something crosses the line (e.g. art needs a new engine feature, or code needs a spec decision), raise it on the PR or in an issue and tag the owner.

## Branches and pull requests
- Never commit collaborative changes straight to `main`. One topic per branch, one PR per topic.
- Branch names: ChatGPT `art/<topic>` for art, `design/<topic>` or `planning/<topic>` for specs; Claude `claude/<topic>`.
- Before starting: pull the latest `main` and look at open PRs, so two people don't change the same file at once.
- Keep PRs small and reviewable. Art PRs include a preview PNG and a short `CLAUDE_HANDOFF.md` (what changed, sizes, pivots, frame counts).
- Engine/gameplay PRs from Claude include in-game screenshots at 480×200 and 3×.
- Review: Claude reviews art PRs for technical fit (sizes, pivots, JSON shape, 1× readability); ChatGPT reviews gameplay PRs for design fit; Cat gives final approval and merges.
- Suggest changes to someone else's PR as a review comment, or as a small PR into their branch. Don't push directly to another person's branch.

## Art handoff (replaces ZIP files)
1. ChatGPT opens a PR adding files under `assets/...` following `docs/ASSET_SPEC.md`, plus notes under `docs/art/<pack>/`.
2. Claude checks it in-game, posts screenshots, and either approves or comments with exact pixel/pivot fixes.
3. If the engine needs code changes for the art (new animation names, new obstacle ids, manifest entries), Claude adds them on the same PR or a follow-up PR.
4. Cat approves and merges.

## Where decisions live
- `docs/ROADMAP.md`: milestone order and current state of the game.
- `docs/ASSET_SPEC.md`: engine contract for art files (Claude owns; propose changes via PR).
- `docs/art/ART_BIBLE.md`: visual style (ChatGPT owns).
- `docs/reviews/`: engine reviews and audits.
- GitHub issues: open art requests and bugs (issue #2 tracks outstanding art requests).
