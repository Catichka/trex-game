'use strict';
// ── Phantom Raptor boss (placeholder prototype) ──────────────────
// Design: docs/design/M2_RAWR_PHANTOM_RAPTOR.md. Arrives when Caverns' timer runs out;
// ?boss (or #boss) also starts it 3 s into any level. One cycle: run in ahead of the
// T-Rex → telegraph → drop one obstacle → cloak (footprints + eye glint stay
// visible). Small RAWR reveals it briefly, big RAWR stuns it; a stunned boss
// drifts back to the T-Rex's jaws and one BITE lands (Cat, 2026-11-03). After a
// bite it runs ahead again and repeats its pattern. The 5th bite eats it.
// Missing the window just repeats the cycle. Art: ChatGPT's sprite sheet
// (assets/characters/phantom-raptor); the pixel drawing below is the fallback.
//
// Uses game.js globals at runtime (player, obstacles, THEMES, levelIdx, ...).

var Boss = (function () {
  var ENABLED = /[?&]boss\b/.test(location.search) || location.hash === '#boss';
  var START_TICK = 180;          // 3 s into the level
  var U = 2;                     // placeholder drawn in 2x2 blocks: 80x60, bigger than the T-Rex
  var W_ = 40 * U, H_ = 30 * U;  // gameplay box
  var LEAD = 200;                // px ahead of the T-Rex while running
  var RAWR_RANGE = 260;          // boss box left edge within this of the T-Rex
  var TELEGRAPH = 45, CLOAK_FOR = 300, REVEAL = 72, STUN = 110, SCORE = 200;
  var BITES = 5, BITE_SCORE = 40, GULP = 50; // bites to win, points per bite, ticks to swallow

  var b = null, done = false, prints = [];

  function homeX() { return player.x + LEAD; }
  function set(st, t) { b.state = st; b.t = 0; b.dur = t || 0; }

  function reset() { b = null; done = false; prints.length = 0; }
  function active() { return !!b; }

  function maybeStart(tick) {
    if (!ENABLED || done || b || tick < START_TICK) return;
    startNow();
  }
  // The real encounter: the end of Caverns (game.js). ?boss also starts it early.
  function startNow() {
    if (done || b) return;
    b = { x: W + 20, y: GROUND - H_, state: 'enter', t: 0, dur: 80, alpha: 1, reveal: 0, f: 0, fromX: 0, hp: BITES, hurt: 0 };
    // Boss theme takes over from the world music (old music mode: just a jingle).
    if (MUSIC_V1) sfxLevelUp(); else playBossMusic();
    addPopup(W / 2, 60, 'PHANTOM RAPTOR!', '#c8a0ff');
  }

  // Obstacle the boss throws: the theme's first ground obstacle.
  function attackKind() {
    var th = THEMES[levelIdx];
    for (var i = 0; i < th.obs.length; i++) if (th.obs[i] !== 'pt') return th.obs[i];
    return 'rS';
  }
  // Where the thrown obstacle lands: at least ~0.75 s of travel from the
  // T-Rex whatever the speed (off the right edge at very high speeds).
  function attackX(spd) { return Math.min(W, Math.max(b.x, player.x + DINO_W + spd * 45)); }
  function obstacleAhead() {
    for (var i = 0; i < obstacles.length; i++) if (obstacles[i].x + obstacles[i].w > player.x) return true;
    return false;
  }

  function onRawr(big) {
    if (!b) return;
    var st = b.state;
    if (st === 'enter' || st === 'stun' || st === 'recover' || st === 'eaten') return;
    if (b.x - (player.x + DINO_W) > RAWR_RANGE) return;
    if (big) { b.fromX = b.x; set('stun', STUN); b.alpha = 1; addPopup(b.x + W_ / 2, b.y - 6, 'STUNNED!', '#ffff44'); }
    else b.reveal = REVEAL;
  }

  function update(spd) {
    if (!b) return;
    b.t++; b.f++; b.spd = spd;
    if (b.reveal > 0) b.reveal--;
    if (b.hurt > 0) b.hurt--;
    var p;
    switch (b.state) {
      case 'enter':
        p = Math.min(1, b.t / b.dur);
        b.x = W + 20 + (homeX() - W - 20) * (1 - (1 - p) * (1 - p));
        if (p >= 1) set('run', 40);
        break;
      case 'run':
        b.x = homeX() + Math.sin(b.f * 0.08) * 4;
        if (b.t >= b.dur && !obstacleAhead()) { set('telegraph', TELEGRAPH); sfxSwoop(); }
        break;
      case 'telegraph':
        b.x = homeX();
        if (b.t >= b.dur) {
          var k = attackKind(), sz = OBJ[k] || OBJ.rS;
          var ox = attackX(spd);
          obstacles.push({ kind: k, x: ox, y: GROUND - sz.h, w: sz.w, h: sz.h, bitable: false, wT: 0, wF: 0, flee: false, anim: new Animator('idle') });
          sfxLavaLand();
          set('cloak', CLOAK_FOR);
        }
        break;
      case 'cloak':
        b.x = homeX() + Math.sin(b.f * 0.05) * 10;
        if (b.f % 12 === 0) prints.push({ x: b.x + (b.f % 24 ? 24 : 42), life: 90 });
        if (b.t >= b.dur && !obstacleAhead()) set('telegraph', TELEGRAPH);
        break;
      case 'stun':
        p = Math.min(1, b.t / 50);
        b.x = b.fromX + (player.x + 4 - b.fromX) * p * p; // drifts back into the T-Rex
        if (b.t >= b.dur) { b.fromX = b.x; set('recover', 60); }
        break;
      case 'recover':
        p = Math.min(1, b.t / b.dur);
        b.x = b.fromX + (homeX() - b.fromX) * p;
        if (p >= 1) set('cloak', CLOAK_FOR);
        break;
      case 'eaten': // swallowed whole: shrinks into the T-Rex's jaws
        if (b.t >= b.dur) { b = null; done = true; addPopup(W / 2, 60, 'PHANTOM RAPTOR DEFEATED!', '#88ff88'); }
        break;
    }
    if (!b) return;
    // Cloak fades in/out; revealed, stunned and attacking bosses are fully visible.
    var hidden = b.state === 'cloak' && b.reveal === 0;
    b.alpha += ((hidden ? 0.12 : 1) - b.alpha) * 0.15;
    prints.forEach(function (fp) { fp.x -= spd; fp.life--; });
    prints = prints.filter(function (fp) { return fp.life > 0 && fp.x > -10; });
  }

  // BITE while it's stunned at the T-Rex's jaws: one bite per stun.
  function checkNom() {
    if (!b || b.state !== 'stun' || !player.biting) return;
    if (!hits(player.biteX, player.biteY, player.biteW, player.biteH, b.x + 4, b.y + 4, W_ - 8, H_ - 4)) return;
    b.hp--; b.hurt = 24; player.chomp(); sfxBite();
    spawnEffect('fx-chomp', 'play', player.mouthX, player.mouthY, 24, 24, false, { center: true });
    if (b.hp > 0) {
      score += BITE_SCORE;
      addPopup(b.x + W_ / 2, b.y - 6, 'BITE! ' + b.hp + ' TO GO', '#ffee44');
      b.fromX = b.x; set('recover', 60); // back out in front, then the pattern again
      return;
    }
    // Last bite: eaten like the other dinosaurs.
    score += SCORE; addPopup(player.mouthX + 8, player.y - 10, '+' + SCORE + ' GULP!', '#88ff88'); sfxCatch();
    b.fromX = b.x; set('eaten', GULP);
    if (!MUSIC_V1) {
      Sound.fanfare();
      // The Caverns finale ends the level; a ?boss test fight returns to the world music.
      if (levelIdx !== BOSS_LV) playWorldMusic(levelIdx, { fade: 0.3, delay: 0.8 });
    }
  }
  function hp() { return b ? b.hp : 0; }

  function drawRaptor(x, y, f, body, dark) {
    x = Math.round(x); y = Math.round(y);
    function P(px, py, w, h, c) { R(x + px * U, y + py * U, w * U, h * U, c); }
    var leg = Math.floor(f / 6) % 2;
    P(0, 10, 12, 4, body); P(2, 9, 6, 2, dark);            // tail
    P(10, 8, 18, 12, body); P(12, 16, 14, 4, '#7fe0e0');   // body + belly
    P(14, 8, 2, 2, '#40d8d0'); P(19, 9, 2, 2, '#40d8d0');  // markings
    P(24, 2, 6, 10, body);                                 // neck
    P(26, 0, 14, 7, body); P(30, 6, 10, 2, dark);          // head + jaw
    P(33, 1, 3, 3, '#ffe040'); P(34, 2, 1, 1, '#000');     // eye
    P(26, 13, 3, 3, dark);                                 // arm
    if (leg) { P(13, 20, 4, 8, dark); P(21, 19, 4, 7, body); P(22, 26, 5, 2, dark); P(11, 28, 6, 2, dark); }
    else     { P(13, 19, 4, 7, body); P(21, 20, 4, 8, dark); P(12, 26, 5, 2, dark); P(21, 28, 6, 2, dark); }
  }

  function draw() {
    prints.forEach(function (fp) {
      ctx.globalAlpha = Math.min(1, fp.life / 40);
      // Dark-edged violet prints: the boss's colour, unlike any ground speckle or pickup.
      R(fp.x - 1, GROUND - 4, 9, 4, '#1a1030'); R(fp.x, GROUND - 3, 7, 2, '#e8d8ff');
    });
    ctx.globalAlpha = 1;
    if (!b) return;
    var stunned = b.state === 'stun';
    if (b.state === 'eaten') { drawEaten(); return; }
    // ChatGPT's sprite sheet when loaded. Its cloak frames fade by dithering
    // and keep the eye visible, so no extra alpha or eye glint is needed.
    var hidden = b.state === 'cloak' && b.reveal === 0;
    var anim = hidden ? 'cloak' : b.state === 'telegraph' || stunned ? b.state : 'run';
    var at = anim === 'run' || stunned ? b.f : b.t;
    var flash = b.hurt > 0 && (b.hurt >> 2) % 2 === 0; // just bitten: blinks
    var art = Assets.drawSprite(ctx, 'phantom-raptor', anim, at, b.x, b.y, W_, H_, { flipX: true, alpha: flash ? 0.35 : 1 });
    var headX = art ? b.x + 60 : b.x + 34 * U;
    if (!art) {
      ctx.globalAlpha = b.alpha;
      drawRaptor(b.x, b.y, stunned ? 0 : b.f, stunned ? '#b8a0ff' : '#5a40b8', stunned ? '#7a60d0' : '#2e2070');
      ctx.globalAlpha = 1;
      // The eye glint never disappears, even fully cloaked.
      if (b.alpha < 0.6) R(b.x + 33 * U, b.y + U, 3 * U, 3 * U, '#ffe040');
    }
    if (b.state === 'telegraph' && (b.t >> 2) % 2 === 0) {
      R(headX - 5, b.y - 18, 10, 13, '#ffff44');
      ctx.fillStyle = '#c00000'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('!', headX, b.y - 7); ctx.textAlign = 'left';
      // Ground-lane warning where the obstacle will land, arrows pointing at the T-Rex.
      var wx = Math.round(Math.min(W - 22, attackX(b.spd || 0)));
      R(wx - 1, GROUND + 2, 22, 9, '#1a1030');
      ctx.fillStyle = '#ffff44';
      for (var k = 0; k < 2; k++) {
        ctx.beginPath(); ctx.moveTo(wx + 2 + k * 10, GROUND + 6); ctx.lineTo(wx + 8 + k * 10, GROUND + 3);
        ctx.lineTo(wx + 8 + k * 10, GROUND + 9); ctx.fill();
      }
    }
    if (stunned && !art) { // the sprite's stun frames have their own stars
      ctx.fillStyle = '#ffff00';
      for (var i = 0; i < 3; i++) {
        var a = b.f * 0.15 + i * 2.1;
        ctx.fillRect(Math.round(b.x + 34 * U + Math.cos(a) * 14), Math.round(b.y - 6 + Math.sin(a) * 4), 3, 3);
      }
    }
    if (Assets.debug) {
      ctx.strokeStyle = '#00ffff'; ctx.strokeRect(b.x + 4.5, b.y + 4.5, W_ - 9, H_ - 5);
      ctx.fillStyle = '#00ffff'; ctx.font = '8px monospace';
      ctx.fillText(b.state + ' t' + b.t + ' rng' + Math.round(b.x - player.x - DINO_W) + ' rev' + b.reveal, 4, 28);
    }
  }

  // Last bite: the knocked-out raptor shrinks into the T-Rex's mouth.
  function drawEaten() {
    var p = Math.min(1, b.t / b.dur), e = p * p;
    var cx = b.fromX + W_ / 2 + (player.mouthX + 10 - b.fromX - W_ / 2) * e;
    var cy = GROUND + (player.mouthY + 14 - GROUND) * e, sc = 1 - 0.85 * e;
    ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.scale(sc, sc);
    if (!Assets.drawSprite(ctx, 'phantom-raptor', 'defeat', b.t, -W_ / 2, -H_, W_, H_, { flipX: true }))
      drawRaptor(-W_ / 2, -H_, 0, '#b8a0ff', '#7a60d0');
    ctx.restore();
  }

  function info() { return b && { state: b.state, t: b.t, x: Math.round(b.x), alpha: +b.alpha.toFixed(2) }; }

  return { enabled: ENABLED, reset: reset, active: active, hp: hp, BITES: BITES, startNow: startNow, isDone: function () { return done; }, info: info, maybeStart: maybeStart,
           update: update, draw: draw, onRawr: onRawr, checkNom: checkNom };
})();
