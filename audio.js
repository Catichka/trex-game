'use strict';
// ── Sound system: mixer + multivoice music sequencer ─────────────
// Mixer: music bus and SFX bus → master → gentle compressor → speakers.
// Music: themes come from docs/audio/theme_scores.js (ChatGPT's scores;
// loaded as window.THEME_SCORES by index.html). Each theme is 8 bars of
// eighth-note steps. Four voices are arranged from the score: lead (the
// melody), bass (root/fifth pulse), soft chord stabs and light drums.
// Notes are scheduled on the Web Audio clock with a short look-ahead, so
// timing doesn't depend on frame rate or timers.
//
//   Sound.ctx()            the shared AudioContext (created on first use)
//   Sound.sfx              node game sound effects connect to
//   Sound.play(id, opts)   switch music to a theme (crossfade); opts.sting
//   Sound.stop()           fade the music out
//   Sound.toggleMute()     music on/off, remembered on this device

var Sound = (function () {
  var ac = null, master, musicBus, sfxBus, noiseBuf, leadWave;
  var MUSIC_VOL = 0.32, SFX_VOL = 0.55;
  var LOOKAHEAD = 0.15, TICK_MS = 25;
  var muted = false;
  try { muted = localStorage.getItem('trex-music-muted') === '1'; } catch (e) {}

  function ctx() {
    if (ac) return ac;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ac.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = muted ? 0 : MUSIC_VOL; musicBus.connect(master);
    // Effects get a gentle low-pass so square/saw blips aren't harsh.
    var soften = ac.createBiquadFilter(); soften.type = 'lowpass'; soften.frequency.value = 5200;
    sfxBus = ac.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(soften); soften.connect(master);
    api.sfx = sfxBus;
    // Rounded lead: 68% fundamental, 25% 2nd harmonic, 7% 3rd (per the V4 spec).
    leadWave = ac.createPeriodicWave(new Float32Array([0, 0, 0, 0]), new Float32Array([0, 0.68, 0.25, 0.07]));
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) ac.suspend(); else ac.resume();
    });
    return ac;
  }

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ── Instruments (each note: a couple of nodes, freed when it stops) ──
  function env(g, t, peak, a, dur, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * 0.7, t + a, dur * 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur, rel);
  }
  function lead(out, t, m, dur, v) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.setPeriodicWave(leadWave); o.frequency.value = hz(m);
    env(g, t, 0.30 * v, 0.012, dur * 0.85, 0.05);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.3);
  }
  function bass(out, t, m, dur) {
    var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = hz(m);
    f.type = 'lowpass'; f.frequency.value = 900;
    env(g, t, 0.42, 0.008, dur * 0.8, 0.04);
    o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.25);
  }
  function stab(out, t, notes, dur) {
    var g = ac.createGain();
    env(g, t, 0.07, 0.006, dur * 0.6, 0.05);
    g.connect(out);
    notes.forEach(function (m) {
      var o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
      o.connect(g); o.start(t); o.stop(t + dur + 0.25);
    });
  }
  function kick(out, t) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
  }
  function noise(out, t, type, freq, vol, len) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + len + 0.02);
  }
  function snare(out, t) { noise(out, t, 'bandpass', 1900, 0.22, 0.11); }
  function hat(out, t, accent) { noise(out, t, 'highpass', 7500, accent ? 0.06 : 0.035, 0.035); }

  // ── Arrangement helpers ─────────────────────────────────────────
  var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10] };
  function keyInfo(key) { // "G major", "E minor", "A Dorian"
    var NAMES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    var p = (key || 'C major').split(' ');
    var root = NAMES[p[0]] || 0, mode = SCALES[(p[1] || 'major').toLowerCase()] || SCALES.major;
    return mode.map(function (s) { return (root + s) % 12; });
  }
  // Diatonic triad on a bass root, voiced around middle C (MIDI 55–67).
  function triad(scale, rootMidi) {
    var pc = ((rootMidi % 12) + 12) % 12;
    var third = scale.indexOf((pc + 4) % 12) >= 0 ? 4 : 3;
    var fifth = scale.indexOf((pc + 7) % 12) >= 0 ? 7 : 6;
    var base = 55 + ((pc - 55 % 12 + 12) % 12);
    return [base, base + third, base + fifth];
  }

  // Build one loop of events [step, fn] from a score, once per theme.
  function arrange(th) {
    var ev = [], scale = keyInfo(th.key), bars = th.melody.length;
    th.melody.forEach(function (bar, b) {
      bar.forEach(function (n) { ev.push({ s: b * 8 + n[0], k: 'lead', m: n[2], d: n[1], v: n[1] >= 4 ? 0.9 : 1 }); });
      var r = th.bassRoots[b % th.bassRoots.length];
      [0, 2, 4, 6].forEach(function (p, i) { ev.push({ s: b * 8 + p, k: 'bass', m: i % 2 ? r + 7 : r, d: 1.6 }); });
      var ch = triad(scale, r);
      [3, 7].forEach(function (p) { ev.push({ s: b * 8 + p, k: 'stab', ms: ch, d: 1 }); });
      for (var p = 0; p < 8; p++) {
        if (p === 0 || p === 4) ev.push({ s: b * 8 + p, k: 'kick' });
        if (p === 2 || p === 6) ev.push({ s: b * 8 + p, k: 'snare' });
        if (p % 2 === 0) ev.push({ s: b * 8 + p, k: 'hat', a: p === 0 });
      }
    });
    ev.sort(function (a, b) { return a.s - b.s; });
    return { ev: ev, steps: bars * 8, step: 60 / th.bpm / 2 };
  }
  var cache = {};
  function score(id) {
    var all = window.THEME_SCORES || {};
    if (!all[id]) return null;
    return cache[id] || (cache[id] = arrange(all[id]));
  }

  // ── Sequencer ───────────────────────────────────────────────────
  var track = null, timer = null, pending = null;
  function run(tr) {
    var now = ac.currentTime, A = tr.arr;
    while (true) {
      var e = A.ev[tr.i], t = tr.t0 + (tr.loop * A.steps + e.s) * A.step;
      if (t > now + LOOKAHEAD) break;
      if (t >= now - 0.02) {
        var len = (e.d || 1) * A.step;
        if (e.k === 'lead') lead(tr.out, t, e.m, len, e.v);
        else if (e.k === 'bass') bass(tr.out, t, e.m, len);
        else if (e.k === 'stab') stab(tr.out, t, e.ms, len);
        else if (e.k === 'kick') kick(tr.out, t);
        else if (e.k === 'snare') snare(tr.out, t);
        else if (e.k === 'hat') hat(tr.out, t, e.a);
      }
      if (++tr.i >= A.ev.length) { tr.i = 0; tr.loop++; }
    }
  }
  function tick() { if (track) run(track); }

  function fadeOut(tr, sec) {
    var t = ac.currentTime;
    tr.out.gain.cancelScheduledValues(t);
    tr.out.gain.setValueAtTime(tr.out.gain.value, t);
    tr.out.gain.linearRampToValueAtTime(0, t + sec);
    setTimeout(function () { tr.out.disconnect(); }, sec * 1000 + 400);
  }

  function play(id, opts) {
    opts = opts || {};
    ctx(); if (ac.state === 'suspended') ac.resume();
    var arr = score(id);
    if (track && track.id === id) return;
    stopFile(opts.fade);
    pending = arr ? null : { id: id, opts: opts }; // scores still loading: start when they arrive
    if (track) fadeOut(track, opts.fade || 0.35);
    track = null;
    if (!arr) return;
    var out = ac.createGain(); out.gain.value = 1; out.connect(musicBus);
    var start = ac.currentTime + (opts.delay || 0.08);
    if (opts.sting) { sting(start); start += 0.6; }
    track = { id: id, arr: arr, out: out, t0: start, i: 0, loop: 0 };
    if (!timer) timer = setInterval(tick, TICK_MS);
    tick();
  }
  function stop(sec) {
    if (track && ac) fadeOut(track, sec || 0.25);
    track = null; pending = null; stopFile(sec);
  }

  // ── Recorded tracks (music alpha test) ──────────────────────────
  // Plays an audio file as-is, looped, through the music bus (so mute and
  // the big-RAWR duck still work). No tempo, pitch or arrangement changes.
  var file = null, buffers = {};
  function stopFile(sec) {
    if (!file) return;
    var f = file; file = null;
    if (!f.src || !ac) return;
    var t = ac.currentTime;
    f.out.gain.setValueAtTime(f.out.gain.value, t);
    f.out.gain.linearRampToValueAtTime(0, t + (sec || 0.3));
    setTimeout(function () { try { f.src.stop(); } catch (e) {} f.out.disconnect(); }, (sec || 0.3) * 1000 + 200);
  }
  function loadBuffer(url) {
    if (!buffers[url]) buffers[url] = fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.arrayBuffer();
    }).then(function (b) {
      return new Promise(function (ok, bad) { ac.decodeAudioData(b, ok, bad); });
    });
    buffers[url].catch(function () { delete buffers[url]; });
    return buffers[url];
  }
  // onFail: called if the file can't be fetched or decoded.
  function playFile(id, url, opts) {
    opts = opts || {};
    ctx(); if (ac.state === 'suspended') ac.resume();
    if (file && file.id === id) return;
    if (track) fadeOut(track, opts.fade || 0.35);
    track = null; pending = null; stopFile(opts.fade);
    var me = file = { id: id, src: null, out: null };
    loadBuffer(url).then(function (buf) {
      if (file !== me) return; // something else started meanwhile
      me.out = ac.createGain(); me.out.gain.value = 1; me.out.connect(musicBus);
      me.src = ac.createBufferSource(); me.src.buffer = buf; me.src.loop = true;
      me.src.connect(me.out); me.src.start(ac.currentTime + (opts.delay || 0.05));
    }).catch(function (e) {
      console.warn('[music] could not play ' + url, e);
      if (file === me) { file = null; if (opts.onFail) opts.onFail(); }
    });
  }
  function scoresReady() { if (pending) { var p = pending; pending = null; play(p.id, p.opts); } }
  // Ominous one-beat sting before the boss loop: low octave hit + noise swell.
  function sting(t) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(hz(42), t); o.frequency.linearRampToValueAtTime(hz(41), t + 0.5);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.6);
    noise(musicBus, t, 'lowpass', 900, 0.25, 0.5);
  }
  // Short major flourish for beating the boss (played on the SFX bus).
  function fanfare() {
    ctx();
    var t = ac.currentTime + 0.02;
    [67, 71, 74, 79].forEach(function (m, i) { lead(sfxBus, t + i * 0.09, m, i === 3 ? 0.4 : 0.1, 1.2); });
  }
  // Briefly lower the music so a big effect (big RAWR) reads clearly.
  function duck(sec) {
    if (!ac || muted) return;
    var t = ac.currentTime, g = musicBus.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_VOL * 0.4, t + 0.04);
    g.setTargetAtTime(MUSIC_VOL, t + (sec || 0.5), 0.15);
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('trex-music-muted', muted ? '1' : '0'); } catch (e) {}
    if (ac) { var t = ac.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(muted ? 0 : MUSIC_VOL, t, 0.05); }
    return muted;
  }

  var api = {
    ctx: ctx, sfx: null, play: play, stop: stop, scoresReady: scoresReady, duck: duck, fanfare: fanfare,
    toggleMute: toggleMute, isMuted: function () { return muted; },
    playFile: playFile,
    current: function () { return file ? file.id : track && track.id; },
    themes: function () { return window.THEME_SCORES || {}; },
  };
  return api;
})();
