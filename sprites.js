'use strict';
// ── Sprite & environment asset loader ────────────────────────────
// Loads PNG sprite sheets and parallax layers from assets/ (see
// docs/ASSET_SPEC.md). Only ids listed in assets/manifest.json are
// fetched; anything unlisted, missing or broken falls back to the
// caller's placeholder drawing.
//
//   ?placeholders  in the URL forces placeholder graphics everywhere
//   ?debug         draws hitboxes and sprite frame bounds

var Assets = (function () {
  var QS = location.search;
  var forcePlaceholders = /[?&]placeholders\b/.test(QS);
  var debug = /[?&]debug\b/.test(QS);

  var sprites = {};   // id -> { path, meta, img, ready }
  var envs = {};      // id -> { dir, layers: [layer], ready }

  function fetchJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }
  function loadImage(url, onload) {
    var img = new Image();
    img.onload = function () { onload(img); };
    img.onerror = function () { console.info('[assets] not found, using placeholder: ' + url); };
    img.src = url;
  }
  function merge(base, over) {
    var out = {}, k;
    for (k in base) out[k] = base[k];
    for (k in over) out[k] = over[k];
    return out;
  }

  // ── Sprites ────────────────────────────────────────────────────
  // defaults: { frameWidth, frameHeight, anchor:[x,y], animations:{name:{row,frames,fps,loop}},
  //             fallbacks:{anim:'otherAnim'} }
  // The optional <path>.json next to the PNG overrides any default.
  function defineSprite(id, path, defaults) {
    sprites[id] = { id: id, path: path, meta: defaults, img: null, ready: false };
  }
  function loadSprite(s) {
    var path = s.path, defaults = s.meta;
    var finish = function () {
      loadImage(path + '.png', function (img) {
        s.img = img;
        var m = s.meta, maxF = 1, maxRow = 0, k;
        for (k in m.animations) {
          maxF = Math.max(maxF, m.animations[k].frames || 1);
          maxRow = Math.max(maxRow, m.animations[k].row || 0);
        }
        // Single-row sheets (obstacles, fx) may leave the frame size implicit.
        if (!m.frameWidth) m.frameWidth = Math.floor(img.width / maxF);
        if (!m.frameHeight) m.frameHeight = Math.floor(img.height / (maxRow + 1));
        // Forget default animations the sheet doesn't actually contain, so
        // they fall back to one it does instead of drawing an empty cell.
        for (k in m.animations) {
          var an = m.animations[k];
          if (!an.rects && ((an.row || 0) + 1) * m.frameHeight > img.height) delete m.animations[k];
        }
        m.columns = Math.floor(img.width / m.frameWidth);
        if (img.width % m.frameWidth || img.height % m.frameHeight)
          console.warn('[assets] ' + path + '.png is ' + img.width + 'x' + img.height +
            ', not a multiple of the ' + m.frameWidth + 'x' + m.frameHeight + ' frame size');
        s.ready = true;
      });
    };
    fetchJSON(path + '.json').then(function (j) {
      var anims = merge(defaults.animations, j.animations || {});
      // Atlas-style metadata: "frame_size": [w, h], "pivot": [x, y]
      if (j.frame_size) { j.frameWidth = j.frame_size[0]; j.frameHeight = j.frame_size[1]; }
      if (j.pivot && !j.anchor) j.anchor = j.pivot;
      s.meta = merge(defaults, j);
      s.meta.animations = anims;
      s.meta.fallbacks = defaults.fallbacks || {};
    }).catch(function () {}).then(finish);
  }

  // Resolve an animation name to one the sheet actually has.
  function resolveAnim(meta, name) {
    var a = meta.animations, seen = 0;
    while (name && !a[name] && seen++ < 8) name = meta.fallbacks && meta.fallbacks[name];
    if (name && a[name]) return a[name];
    for (var k in a) return a[k];
    return null;
  }

  function hasSprite(id) { var s = sprites[id]; return !!(s && s.ready); }

  // Draw one frame of sprite `id`, animation `anim`, `t` ticks into it
  // (60 ticks = 1 second). The frame's anchor pixel is placed at the
  // bottom-centre of the logical box (bx,by,bw,bh). Returns false if the
  // sprite isn't loaded so the caller can draw its placeholder.
  function drawSprite(ctx, id, anim, t, bx, by, bw, bh, opts) {
    var s = sprites[id];
    if (!s || !s.ready) return false;
    var m = s.meta, a = resolveAnim(m, anim);
    if (!a) return false;
    var n = a.frames || 1;
    var f = Math.floor((t || 0) * (a.fps || 8) / 60);
    f = a.loop === false ? Math.min(f, n - 1) : f % n;
    var fw = m.frameWidth, fh = m.frameHeight, sc = m.scale || 1, sx, sy;
    if (a.rects && a.rects[f]) {
      // Explicit atlas rectangles: [x, y, w, h] per frame
      sx = a.rects[f][0]; sy = a.rects[f][1]; fw = a.rects[f][2]; fh = a.rects[f][3];
    } else {
      var col = (a.col || 0) + f, row = a.row || 0;
      // Animations may wrap onto following rows of the sheet.
      if (m.columns) { row += Math.floor(col / m.columns); col = col % m.columns; }
      sx = col * fw; sy = row * fh;
    }
    var ax = m.anchor ? m.anchor[0] : fw / 2, ay = m.anchor ? m.anchor[1] : fh;
    var flip = opts && opts.flipX;
    var dx = Math.round(bx + bw / 2 - (flip ? fw - ax : ax) * sc);
    var dy = Math.round(by + bh - ay * sc);
    ctx.save();
    if (opts && opts.alpha != null) ctx.globalAlpha = opts.alpha;
    if (flip) {
      ctx.translate(dx + fw * sc, dy); ctx.scale(-1, 1);
      ctx.drawImage(s.img, sx, sy, fw, fh, 0, 0, fw * sc, fh * sc);
    } else {
      ctx.drawImage(s.img, sx, sy, fw, fh, dx, dy, fw * sc, fh * sc);
    }
    ctx.restore();
    if (debug) { ctx.strokeStyle = 'rgba(0,255,255,0.7)'; ctx.strokeRect(dx + 0.5, dy + 0.5, fw * sc - 1, fh * sc - 1); }
    return true;
  }

  // Ticks until a non-looping animation finishes (Infinity if looping/unknown).
  function animLength(id, anim) {
    var s = sprites[id];
    if (!s || !s.ready) return Infinity;
    var a = resolveAnim(s.meta, anim);
    if (!a || a.loop !== false) return Infinity;
    return Math.ceil((a.frames || 1) * 60 / (a.fps || 8));
  }

  // ── Environments (parallax layers) ─────────────────────────────
  // layers: [{ file, speed, y, drift, z:'back'|'front', ground:bool }]
  // The optional <dir>/environment.json { layers:[...] } replaces the defaults.
  function defineEnvironment(id, dir, defaultLayers) {
    envs[id] = { id: id, dir: dir, defaults: defaultLayers, layers: [], hasGround: false, ready: false };
  }
  function loadEnvironment(e) {
    var dir = e.dir, defaultLayers = e.defaults;
    fetchJSON(dir + '/environment.json').then(function (j) { return j.layers || defaultLayers; })
      .catch(function () { return defaultLayers; })
      .then(function (layers) {
        layers.forEach(function (def, i) {
          var L = merge({ speed: 0, y: 0, drift: 0, z: 'back', order: i }, def);
          loadImage(dir + '/' + L.file, function (img) {
            L.img = img;
            e.layers.push(L);
            e.layers.sort(function (a, b) { return a.order - b.order; });
            if (L.ground) e.hasGround = true;
            e.ready = true;
          });
        });
      });
  }

  function hasEnvironment(id) { var e = envs[id]; return !!(e && e.ready); }
  function environmentHasGround(id) { var e = envs[id]; return !!(e && e.hasGround); }

  // Draw the env's layers for one depth ('back' or 'front'), tiled horizontally.
  function drawEnvironment(ctx, id, z, scroll, tick, W) {
    var e = envs[id];
    if (!e || !e.ready) return false;
    e.layers.forEach(function (L) {
      if (L.z !== z) return;
      var iw = L.img.width;
      var off = ((scroll * L.speed + tick * L.drift) % iw + iw) % iw;
      for (var x = -Math.round(off); x < W; x += iw) ctx.drawImage(L.img, x, L.y);
    });
    return true;
  }

  // Fetch the manifest, then every sprite/environment it lists.
  function load() {
    if (forcePlaceholders) return;
    fetchJSON('assets/manifest.json').then(function (m) {
      (m.sprites || []).forEach(function (id) {
        if (sprites[id]) loadSprite(sprites[id]); else console.warn('[assets] manifest lists unknown sprite "' + id + '"');
      });
      (m.environments || []).forEach(function (id) {
        if (envs[id]) loadEnvironment(envs[id]); else console.warn('[assets] manifest lists unknown environment "' + id + '"');
      });
    }).catch(function () { console.info('[assets] no assets/manifest.json, using placeholders'); });
  }

  return {
    load: load,
    debug: debug,
    forcePlaceholders: forcePlaceholders,
    defineSprite: defineSprite,
    hasSprite: hasSprite,
    drawSprite: drawSprite,
    animLength: animLength,
    defineEnvironment: defineEnvironment,
    hasEnvironment: hasEnvironment,
    environmentHasGround: environmentHasGround,
    drawEnvironment: drawEnvironment,
  };
})();

// ── Animator: tracks which animation an entity is playing ────────
// play(name) switches animation (restarting it only when it changes);
// playOnce(name, next) plays a non-looping animation then switches to `next`.
function Animator(name) { this.name = name || 'idle'; this.t = 0; this.next = null; this.left = Infinity; }
// interrupt: cut a playing one-shot short (e.g. jumping again mid-landing).
Animator.prototype.play = function (name, interrupt) {
  if (this.next) {
    if (!interrupt) return; // a one-shot is still playing
    this.next = null; this.left = Infinity;
  }
  if (name !== this.name) { this.name = name; this.t = 0; }
};
Animator.prototype.playOnce = function (name, next, ticks) {
  this.name = name; this.t = 0; this.next = next; this.left = ticks;
};
Animator.prototype.update = function () {
  this.t++;
  if (this.next && --this.left <= 0) { this.name = this.next; this.next = null; this.t = 0; this.left = Infinity; }
};
