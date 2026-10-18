'use strict';
// ── Encounters: small, self-contained SkiFree-style moments ──────
// Design: docs/design/skifree-level-feel.md. Each encounter is one object
// with its own start / update / draw, so a gag or chase can be added, tuned
// or removed without touching level generation. game.js calls:
//   Encounters.reset()           new run / level
//   Encounters.tick(tick)        once per step while playing (may start one)
//   Encounters.drawBack(spd)     after the ground, behind obstacles
//   Encounters.drawFront(spd)    after obstacles, before the T-Rex
//   Encounters.onRawr(big)       when the T-Rex roars
//   Encounters.caught()          true if an encounter ended the run
//   Encounters.spawnScale()      multiplier for the obstacle interval
//   Encounters.blocksPrey()      true while prey shouldn't spawn
//
// Uses game.js globals at runtime (player, R, ctx, W, GROUND, levelIdx, ...).

var Encounters = (function () {
  var FLAGS = location.search + location.hash;
  var list = [], running = [], now = 0;

  function register(e) { list.push(e); }
  function reset() {
    running.length = 0;
    list.forEach(function (e) { e.nextAt = e.firstAt(); e.done = false; });
  }
  function tick(t) {
    now = t;
    list.forEach(function (e) {
      if (e.done || running.indexOf(e) >= 0 || !e.worlds(levelIdx) || t < e.nextAt) return;
      if (e.exclusive && running.some(function (r) { return r.exclusive; })) return;
      e.start(); running.push(e);
    });
  }
  function finish(e) {
    running.splice(running.indexOf(e), 1);
    if (e.once) e.done = true; else e.nextAt = now + e.gap();
  }
  function each(fn) { running.slice().forEach(fn); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ── Gag: butterflies (day worlds) / fireflies (swamp, caverns) ──
  // Pure scenery: a little swarm drifts past and scatters if you RAWR.
  var bugs = {
    exclusive: false,
    worlds: function (lv) { return lv === 0 || lv === 3 || lv === 4; },
    firstAt: function () { return Math.round(rnd(6, 12) * 60); },
    gap: function () { return Math.round(rnd(22, 38) * 60); },
    start: function () {
      var night = levelIdx >= 3;
      var cols = night ? ['#fff58a', '#d8ff7a', '#fff58a'] : ['#ff8fc8', '#ffe066', '#ffffff', '#9fd8ff'];
      this.night = night; this.list = [];
      var n = 4 + Math.floor(Math.random() * 3), y0 = rnd(GROUND - 70, GROUND - 40);
      for (var i = 0; i < n; i++) this.list.push({
        x: W + 10 + i * rnd(8, 16), y: y0 + rnd(-10, 10), ph: rnd(0, 6.28),
        vx: rnd(0.3, 0.8), vy: 0, c: cols[i % cols.length], flee: false
      });
    },
    onRawr: function () { this.list.forEach(function (b) { b.flee = true; b.vy = rnd(-2.2, -1.2); }); },
    drawBack: function (spd) {
      var alive = 0;
      this.list.forEach(function (b) {
        b.ph += 0.25;
        // They fly forward a little, so they drift past slower than the ground.
        b.x -= spd * 0.55 - b.vx; b.y += b.flee ? b.vy : Math.sin(b.ph * 0.4) * 0.5;
        if (b.x < -8 || b.y < -8) return; alive++;
        var x = Math.round(b.x), y = Math.round(b.y);
        if (bugs.night) {
          var glow = (Math.sin(b.ph * 0.3) + 1) / 2;
          ctx.globalAlpha = 0.2 + 0.5 * glow; R(x - 2, y - 2, 5, 5, b.c);
          ctx.globalAlpha = 1; R(x - 1, y - 1, 3, 3, b.c); R(x, y, 1, 1, '#ffffff');
        } else {
          var open = Math.floor(b.ph) % 2 === 0;
          if (open) { R(x - 3, y - 2, 3, 3, b.c); R(x + 1, y - 2, 3, 3, b.c); R(x - 2, y + 1, 2, 2, b.c); R(x + 1, y + 1, 2, 2, b.c); }
          else { R(x - 1, y - 3, 1, 4, b.c); R(x + 1, y - 3, 1, 4, b.c); }
          R(x, y - 2, 1, 5, '#3a2a20');                               // body
        }
      });
      if (!alive) finish(this);
    }
  };
  register(bugs);

  // ── Set piece: Angry Mama Stego stampede ────────────────────────
  // A rumble and a flashing "JUMP!" warn that she's coming from behind, then
  // she charges past at full speed: jump (a double jump is easiest) and she
  // runs right underneath you. She makes PASSES charges, then trips over a
  // pebble on her way out (+150). Touching her ends the run, like an obstacle.
  // Big RAWR as she arrives makes her stumble and skip that charge.
  // Placeholder: the stego sprite drawn at 2x with angry eyebrows.
  // Once per level, 30-45 s in. ?chase starts it 10 s in (playtesting);
  // ?nochase turns it off.
  var CHASE_OFF = /nochase/.test(FLAGS), CHASE_FAST = !CHASE_OFF && /chase/.test(FLAGS);
  var SCALE = 2, MW = 48 * SCALE, MH = 32 * SCALE;
  var PASSES = 2, WARN = 100, SPEED = 6, BONUS = 150;
  var mama = {
    exclusive: true, once: true,
    worlds: function () { return !CHASE_OFF; },
    firstAt: function () { return CHASE_FAST ? 600 : Math.round(rnd(30, 45) * 60); },
    gap: function () { return Infinity; },
    start: function () {
      this.anim = new Animator('panic'); this.pass = 0; this.hit = false;
      addPopup(W / 2, 54, 'UH OH... MAMA STEGO!', '#ff8a5a');
      this.warn();
    },
    warn: function () {
      this.state = 'warn'; this.t = 0; this.x = -MW - 10; this.stumble = 0;
      spawnT = Math.min(spawnT, -60); // keep the runway clear while she passes
    },
    // Her body, a little inside the sprite so near-misses feel fair.
    box: function () { return { x: this.x + 12, y: GROUND - MH + 14, w: MW - 24, h: MH - 14 }; },
    onRawr: function (big) {
      if (!big || this.state !== 'charge' || this.x + MW < player.x - 40 || this.x > player.x) return;
      this.state = 'stumble'; this.t = 0; addPopup(player.x - 10, GROUND - MH - 8, 'EEK!', '#ffe066');
    },
    drawFront: function (spd) {
      this.t++;
      if (this.state === 'warn') {
        if (this.t % 6 === 0) spawnEffect('fx-dust', 'play', rnd(0, 16), GROUND - 16, 24, 16, true, { center: true });
        if (this.t % 25 === 0) sfxRumble();
        this.prompt = this.t % 20 < 13;
        if (this.t >= WARN) { this.state = 'charge'; this.t = 0; this.prompt = false; }
      } else if (this.state === 'charge') {
        this.x += SPEED;
        var b = this.box(), mg = 5;
        if (hits(player.hitX + mg, player.hitY + mg, player.hitW - mg * 2, player.hitH - mg * 2, b.x, b.y, b.w, b.h)) this.hit = true;
        if (this.x > W + 10) this.next('JUMPED HER!');
      } else if (this.state === 'stumble') {
        // Big RAWR: she skids to a halt behind you, then backs off.
        this.x -= 2 + this.t * 0.1;
        if (this.x < -MW - 10) this.next('SCARED HER OFF!');
      } else if (this.state === 'trip') {
        this.x += 3;
        if (this.x > W + 20) { finish(this); return; }
      }
      if (this.state === 'warn') { this.drawWarning(); return; }
      this.drawMama();
    },
    next: function (msg) {
      this.pass++;
      if (this.pass < PASSES) { addPopup(W / 2, 54, msg + ' AGAIN...', '#ffe066'); this.warn(); return; }
      // Last pass: she comes back on screen from the left only to trip over.
      this.state = 'trip'; this.t = 0; this.x = W - MW - 40;
      score += BONUS; sfxCatch(); addPopup(W / 2, 54, 'SHE TRIPPED! +' + BONUS, '#88ff88');
    },
    drawWarning: function () {
      if (!this.prompt) return;
      // Arrow at the left edge pointing in, plus a big JUMP prompt.
      R(4, GROUND - 40, 10, 22, '#ff5a3a'); R(14, GROUND - 34, 4, 10, '#ff5a3a'); R(18, GROUND - 31, 3, 4, '#ff5a3a');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.fillText('!', 6, GROUND - 24);
      ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#402000'; ctx.fillText('JUMP!', W / 2 + 1, 81);
      ctx.fillStyle = '#ffcf2a'; ctx.fillText('JUMP!', W / 2, 80);
      ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('double jump over Mama Stego', W / 2, 92);
      ctx.textAlign = 'left';
    },
    drawMama: function () {
      var x = Math.round(this.x), y = GROUND - MH, bob = Math.floor(this.t / 4) % 2;
      var tumble = this.state === 'trip' && this.t > 20;
      ctx.save();
      if (tumble) { ctx.translate(x + MW / 2, y + MH / 2); ctx.rotate(Math.min(1.5, (this.t - 20) * 0.1)); ctx.translate(-(x + MW / 2), -(y + MH / 2)); }
      // ChatGPT's Mama Stego atlas (96x64, PR #23); older fallback: the stego at 2x.
      var art = Assets.hasSprite('mama-stego');
      this.anim.play(this.state === 'charge' ? 'run' : this.state === 'stumble' ? (this.t < 18 ? 'flinch' : 'stunned') : 'trip');
      if (art) Assets.drawSprite(ctx, 'mama-stego', this.anim.name, this.anim.t, x, y, MW, MH);
      else {
        ctx.translate(x, y - bob); ctx.scale(SCALE, SCALE);
        if (!Assets.drawSprite(ctx, 'stegosaurus', 'panic', this.anim.t, 0, 0, 48, 32)) { R(0, 10, 44, 18, '#6aa04a'); R(30, 6, 14, 10, '#6aa04a'); }
      }
      ctx.restore();
      this.anim.update();
      if (!tumble && !art) {
        R(x + MW - 26, y + 14 - bob, 8, 2, '#3a1010'); R(x + MW - 20, y + 12 - bob, 4, 2, '#3a1010'); // eyebrow
        if (this.t % 16 < 8) { R(x + MW - 34, y + 2 - bob, 4, 4, '#f0f0f0'); R(x + MW - 30, y - 2 - bob, 3, 3, '#f0f0f0'); }
      }
      if (this.state === 'trip' && this.t > 12 && this.t < 30) R(x + MW + 2, GROUND - 3, 4, 3, '#8a8a8a'); // the pebble
      if (this.state === 'stumble') { ctx.fillStyle = '#ffe066'; ctx.font = 'bold 9px monospace'; ctx.fillText('@_@', x + MW - 34, y - 2); }
    }
  };
  register(mama);

  return {
    reset: reset,
    tick: tick,
    drawBack: function (spd) { each(function (e) { if (e.drawBack) e.drawBack(spd); }); },
    drawFront: function (spd) { each(function (e) { if (e.drawFront) e.drawFront(spd); }); },
    onRawr: function (big) { each(function (e) { if (e.onRawr) e.onRawr(big); }); },
    caught: function () { return running.some(function (e) { return e.hit; }); },
    prompting: function () { return running.some(function (e) { return e.prompt; }); },
    spawnScale: function () { return running.some(function (e) { return e.exclusive; }) ? 1.5 : 1; },
    blocksPrey: function () { return running.some(function (e) { return e.exclusive; }); },
    chaseEnabled: !CHASE_OFF,
    _mama: mama // for tests
  };
})();
