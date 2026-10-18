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

  // ── Set piece: Angry Mama Stego chase ──────────────────────────
  // A big stegosaurus charges in from behind. She creeps closer; RAWR pushes
  // her back (big RAWR more). Survive ~10 s and she trips over a pebble.
  // Placeholder: the stego sprite drawn at 2x with angry eyebrows.
  // Once per level, 30-45 s in. ?chase starts it 10 s in (playtesting);
  // ?nochase turns it off.
  var CHASE_OFF = /nochase/.test(FLAGS), CHASE_FAST = !CHASE_OFF && /chase/.test(FLAGS);
  var SCALE = 2, MW = 48 * SCALE, MH = 32 * SCALE;
  var mama = {
    exclusive: true, once: true,
    worlds: function () { return !CHASE_OFF; },
    firstAt: function () { return CHASE_FAST ? 600 : Math.round(rnd(30, 45) * 60); },
    gap: function () { return Infinity; },
    start: function () {
      this.x = -MW - 30; this.state = 'warn'; this.t = 0; this.anim = new Animator('panic');
      this.push = 0; this.stun = 0; this.hit = false;
      addPopup(W / 2, 54, 'UH OH... MAMA STEGO!', '#ff8a5a'); sfxRumble();
    },
    onRawr: function (big) {
      if (this.state !== 'chase') return;
      this.push += big ? 70 : 32; if (big) this.stun = 50;
      addPopup(Math.max(20, this.x + MW), GROUND - MH - 6, big ? 'EEK!' : 'eep!', '#ffe066');
    },
    drawFront: function (spd) {
      this.t++;
      var gapX = player.x - (this.x + MW - 18);   // >0: not touching yet
      if (this.state === 'warn') {
        // Dust and a rumble at the left edge, then she appears.
        if (this.t % 6 === 0) spawnEffect('fx-dust', 'play', rnd(0, 20), GROUND - 16, 24, 16, true, { center: true });
        if (this.t % 30 === 0) sfxRumble();
        if (this.t > 100) { this.x += 1.6; if (this.x > -40) { this.state = 'chase'; this.t = 0; addPopup(W / 2, 54, 'RAWR TO SCARE HER OFF!', '#ffe066'); } }
      } else if (this.state === 'chase') {
        if (this.push > 0) { var d = Math.min(this.push, 4); this.x -= d; this.push -= d; }
        else if (this.stun > 0) this.stun--;
        else this.x += 0.45;
        if (this.x < -MW + 8) this.x = -MW + 8;   // always peeking in
        if (gapX <= 0) this.hit = true;
        if (this.t > 600) { this.state = 'trip'; this.t = 0; addPopup(W / 2, 54, 'TRIPPED! +100', '#88ff88'); score += 100; sfxCatch(); }
      } else if (this.state === 'trip') {
        this.x -= 1.5 + this.t * 0.06;
        if (this.x < -MW - 10) { finish(this); return; }
      }
      // Draw her (2x stego sprite) with angry eyebrows and steam puffs.
      var x = Math.round(this.x), y = GROUND - MH, bob = Math.floor(this.t / 6) % 2;
      ctx.save();
      if (this.state === 'trip') {
        ctx.translate(x + MW / 2, y + MH / 2); ctx.rotate(Math.min(1.4, this.t * 0.08)); ctx.translate(-(x + MW / 2), -(y + MH / 2));
      }
      ctx.translate(x, y - bob); ctx.scale(SCALE, SCALE);
      var self = this;
      if (!Assets.drawSprite(ctx, 'stegosaurus', this.anim.name, this.anim.t, 0, 0, 48, 32)) {
        R(0, 10, 44, 18, '#6aa04a'); R(30, 6, 14, 10, '#6aa04a');
      }
      ctx.restore();
      this.anim.update();
      if (this.state !== 'trip') {
        R(x + MW - 26, y + 14 - bob, 8, 2, '#3a1010'); R(x + MW - 20, y + 12 - bob, 4, 2, '#3a1010'); // eyebrow
        if (this.t % 20 < 10) { R(x + MW - 34, y + 2 - bob, 4, 4, '#f0f0f0'); R(x + MW - 30, y - 2 - bob, 3, 3, '#f0f0f0'); }
        if (this.state === 'chase' && this.stun > 0) {
          ctx.fillStyle = '#ffe066'; ctx.font = 'bold 9px monospace'; ctx.fillText('@_@', x + MW - 34, y - 2);
        }
      } else if (this.t > 10) {
        R(Math.round(player.x - 24 - this.t), GROUND - 3, 4, 3, '#8a8a8a'); // the pebble
      }
    }
  };
  register(mama);

  return {
    reset: reset,
    tick: tick,
    drawBack: function (spd) { each(function (e) { if (e.drawBack) e.drawBack(spd); }); },
    drawFront: function (spd) { each(function (e) { if (e.drawFront) e.drawFront(spd); }); },
    onRawr: function (big) { each(function (e) { if (e.onRawr) e.onRawr(big); }); },
    // During the chase the T-Rex runs further right, so Mama fits on screen.
    playerX: function () { return running.indexOf(mama) >= 0 && mama.state !== 'trip' ? 140 : 55; },
    caught: function () { return running.some(function (e) { return e.hit; }); },
    spawnScale: function () { return running.some(function (e) { return e.exclusive; }) ? 1.5 : 1; },
    blocksPrey: function () { return running.some(function (e) { return e.exclusive; }); },
    chaseEnabled: !CHASE_OFF
  };
})();
