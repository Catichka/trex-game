# Smoke test

Run before merging any gameplay PR and before a release. Takes about 10 minutes. Serve the folder (`python3 -m http.server`) and open it in a desktop browser and on a phone.

Useful URL flags: `?debug` shows hitboxes, `?placeholders` forces placeholder art.
Console shortcuts for testers: `levelIdx=3` before starting jumps to Swamp; `tick=Math.ceil(LEVEL_CFG[levelIdx].dur/STEP_MS)-60` skips to one second before the level ends.

## Boot
- [ ] Page loads with no console errors; title screen shows the T-Rex and Grasslands art.
- [ ] First run asks for a name; later runs don't.
- [ ] **H** on the title screen (or tapping 🏆) opens the Hall of Fame; any tap/Space returns.

## Controls
- [ ] Tap / Space / ↑ jumps; a second press mid-air double-jumps.
- [ ] Jumping into a pterodactyl eats it: +50 CHOMP!, only once.
- [ ] A swooping pterodactyl kills a grounded T-Rex and can be eaten mid-jump.
- [ ] Running into a small dino (+25), stegosaurus (+35) and caveman (+40) catches it.
- [ ] Small RAWR (tap button / **R**): bubble, sound, animation, 1.5 s cooldown.
- [ ] Big RAWR (hold button / **E**): pterodactyls nearby flee, chaseables panic, 5 s cooldown.

## Levels
- [ ] Grasslands 1:00 → Volcano 1:30 → Desert 2:00 → Swamp 2:00 → Caverns (ENDLESS MODE).
- [ ] Each level shows its own background, obstacles and music; level-complete screen names the next world.
- [ ] Score carries across levels; dying returns to Grasslands.
- [ ] Volcano: lava eruptions show a warning before they land.

## Timing
- [ ] Game speed is the same on a 60 Hz and a 120 Hz screen (iPhone/iPad Pro, gaming monitor).
- [ ] Switching tabs mid-level pauses the timer; returning continues from the same time.

## Music
- [ ] Grasslands theme starts with the run; each world plays its own theme after the level-complete screen.
- [ ] Phantom Raptor (`?boss`): a low sting, then the boss theme; after the NOM a short fanfare and the world theme returns.
- [ ] Dying, restarting quickly and switching tabs never leave two tracks playing at once.
- [ ] Big RAWR briefly dips the music; jump, chomp and RAWR sounds are always clearly audible.
- [ ] ♪ button (top left) or **M** mutes the music and the setting survives a reload. `?music=v1` plays the old soundtrack.
- [ ] `music.html` lists every theme and plays/stops each one.

## Death and leaderboard
- [ ] Hitting an obstacle shows GAME OVER, then the Hall of Fame after about a second.
- [ ] Tapping immediately after death starts a new run and the Hall of Fame does **not** interrupt it.
- [ ] Hall of Fame lists the top 10, includes the score you just made, and shows your score badge.
- [ ] With the network off, the Hall of Fame says it couldn't reach the leaderboard (not "No scores yet").
- [ ] Hosted in a subfolder (GitHub Pages), the game loads and installs to the home screen.

## Mobile
- [ ] Canvas fills the screen without blurring; RAWR button reachable with a thumb.
- [ ] Installed as a home-screen app it loads the latest version (bump `CACHE` in `sw.js` each release).
- [ ] Phone browser (not installed): the "GET THE T-REX RUN APP!" card shows on the title screen every visit; Android has INSTALL, iPhone shows Share then Add to Home Screen; ✕ hides it until the next visit; never shows in the installed app or during play.
