'use strict';
// ── Phantom Raptor boss (placeholder prototype) ──────────────────
// Design: docs/design/M2_RAWR_PHANTOM_RAPTOR.md. Enabled with ?boss (or #boss), which
// starts the encounter 3 s into any level. One cycle: run in ahead of the
// T-Rex → telegraph → drop one obstacle → cloak (footprints + eye glint stay
// visible). Small RAWR reveals it briefly, big RAWR stuns it; a stunned boss
// drifts back into the T-Rex and is eaten on contact (no NOM button).
// Missing the window just repeats the cycle. Placeholder pixel drawing only.
//
// Uses game.js globals at runtime (player, obstacles, THEMES, levelIdx, ...).

var Boss = (function () {
  var ENABLED = /[?&]boss\b/.test(location.search) || location.hash === '#boss';
  var START_TICK = 180;          // 3 s into the level
  var U = 2;                     // placeholder drawn in 2x2 blocks: 80x60, bigger than the T-Rex
  var W_ = 40 * U, H_ = 30 * U;  // gameplay box
  var LEAD = 200;                // px ahead of the T-Rex while running
  var RAWR_RANGE = 260;          // boss box left edge within this of the T-Rex
  var TELEGRAPH = 45, CLOAK_FOR = 300, REVEAL = 72, STUN = 90, SCORE = 200;

  var b = null, done = false, prints = [];

  function homeX() { return player.x + LEAD; }
  function set(st, t) { b.state = st; b.t = 0; b.dur = t || 0; }

  function reset() { b = null; done = false; prints.length = 0; }
  function active() { return !!b; }

  function maybeStart(tick) {
    if (!ENABLED || done || b || tick < START_TICK) return;
    b = { x: W + 20, y: GROUND - H_, state: 'enter', t: 0, dur: 80, alpha: 1, reveal: 0, f: 0, fromX: 0 };
    sfxLevelUp();
    addPopup(W / 2, 60, 'PHANTOM RAPTOR!', '#c8a0ff');
  }

  // Obstacle the boss throws: the theme's first ground obstacle.
  function attackKind() {
    var th = THEMES[levelIdx];
    for (var i = 0; i < th.obs.length; i++) if (th.obs[i] !== 'pt') return th.obs[i];
    return 'rS';
  }
  function obstacleAhead() {
    for (var i = 0; i < obstacles.length; i++) if (obstacles[i].x + obstacles[i].w > player.x) return true;
    return false;
  }

  function onRawr(big) {
    if (!b) return;
    var st = b.state;
    if (st === 'enter' || st === 'stun' || st === 'recover' || st === 'defeat') return;
    if (b.x - (player.x + DINO_W) > RAWR_RANGE) return;
    if (big) { b.fromX = b.x; set('stun', STUN); b.alpha = 1; addPopup(b.x + W_ / 2, b.y - 6, 'STUNNED!', '#ffff44'); }
    else b.reveal = REVEAL;
  }

  function update(spd) {
    if (!b) return;
    b.t++; b.f++;
    if (b.reveal > 0) b.reveal--;
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
          // At least ~0.75 s of travel before it reaches the T-Rex, whatever the speed.
          var ox = Math.min(W, Math.max(b.x, player.x + DINO_W + spd * 45));
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
      case 'defeat':
        b.x -= spd + 1; b.y = Math.min(GROUND - H_ + 8, b.y + 0.5);
        if (b.x < -60) { b = null; done = true; addPopup(W / 2, 60, 'PHANTOM RAPTOR DEFEATED!', '#88ff88'); }
        break;
    }
    if (!b) return;
    // Cloak fades in/out; revealed, stunned and attacking bosses are fully visible.
    var hidden = b.state === 'cloak' && b.reveal === 0;
    b.alpha += ((hidden ? 0.12 : 1) - b.alpha) * 0.15;
    prints.forEach(function (fp) { fp.x -= spd; fp.life--; });
    prints = prints.filter(function (fp) { return fp.life > 0 && fp.x > -10; });
  }

  // Contact NOM: only while stunned, scores once.
  function checkNom() {
    if (!b || b.state !== 'stun') return;
    if (!hits(player.hitX, player.hitY, player.hitW, player.hitH, b.x + 4, b.y + 4, W_ - 8, H_ - 4)) return;
    player.triggerBite();
    spawnEffect('fx-chomp', 'play', b.x, b.y, W_, H_, false, { center: true });
    score += SCORE; addPopup(b.x + W_ / 2, b.y - 6, '+' + SCORE + ' NOM!', '#ffee44'); sfxBite(); sfxCatch();
    set('defeat');
  }

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
      R(fp.x, GROUND - 2, 4, 2, '#7fffe8'); R(fp.x + 1, GROUND - 3, 2, 1, '#7fffe8');
    });
    ctx.globalAlpha = 1;
    if (!b) return;
    var stunned = b.state === 'stun';
    ctx.globalAlpha = b.alpha;
    drawRaptor(b.x, b.y, stunned ? 0 : b.f, stunned ? '#b8a0ff' : '#5a40b8', stunned ? '#7a60d0' : '#2e2070');
    ctx.globalAlpha = 1;
    // The eye glint never disappears, even fully cloaked.
    if (b.alpha < 0.6) R(b.x + 33 * U, b.y + U, 3 * U, 3 * U, '#ffe040');
    if (b.state === 'telegraph' && (b.t >> 2) % 2 === 0) {
      R(b.x + 34 * U - 5, b.y - 18, 10, 13, '#ffff44');
      ctx.fillStyle = '#c00000'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('!', b.x + 34 * U, b.y - 7); ctx.textAlign = 'left';
      R(b.x - 6, GROUND - 4, 10, 4, 'rgba(230,200,140,0.8)');
    }
    if (stunned) {
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

  function info() { return b && { state: b.state, x: Math.round(b.x), alpha: +b.alpha.toFixed(2) }; }

  return { enabled: ENABLED, reset: reset, active: active, info: info, maybeStart: maybeStart,
           update: update, draw: draw, onRawr: onRawr, checkNom: checkNom };
})();
