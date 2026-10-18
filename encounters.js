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
  // A rumble warns that she's coming from behind, then "JUMP!" flashes. She
  // charges the moment you jump, fast enough to run right underneath you, so
  // any jump during the prompt clears her. Wait too long and she charges
  // anyway: then only a well-timed jump saves you. She makes PASSES charges, then trips over a
  // pebble on her way out (+150). Touching her ends the run, like an obstacle.
  // Big RAWR as she arrives makes her stumble and skip that charge.
  // Placeholder: the stego sprite drawn at 2x with angry eyebrows.
  // Once per level, 30-45 s in. ?chase starts it 10 s in (playtesting);
  // ?nochase turns it off.
  var CHASE_OFF = /nochase/.test(FLAGS), CHASE_FAST = !CHASE_OFF && /chase/.test(FLAGS);
  var SCALE = 2, MW = 48 * SCALE, MH = 32 * SCALE;
  var PASSES = 2, READY = 50, WARN = 230, SPEED = 12, BONUS = 150;
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
      this.state = 'warn'; this.t = 0; this.x = -MW - 10; this.stumble = 0; this.jumped = false;
      spawnT = Math.min(spawnT, -60); // keep the runway clear while she passes
    },
    // Her body, a little inside the sprite so near-misses feel fair.
    box: function () { return { x: this.x + 12, y: GROUND - MH + 14, w: MW - 24, h: MH - 14 }; },
    // A jump while "JUMP!" shows launches her. Starting just off screen at
    // SPEED she is under you from about step 7 to 14 of the jump, while even a
    // single jump keeps you well above her back (steps ~4 to ~26).
    onJump: function () { if (this.state === 'warn' && this.t >= READY) this.jumped = true; },
    onRawr: function (big) {
      if (!big || this.state !== 'charge' || this.x + MW < player.x - 40 || this.x > player.x) return;
      this.state = 'stumble'; this.t = 0; addPopup(player.x - 10, GROUND - MH - 8, 'EEK!', '#ffe066');
    },
    drawFront: function (spd) {
      this.t++;
      if (this.state === 'warn') {
        if (this.t % 6 === 0) spawnEffect('fx-dust', 'play', rnd(0, 16), GROUND - 16, 24, 16, true, { center: true });
        if (this.t % 25 === 0) sfxRumble();
        spawnT = Math.min(spawnT, -60);
        this.prompt = this.t >= READY && this.t % 20 < 13;
        if (this.jumped || this.t >= WARN) {
          this.state = 'charge'; this.prompt = false;
          this.x = this.jumped ? -MW - 3 : -MW - 10; this.t = 0;
        }
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
      if (this.t < READY) {
        ctx.textAlign = 'center'; ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#ffe066';
        ctx.fillText('get ready...', W / 2, 80); ctx.textAlign = 'left'; return;
      }
      if (!this.prompt) return;
      // Arrow at the left edge pointing in, plus a big JUMP prompt.
      R(4, GROUND - 40, 10, 22, '#ff5a3a'); R(14, GROUND - 34, 4, 10, '#ff5a3a'); R(18, GROUND - 31, 3, 4, '#ff5a3a');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.fillText('!', 6, GROUND - 24);
      ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#402000'; ctx.fillText('JUMP!', W / 2 + 1, 81);
      ctx.fillStyle = '#ffcf2a'; ctx.fillText('JUMP!', W / 2, 80);
      ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('jump now: she runs right under you', W / 2, 92);
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

  // ── Rare event: meteor (Volcano) ────────────────────────────────
  // Idea from the kids' playtest memes. Now and then (1 Volcano run in 4) a
  // meteor streaks in from the sky. A red circle marks where it will land,
  // sliding toward you with the ground; it hits just as the circle reaches
  // you, so be in the air at that moment. Dodging it is worth +100.
  // ?meteor makes it certain and early (playtesting).
  var METEOR_FORCE = /meteor/.test(FLAGS), FALL = 110, BLAST = 26, DODGE = 100;
  var meteor = {
    exclusive: true, once: true,
    worlds: function (lv) { return lv === 1; },
    firstAt: function () {
      if (METEOR_FORCE) return 300;
      return Math.random() < 0.25 ? Math.round(rnd(15, 75) * 60) : Infinity;
    },
    gap: function () { return Infinity; },
    start: function () {
      this.t = 0; this.hit = false; this.state = 'fall'; this.crater = 0; this.ct = 0;
      // Target (ground x) lands under the T-Rex after FALL steps.
      this.tx = player.x + DINO_W / 2 + R_SPEED() * FALL;
      sfxRumble();
    },
    drawBack: function (spd) {
      this.tx -= spd;
      if (this.state === 'fall') {
        spawnT = Math.min(spawnT, -40); // nothing else to jump right now
        var k = this.t / FALL, pulse = Math.abs(Math.sin(this.t * (0.12 + k * 0.3)));
        var rw = 10 + k * 16, x = Math.round(this.tx);
        if (Assets.hasAnim('meteor', 'warning')) {
          // Grows as the meteor gets closer so it's easy to spot on a phone.
          var sc = 1.3 + 0.7 * k;
          ctx.save(); ctx.translate(x, GROUND); ctx.scale(sc, sc);
          Assets.drawSprite(ctx, 'meteor', 'warning', this.t, -24, -6, 48, 12,
            { center: true, alpha: Math.min(1, 0.45 + 0.55 * pulse * (0.5 + k)) });
          ctx.restore();
          return;
        }
        ctx.globalAlpha = 0.25 + 0.5 * pulse * (0.4 + k);
        R(x - rw, GROUND - 3, rw * 2, 6, '#ff2a2a');
        R(x - rw + 3, GROUND - 5, rw * 2 - 6, 10, '#ff2a2a');
        ctx.globalAlpha = Math.min(1, 0.3 + k); R(x - rw / 2, GROUND - 2, rw, 4, '#ff7a7a');
        ctx.globalAlpha = 1;
      } else if (this.crater > 0) {
        var cx = Math.round(this.tx); this.crater--;
        if (Assets.hasAnim('meteor', 'crater')) Assets.drawSprite(ctx, 'meteor', 'crater', this.crater, cx - 24, GROUND - 12, 48, 16);
        else {
          R(cx - 18, GROUND - 2, 36, 4, '#3a1a10'); R(cx - 12, GROUND - 4, 24, 3, '#5a2a18');
          if (this.crater % 10 < 5) R(cx - 4, GROUND - 7, 3, 3, '#ff9a3a');
        }
        if (this.crater <= 0) finish(this);
      }
    },
    drawFront: function () {
      if (this.state !== 'fall') {
        // The blast plays over the T-Rex, on the ground where it hit.
        if (Assets.hasAnim('meteor', 'impact') && this.ct < Assets.animLength('meteor', 'impact'))
          Assets.drawSprite(ctx, 'meteor', 'impact', this.ct++, Math.round(this.tx) - 32, GROUND - 44, 64, 48);
        return;
      }
      this.t++;
      var k = this.t / FALL;
      // Comes in from high up and to the right, on a slight curve.
      var mx = this.tx + (1 - k) * 150, my = (GROUND - 14) - (1 - k * k) * (GROUND + 30);
      drawMeteor(Math.round(mx), Math.round(my), this.t);
      if (this.t === FALL - 40) sfxRumble();
      if (this.t >= FALL) this.impact();
    },
    impact: function () {
      this.state = 'crater'; this.crater = 150;
      sfxLavaLand(); sfxRumble();
      for (var i = 0; i < 5; i++) spawnEffect('fx-dust', 'play', this.tx - 30 + i * 12, GROUND - 20, 28, 20, true, { center: true });
      var px = player.hitX + 5, pw = player.hitW - 10, feet = player.hitY + player.hitH - 5;
      var under = px + pw > this.tx - BLAST && px < this.tx + BLAST;
      if (under && feet > GROUND - 24) { this.hit = true; return; } // still (nearly) on the ground
      if (under) { score += DODGE; sfxCatch(); addPopup(player.x, GROUND - 70, 'DODGED! +' + DODGE, '#88ff88'); }
    }
  };
  // ChatGPT's atlas when loaded; otherwise a code-drawn rock with craters,
  // trailing flames (after the meme).
  function drawMeteor(x0, y0, t) {
    if (Assets.hasAnim('meteor', 'fall')) { Assets.drawSprite(ctx, 'meteor', 'fall', t, x0 - 24, y0 - 24, 48, 48, { center: true }); return; }
    ctx.save(); ctx.translate(x0, y0); ctx.scale(1.6, 1.6); var x = 0, y = 0;
    for (var i = 5; i >= 1; i--) {
      var fx = x + i * 7, fy = y - i * 9, fl = (t + i) % 4 < 2 ? 1 : 0;
      ctx.globalAlpha = 0.85 - i * 0.12;
      R(fx - 6 + fl, fy - 6, 12, 12, i > 3 ? '#b81414' : i > 1 ? '#ff4a1a' : '#ff9a1a');
    }
    ctx.globalAlpha = 1;
    R(x - 9, y - 7, 18, 14, '#7a3a1a'); R(x - 7, y - 9, 14, 18, '#7a3a1a');
    R(x - 5, y - 5, 4, 4, '#4a2010'); R(x + 2, y + 1, 5, 4, '#4a2010'); R(x - 4, y + 3, 3, 3, '#4a2010');
    R(x + 3, y - 7, 6, 3, '#ffb03a');
    ctx.restore();
  }
  function R_SPEED() { return typeof gameSpeed === 'number' ? gameSpeed : 4; }
  register(meteor);

  return {
    reset: reset,
    tick: tick,
    drawBack: function (spd) { each(function (e) { if (e.drawBack) e.drawBack(spd); }); },
    drawFront: function (spd) { each(function (e) { if (e.drawFront) e.drawFront(spd); }); },
    // A jump while "JUMP!" shows launches her. Starting just off screen at
    // SPEED she is under you from about step 7 to 14 of the jump, while even a
    // single jump keeps you well above her back (steps ~4 to ~26).
    onJump: function () { if (this.state === 'warn' && this.t >= READY) this.jumped = true; },
    onRawr: function (big) { each(function (e) { if (e.onRawr) e.onRawr(big); }); },
    onJump: function () { each(function (e) { if (e.onJump) e.onJump(); }); },
    caught: function () { return running.some(function (e) { return e.hit; }); },
    prompting: function () { return running.some(function (e) { return e.prompt; }); },
    spawnScale: function () { return running.some(function (e) { return e.exclusive; }) ? 1.5 : 1; },
    blocksPrey: function () { return running.some(function (e) { return e.exclusive; }); },
    chaseEnabled: !CHASE_OFF,
    _mama: mama, _meteor: meteor // for tests
  };
})();
