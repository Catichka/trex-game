'use strict';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ── Leaderboard (Supabase) ───────────────────────────────────────
var SB_URL = 'https://zaujmeukeugxvjtzaspp.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdWptZXVrZXVneHZqdHphc3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTY0MjMsImV4cCI6MjA5NzE3MjQyM30.wSdYoErr0mt7ctskewt537O_eARXlm6SsKr2gMnMuHU';
var SB_HDR = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };

var playerName = localStorage.getItem('trex-name') || '';
var topScores = [];
var boardReady = false;
var boardFromDead = false;
var lastScore = 0;

var boardError = false;
var LB_TIMEOUT = 6000;

// fetch with a timeout, so a slow or paused server can't leave "Loading..." up forever.
function sbFetch(path, opts) {
  opts = opts || {};
  var ctl = window.AbortController ? new AbortController() : null;
  if (ctl) { opts.signal = ctl.signal; setTimeout(function(){ ctl.abort(); }, LB_TIMEOUT); }
  opts.headers = SB_HDR;
  return fetch(SB_URL + '/rest/v1/' + path, opts).then(function(r){
    if (!r.ok) throw new Error('leaderboard HTTP ' + r.status);
    return r;
  });
}

// Scores of 0 aren't worth a row. Calls back once the server has the score
// (or gave up), so the board loaded afterwards includes it.
function submitScore(name, score, callback) {
  if (score <= 0) { if (callback) callback(); return; }
  sbFetch('scores', { method: 'POST', body: JSON.stringify({ name: name, score: Math.floor(score) }) })
    .catch(function(e){ console.warn(e); })
    .then(function(){ if (callback) callback(); });
}

function loadBoard(callback) {
  boardReady = false; boardError = false;
  sbFetch('scores?select=name,score&order=score.desc&limit=10')
    .then(function(r){ return r.json(); })
    .then(function(d){ topScores = Array.isArray(d) ? d : []; })
    .catch(function(e){ console.warn(e); topScores = []; boardError = true; })
    .then(function(){ boardReady = true; if (callback) callback(); });
}

function askName(callback) {
  var box = document.getElementById('nameBox');
  box.style.display = 'flex';
  var inp = document.getElementById('nameInput');
  inp.value = '';
  setTimeout(function(){ inp.focus(); }, 100);
  document.getElementById('nameBtn').onclick = confirmName;
  inp.onkeydown = function(e){ if(e.key==='Enter') confirmName(); };
  function confirmName() {
    var n = inp.value.trim() || 'Dino Kid';
    playerName = n.substring(0, 12);
    localStorage.setItem('trex-name', playerName);
    box.style.display = 'none';
    if(callback) callback();
  }
}

const W = 480, H = 200, GROUND = 152, PIX = 3;
var LEVEL_CFG = [
  { dur:1*60*1000, speed:3.5, spawnI:105, minSpawnI:88  }, // L1 Grasslands  1 min
  { dur:90*1000,   speed:4.0, spawnI:82,  minSpawnI:65  }, // L2 Volcano      1:30
  { dur:2*60*1000, speed:4.5, spawnI:64,  minSpawnI:50  }, // L3 Desert       2 min
  { dur:2*60*1000, speed:5.0, spawnI:52,  minSpawnI:32  }, // L4 Swamp        2 min
  { dur:Infinity,  speed:5.5, spawnI:46,  minSpawnI:28  }, // L5 Caverns      endless
];

// Touch devices get on-screen JUMP / BITE / RAWR buttons (#pad). In portrait
// they sit under the game; in landscape they float over the bottom corners.
// Phones play sideways: portrait shows a "turn your phone" card (game paused)
// unless the player chooses to play upright anyway.
var uprightOK=false; try{uprightOK=sessionStorage.getItem('trex-upright')==='1';}catch(e){}
function rotatePrompt(){ return document.body.classList.contains('askrotate'); }
// Android can lock landscape once the page is fullscreen (needs a tap); iOS ignores this.
function goLandscape(){
  if(!PAD||goLandscape.done)return; goLandscape.done=true;
  try{
    var el=document.documentElement, fs=el.requestFullscreen||el.webkitRequestFullscreen;
    var p=fs&&fs.call(el,{navigationUI:'hide'});
    var lock=function(){ try{ var o=screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape'); if(o&&o.catch)o.catch(function(){}); }catch(e){} };
    if(p&&p.then)p.then(lock,function(){}); else lock();
  }catch(e){}
}
var PAD=/[?&]pad\b/.test(location.search)||('ontouchstart' in window)||
        (window.matchMedia&&matchMedia('(pointer:coarse)').matches);
function resize() {
  var pad=document.getElementById('pad'), vw=window.innerWidth, vh=window.innerHeight;
  var portrait=PAD&&vh>vw;
  document.body.className=PAD?(portrait?'pad portrait':'pad landscape')+(portrait&&!uprightOK?' askrotate':''):'';
  if(portrait)vh=Math.max(vw*H/W,vh-Math.min(vh*0.46,340)); // leave the bottom for the buttons
  const s = Math.min(vw / W, vh / H);
  canvas.style.width  = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// ── Audio ────────────────────────────────────────────────────────
// The AudioContext and mixer live in audio.js; effects play on its SFX bus.
function getAC() { return Sound.ctx(); }

function beep(freq, type, dur, vol, delay) {
  vol = vol || 0.25; delay = delay || 0;
  const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(Sound.sfx);
  o.type = type; o.frequency.value = freq;
  const t = ac.currentTime + delay;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}
function freqSlide(s, e, type, dur, vol, delay) {
  vol = vol || 0.4; delay = delay || 0;
  const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(Sound.sfx);
  o.type = type;
  const t = ac.currentTime + delay;
  o.frequency.setValueAtTime(s, t);
  o.frequency.exponentialRampToValueAtTime(e, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}

function sfxJump()    { beep(320,'square',0.09,0.28); beep(500,'square',0.07,0.18,0.07); }
function sfxLand()    { beep(130,'square',0.05,0.2); }
function sfxSnap()    { beep(180,'square',0.04,0.3); beep(120,'square',0.05,0.25,0.04); }
function sfxBite()    { beep(110,'sawtooth',0.07,0.55); beep(75,'sawtooth',0.09,0.45,0.07); }
function sfxCatch()   { beep(600,'square',0.07,0.25); beep(800,'square',0.07,0.25,0.08); beep(1050,'square',0.07,0.25,0.16); }
function sfxPoints()  { beep(880,'square',0.06,0.18); beep(1100,'square',0.06,0.18,0.08); }
function sfxDie()     { [400,300,220,150].forEach(function(f,i){beep(f,'square',0.14,0.4,i*0.13);}); }
function sfxLevelUp() { [523,659,784,1047].forEach(function(f,i){beep(f,'square',0.15,0.28,i*0.1);}); }
function sfxRumble()  { beep(55,'sawtooth',0.18,0.35); beep(48,'square',0.16,0.25,0.06); }
function sfxSwoop()   { freqSlide(1400,500,'square',0.22,0.12); }
function sfxLavaLand(){ beep(90,'sawtooth',0.2,0.55); beep(140,'square',0.1,0.35,0.08); }

function sfxRawrSmall() {
  freqSlide(80, 200, 'sawtooth', 0.28, 0.45);
  freqSlide(60, 160, 'square',   0.28, 0.2, 0.02);
}
function sfxRawrBig() {
  freqSlide(55, 220, 'sawtooth', 0.55, 0.6);
  freqSlide(70, 280, 'sawtooth', 0.55, 0.4, 0.03);
  freqSlide(45, 180, 'square',   0.55, 0.3, 0.05);
  freqSlide(220, 80, 'sawtooth', 0.3,  0.35, 0.56);
}

// Music: the multivoice engine in audio.js plays each world's theme from
// docs/audio/theme_scores.js. ?music=v1 plays the old one-note songs below
// instead, for comparison.
var MUSIC_V1 = /[?&]music=v1\b/.test(location.search);
function worldTheme(lv) { return THEMES[Math.min(lv, THEMES.length - 1)].env; }

// Music alpha test: recorded tracks, played exactly as delivered (no tempo,
// pitch or arrangement changes). Cat made them the default (2026-10-18);
// the approved scored themes (Grasslands V4 etc.) stay one switch away for
// comparison over several runs. Switch: the MUSIC button on the title and
// game-over screens, the T key, or ?music=test / ?music=original. The choice
// is remembered on the device.
var MUSIC_TESTS = {
  0: { id:'folk-dance-d', name:'FOLK DANCE IN D', src:'assets/audio/experimental/trex_folk_D_developed.wav' },
  4: { id:'baroque',      name:'BAROQUE',         src:'assets/audio/experimental/trex_baroque_onbeat.wav' },
};
var musicTest = true;
try { musicTest = localStorage.getItem('trex-music-test') !== '0'; } catch (e) {}
if (/[?&]music=test\b/.test(location.search)) musicTest = true;
if (/[?&]music=original\b/.test(location.search)) musicTest = false;
function testTrack(lv) { return musicTest && !MUSIC_V1 ? MUSIC_TESTS[Math.min(lv, 4)] : null; }
function toggleMusicTest() {
  musicTest = !musicTest;
  try { localStorage.setItem('trex-music-test', musicTest ? '1' : '0'); } catch (e) {}
  if (state === ST.PLAY) playWorldMusic(levelIdx);
}
// The world's music: the experimental recording when testing, else the theme.
function playWorldMusic(lv, opts) {
  var tt = testTrack(lv);
  if (tt) Sound.playFile(tt.id, tt.src, Object.assign({}, opts, { onFail: function () { Sound.play(worldTheme(lv), opts); } }));
  else Sound.play(worldTheme(lv), opts);
}

// Old songs per level  [freq, duration, optionalHarmonyFreq]
const SONGS = [
  // L1 Grasslands – Old Time Battles inspired: G major march, martial and sprightly
  // G4=392 A4=440 B4=494 C5=523 D5=587 E5=659 G5=784 | bass: G3=196 D4=294
  [[392,.18,196],[440,.12],[494,.18],[587,.3,294],[0,.08],
   [494,.18,247],[440,.12],[392,.18],[494,.12],[587,.3,294],[0,.08],
   [659,.15,330],[587,.1],[523,.1],[494,.15],[440,.3,220],[0,.08],
   [392,.12,196],[440,.1],[392,.12],[494,.12],[392,.42,196],[0,.12],
   [784,.15,392],[659,.12],[784,.15],[659,.12],[587,.3,294],[0,.08],
   [523,.15,261],[494,.15],[523,.15],[494,.15],[440,.3,220],[0,.08],
   [392,.1],[440,.1],[494,.1],[523,.1],[587,.1],[659,.1],[784,.24,392],[0,.06],
   [659,.15,330],[587,.15,294],[494,.15,247],[392,.46,196],[0,.16]],

  // L2 Volcano – intense driving minor
  [[220,.1],[0,.05],[233,.1],[0,.05],[220,.1],[0,.05],[196,.2],[0,.1],[220,.1],[0,.05],[233,.1],[0,.05],[220,.1],[0,.05],[185,.3],[0,.15],
   [247,.1],[0,.05],[262,.1],[0,.05],[247,.1],[0,.05],[220,.2],[0,.1],[196,.1],[0,.05],[185,.1],[0,.05],[175,.4],[0,.2]],

  // L3 Desert – The Power inspired: A minor, sweeping and dramatic
  // A3=220 C4=262 D4=294 E4=330 G4=392 A4=440 B4=494 C5=523 D5=587 E5=659 G5=784 A5=880
  [[440,.34,220],[0,.08],[523,.22,261],[659,.32,330],[0,.08],[880,.5,440],[0,.14],
   [784,.26,392],[659,.2,330],[587,.2,294],[523,.4,261],[0,.12],
   [440,.34,220],[0,.08],[494,.22,247],[659,.32,330],[0,.08],[784,.5,392],[0,.14],
   [659,.24,330],[587,.2,294],[523,.2,261],[440,.56,220],[0,.18],
   [294,.2,147],[440,.26,220],[587,.32,294],[784,.5,392],[0,.12],
   [880,.34,440],[784,.22,392],[659,.22,330],[587,.46,294],[0,.14],
   [523,.2,261],[659,.2,330],[784,.2,392],[880,.2,440],[784,.36,392],[0,.08],
   [659,.26,330],[587,.2,294],[523,.2,261],[440,.58,220],[0,.2]],

  // L4 Swamp – Bard Dance inspired: D major jig, fast Celtic triplets
  // D4=294 E4=330 F#4=370 G4=392 A4=440 B4=494 D5=587 E5=659 F#5=740 A5=880
  [[587,.11],[659,.11],[587,.11],[440,.11],[494,.11],[440,.11],[587,.11],[494,.11],[440,.11],[392,.28],[0,.06],
   [370,.11],[440,.11],[494,.11],[587,.11],[659,.11],[587,.11],[494,.11],[440,.11],[370,.11],[440,.28],[0,.06],
   [440,.11],[494,.11],[587,.11],[659,.11],[587,.11],[494,.11],[440,.11],[392,.11],[370,.11],[330,.28],[0,.06],
   [294,.11],[370,.11],[440,.11],[494,.11],[587,.11],[494,.11],[440,.11],[370,.11],[330,.11],[294,.36],[0,.1],
   [880,.11],[740,.11],[659,.11],[587,.11],[659,.11],[740,.11],[880,.26],[0,.06],
   [740,.11],[659,.11],[587,.11],[494,.11],[587,.11],[659,.11],[740,.26],[0,.06],
   [587,.11],[494,.11],[440,.11],[370,.11],[440,.11],[494,.11],[587,.11],[494,.11],[440,.11],[370,.28],[0,.06],
   [330,.11],[370,.11],[440,.11],[494,.11],[440,.11],[370,.11],[294,.44],[0,.14]],

  // L5 Caverns (endless) – frantic
  [[523,.09],[0,.04],[587,.09],[0,.04],[659,.09],[0,.04],[698,.09],[0,.04],[659,.09],[0,.04],[587,.09],[0,.04],[523,.18],[0,.08],
   [440,.09],[0,.04],[494,.09],[0,.04],[523,.09],[0,.04],[587,.18],[0,.08],[440,.09],[0,.04],[415,.09],[0,.04],[440,.3],[0,.14]],
];

function chipNote(freq, dur) {
  var ac=getAC(), o=ac.createOscillator(), g=ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type='triangle'; o.frequency.value=freq;
  var t=ac.currentTime, rel=Math.max(dur*0.78, dur-0.05);
  g.gain.setValueAtTime(0.001,t);
  g.gain.linearRampToValueAtTime(0.18, t+0.012);  // fast attack
  g.gain.setValueAtTime(0.11, t+0.03);             // decay to sustain
  g.gain.setValueAtTime(0.11, t+rel);              // hold sustain
  g.gain.linearRampToValueAtTime(0.001, t+dur*0.97); // release
  o.start(t); o.stop(t+dur+0.02);
}

let musicOn=false, musicIdx=0, musicTimer=null, musicLevel=0;
function musicTick() {
  if (!musicOn) return;
  try {
    var song = SONGS[musicLevel] || SONGS[0];
    var note = song[musicIdx++ % song.length];
    if (note[0] > 0) chipNote(note[0], note[1]*0.88);
    musicTimer = setTimeout(musicTick, note[1]*1000);
  } catch(e) { musicTimer = setTimeout(musicTick, 250); }
}
function startMusic(lv) {
  if(!MUSIC_V1){ playWorldMusic(lv); return; }
  musicOn=true; musicLevel=Math.min(lv,SONGS.length-1); musicIdx=0;
  var ac=getAC();
  if(ac.state==='suspended'){ ac.resume().then(musicTick); } else { musicTick(); }
}
function stopMusic() { musicOn=false; clearTimeout(musicTimer); Sound.stop(); }

// ── Draw helpers ─────────────────────────────────────────────────
function R(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }

// ── Art registry ─────────────────────────────────────────────────
// Every sprite sheet and environment the engine knows about. Files live
// under assets/ (see docs/ASSET_SPEC.md); a sidecar <name>.json next to a
// PNG may override any of these defaults. Anything missing falls back to
// the placeholder pixel drawings below.
function anims(list){ // [name,row,frames,fps,loop?]
  var o={}; list.forEach(function(a){o[a[0]]={row:a[1],frames:a[2],fps:a[3],loop:a[4]!==false};}); return o;
}
// T-Rex atlas from the art team (Classic Arcade V03; trex_atlas.json supplies
// frame rects and fps). Anchor pins the feet (sprite row 56 = ground line, x 35
// between the legs, which puts the torso over the gameplay hitbox) to the
// bottom-centre of the player's box.
Assets.defineSprite('trex','assets/characters/trex/trex_atlas',{
  frameWidth:64, frameHeight:64, anchor:[35,56],
  animations:Object.assign(anims([['idle',0,4,5],['run',1,8,12],['jump',2,6,10,false],['fall',3,4,8],['land',4,4,10,false],
                    ['hurt',5,3,7,false],['eat',6,6,9,false],['celebrate',7,6,9,false]]),{
    // BITE snap (PR #16 brief): eat cells 1, 2, 4, 5 = gape, wide, snap/lunge, recover.
    // Interim until dedicated bite frames exist; 4 frames at 19fps = 0.21s.
    bite:{rects:[[64,384,64,64],[128,384,64,64],[256,384,64,64],[320,384,64,64]],frames:4,fps:19,loop:false}}),
  fallbacks:{idle:'run',jump:'run',fall:'jump',land:'run',bite:'eat',eat:'run',rawr:'idle',hurt:'idle',celebrate:'idle'}
});
// Pterodactyl atlas (32x32 cells, art faces right; drawn flipped since it flies
// toward the T-Rex). Anchor centres the body on the 30x15 gameplay box.
Assets.defineSprite('pterodactyl','assets/characters/pterodactyl/pterodactyl_atlas',{
  frameWidth:32, frameHeight:32, anchor:[18,23],
  animations:anims([['fly',0,6,10],['glide',1,4,5],['dive',2,4,12,false],['hurt',3,3,8,false],['eaten',4,4,12,false]]),
  fallbacks:{glide:'fly',attack:'dive',dive:'fly',frightened:'hurt',hurt:'fly',eaten:'hurt'}
});
// Caveman atlas (32x32 cells, faces right = running away from the T-Rex).
// Anchor puts the feet (sprite row 29, x 16) on the bottom-centre of the 14x22 box.
Assets.defineSprite('caveman','assets/characters/caveman/caveman_atlas',{
  frameWidth:32, frameHeight:32, anchor:[16,30],
  animations:anims([['run',0,8,12],['idle',1,4,5],['jump',2,6,9,false],['hurt',3,3,7,false],
                    ['caught',4,4,8,false],['defeated',5,4,7,false],['respawn',6,4,8,false]]),
  fallbacks:{panic:'run',idle:'run',jump:'run',stumble:'hurt',hurt:'run',caught:'run',defeated:'caught',respawn:'idle'}
});
Assets.defineSprite('small-dino','assets/characters/small-dino/small-dino',{
  frameWidth:24, frameHeight:24,
  animations:anims([['run',0,4,12],['panic',1,4,16],['caught',2,6,12,false]]),
  fallbacks:{panic:'run',caught:'panic'}
});
// Mama Stego (encounters.js chase), 96x64 cells facing right, feet on row 62.
Assets.defineSprite('mama-stego','assets/characters/mama-stego/mama_stego_atlas',{
  frameWidth:96, frameHeight:64, anchor:[48,62],
  animations:anims([['run',0,6,12],['stunned',1,4,8],['trip',2,5,10,false],['flinch',3,3,10,false]]),
  fallbacks:{stunned:'flinch',flinch:'run',trip:'run'}
});
// Volcano meteor (encounters.js), ChatGPT atlas PR #29: fall 48x48, impact 64x48,
// crater 48x16, warning 48x12; frames and pivots come from the JSON.
Assets.defineSprite('meteor','assets/effects/meteor/meteor_atlas',{frameWidth:48, frameHeight:48, animations:{}});
Assets.defineSprite('stegosaurus','assets/characters/stegosaurus/stegosaurus',{
  frameWidth:48, frameHeight:32,
  animations:anims([['run',0,4,8],['panic',1,4,12],['caught',2,6,12,false]]),
  fallbacks:{panic:'run',caught:'panic'}
});
// Obstacles: one row; frame size defaults to (image width / frames) x image height.
var OBS_SPRITE={
  cS:'cactus-small', cL:'cactus-large', rS:'rock-small', rL:'rock-large', gl:'log',
  st:'stump', mu:'mushroom', fl:'fern-log', iS:'ice-shard-small', iT:'ice-shard-tall',
  sb:'snowball', lS:'lava-rock-small', lL:'lava-rock-large', fg:'fire-geyser', pt:'pterodactyl',
  oS:'obsidian-spikes', cT:'charred-tree', sV:'steam-vent', lP:'lava-pool',
};
Object.keys(OBS_SPRITE).forEach(function(k){
  var id=OBS_SPRITE[k]; if(id==='pterodactyl')return;
  Assets.defineSprite(id,'assets/obstacles/'+id,{animations:anims([['idle',0,1,6]])});
});
// One-shot visual effects (nothing is drawn for these until art exists).
['dust','chomp','catch'].forEach(function(id){
  Assets.defineSprite('fx-'+id,'assets/fx/'+id,{animations:anims([['play',0,6,20,false]])});
});
// Parallax environments: layers are full canvas height (200px), tile horizontally.
var ENV_LAYERS=[
  {file:'sky.png',        speed:0},
  {file:'clouds.png',     speed:0.08, drift:0.1},
  {file:'far.png',        speed:0.12},
  {file:'mid.png',        speed:0.25},
  {file:'near.png',       speed:0.5},
  {file:'ground.png',     speed:1, ground:true},
  {file:'foreground.png', speed:1.4, z:'front'},
];
['grasslands','volcano','desert','swamp','caverns'].forEach(function(id){
  Assets.defineEnvironment(id,'assets/environments/'+id,ENV_LAYERS);
});
Assets.load();

// Draw a sprite, or run `placeholder()` if its art isn't loaded.
function drawArt(id,anim,x,y,w,h,placeholder,opts){
  if(!Assets.drawSprite(ctx,id,anim.name,anim.t,x,y,w,h,opts))placeholder();
}

// ── Effects (one-shot animations: eaten, caught, dust…) ──────────
var effects=[];
// Keeps an effect (e.g. the eaten pterodactyl) in the T-Rex's mouth as it moves.
function stickToMouth(e){ e.x=player.mouthX+player.mouthW/2-e.w/2; e.y=player.mouthY+player.mouthH/2-e.h/2; }
function spawnEffect(id,animName,x,y,w,h,vx,opts,follow){
  var n=Assets.animLength(id,animName);
  if(!isFinite(n))return; // no art for it: placeholder style just removes the entity
  var a=new Animator(animName);
  var e={id:id,anim:a,x:x,y:y,w:w,h:h,vx:vx||0,life:n,opts:opts,follow:follow,delay:0};
  effects.push(e);
  return e;
}
function updateAndDrawEffects(spd){
  effects.forEach(function(e){
    if(e.delay>0){e.delay--;return;} // queued behind another effect
    e.x-=e.vx?spd:0;
    if(e.follow)e.follow(e);
    Assets.drawSprite(ctx,e.id,e.anim.name,e.anim.t,e.x,e.y,e.w,e.h,e.opts);
    e.anim.update(); e.life--;
  });
  effects=effects.filter(function(e){return e.life>0;});
}

// ── T-Rex ────────────────────────────────────────────────────────
var DC = { g:'#38a048',d:'#1e6028',b:'#70d060',e:'#ffffff',p:'#000000',m:'#e03030' };
var DINO_H = PIX*14, DINO_W = PIX*10;
var BITE_CD = 22; // steps between bites (the snap itself lasts 14)

function drawDino(x,y,run,biting,jumping,rawring) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  R(x,     y+p*6,p*2,p*2,DC.d);
  R(x+p,   y+p*5,p*2,p,  DC.d);
  R(x+p*2, y+p*4,p,  p,  DC.g);
  R(x+p*2, y+p*3,p*6,p*5,DC.g);
  R(x+p*3, y+p*4,p*3,p*3,DC.b);
  R(x+p*6, y+p*5,p*2,p,  DC.d);
  R(x+p*5, y+p,  p*3,p*3,DC.g);
  R(x+p*4, y,    p*6,p*4,DC.g);
  R(x+p*8, y+p,  p,  p,  DC.e);
  R(x+p*8+1,y+p+1,p-1,p-1,DC.p);
  if (biting) {
    R(x+p*4,y+p*3,p*4,p,  DC.d);
    R(x+p*4,y+p*4,p*4,p*2,DC.d);
    R(x+p*5,y+p*4,p*2,p,  DC.m);
  } else if (rawring) {
    R(x+p*4,y+p*3,p*5,p*2,DC.d);
    R(x+p*5,y+p*3,p*2,p*2,DC.m);
  } else {
    R(x+p*4,y+p*3,p*5,p,  DC.d);
  }
  if (jumping) {
    R(x+p*4,y+p*9, p*5,p*2,DC.g);
    R(x+p*4,y+p*11,p*2,p,  DC.d);
    R(x+p*7,y+p*11,p*2,p,  DC.d);
  } else if (run===0) {
    R(x+p*4,y+p*9, p*2,p*3,DC.g); R(x+p*6,y+p*8, p*2,p*4,DC.g);
    R(x+p*4,y+p*12,p*2,p,  DC.d); R(x+p*6,y+p*11,p*3,p,  DC.d);
  } else {
    R(x+p*4,y+p*8, p*2,p*4,DC.g); R(x+p*6,y+p*9, p*2,p*3,DC.g);
    R(x+p*4,y+p*11,p*3,p,  DC.d); R(x+p*6,y+p*12,p*2,p,  DC.d);
  }
}

// ── Small Dino (chase target) ────────────────────────────────────
function drawSmallDino(x,y,f) {
  var p=2; x=Math.round(x); y=Math.round(y);
  R(x+p*4,y,    p*3,p*2,'#28a838'); R(x+p*6,y+p,p,'#fff');
  R(x+p*2,y+p*2,p*4,p*3,'#28a838'); R(x,y+p*3,p*3,p,'#145020');
  if (f===0){R(x+p*2,y+p*5,p,p*2,'#28a838');R(x+p*4,y+p*4,p,p*3,'#28a838');}
  else      {R(x+p*2,y+p*4,p,p*3,'#28a838');R(x+p*4,y+p*5,p,p*2,'#28a838');}
}

// ── Caveman (chase target) ───────────────────────────────────────
function drawCaveman(x,y,f) {
  var p=2; x=Math.round(x); y=Math.round(y);
  R(x+p,y+p*4,p*4,p*4,'#8b6020');
  R(x+p,y+p*4,p*4,p*2,'#e8b070');
  R(x,   y+p*4,p,  p*3,'#e8b070');
  R(x+p*5,y+p*3,p,p*4,'#e8b070');
  R(x+p*5,y,  p*2,p*4,'#6a3000');
  R(x+p*4,y,  p,  p*2,'#6a3000');
  R(x+p,y+p,  p*4,p*3,'#e8b070');
  R(x+p,y,    p*4,p,  '#4a2000');
  R(x+p*3,y+p*2,p,p,  '#000');
  if (f===0){R(x+p,y+p*8,p,p*2,'#8b6020');R(x+p*3,y+p*7,p,p*3,'#8b6020');}
  else      {R(x+p,y+p*7,p,p*3,'#8b6020');R(x+p*3,y+p*8,p,p*2,'#8b6020');}
  R(x+p,y+p*10,p*2,p,'#8b6020'); R(x+p*3,y+p*10,p*2,p,'#8b6020');
}

// ── Stegosaurus (chase target) ───────────────────────────────────
function drawStego(x,y,f) {
  var p=2; x=Math.round(x); y=Math.round(y);
  var c='#8b7040', d='#5a4020', pl='#cc3030', pk='#aa1818';
  // Plates along back (5 triangles)
  [p*4,p*6,p*8,p*10,p*12].forEach(function(px){
    ctx.fillStyle=pl; ctx.beginPath(); ctx.moveTo(x+px,y+p*3); ctx.lineTo(x+px+p,y); ctx.lineTo(x+px+p*2,y+p*3); ctx.fill();
    ctx.fillStyle=pk; ctx.beginPath(); ctx.moveTo(x+px+1,y+p*2); ctx.lineTo(x+px+p,y); ctx.lineTo(x+px+p*2-1,y+p*2); ctx.fill();
  });
  // Body
  R(x+p*2,y+p*3,p*13,p*4,c); R(x+p*3,y+p*3,p*11,p*2,d);
  // Head (right)
  R(x+p*13,y+p*2,p*3,p*3,c); R(x+p*15,y+p*3,p*2,p,d);
  ctx.fillStyle='#fff'; ctx.fillRect(x+p*14,y+p*2,p,p);
  ctx.fillStyle='#000'; ctx.fillRect(x+p*14+1,y+p*2+1,p-1,p-1);
  // Tail (left, spiked)
  R(x,y+p*4,p*3,p*2,c); R(x,y+p*3,p,p*2,d);
  // Two visible legs (alternating)
  if(f===0){R(x+p*5,y+p*7,p*2,p*3,d); R(x+p*11,y+p*6,p*2,p*4,d);}
  else     {R(x+p*5,y+p*6,p*2,p*4,d); R(x+p*11,y+p*7,p*2,p*3,d);}
}

// ── Obstacles ────────────────────────────────────────────────────
function drawCactus(x,y,big) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  if (big) {
    R(x+p*2,y,    p*2,p*9,'#0e4a10'); R(x,y+p*2,   p*2,p*4,'#0e4a10');
    R(x,    y+p*2,p*3,p*2,'#0e4a10'); R(x+p*4,y+p*3,p*2,p*3,'#0e4a10');
    R(x+p*4,y+p*3,p*3,p*2,'#0e4a10'); R(x+p,y+p*7, p*4,p*2,'#0e4a10');
    R(x+p*3,y,    p,  p*9,'#062006');
  } else {
    R(x+p,  y,    p*2,p*7,'#0e4a10');
    R(x,    y+p*2,p,  p*3,'#0e4a10'); R(x+p*3,y+p*3,p,p*2,'#0e4a10');
    R(x+p*2,y,    p,  p*7,'#062006');
  }
}
function drawRock(x,y,big) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  if (big){R(x+p,y+p*2,p*5,p*3,'#777');R(x+p*2,y,p*3,p*5,'#777');R(x+p*2,y,p*2,p*3,'#999');R(x+p,y+p*3,p*2,p*2,'#555');}
  else    {R(x+p,y+p,  p*3,p*2,'#777');R(x+p*2,y,p*2,p*3,'#777');R(x+p*2,y+p,p,p*2,'#999');}
}
function drawGrassLog(x,y) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  R(x,    y+p,  p*9,p*2,'#6a3a10');  // log body
  R(x,    y,    p*9,p,  '#8a5020');  // top highlight
  R(x,    y,    p*2,p*3,'#3a1a08'); // left end cap
  R(x+p*7,y,    p*2,p*3,'#3a1a08'); // right end cap
  ctx.fillStyle='#4a2808';
  ctx.fillRect(x+p*2,y+p,p,p); ctx.fillRect(x+p*4,y+p,p,p); ctx.fillRect(x+p*6,y+p,p,p);
}
function drawStump(x,y) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  R(x+p,y,    p*4,p*2,'#3a1a00');
  R(x,  y+p*2,p*6,p*5,'#5a2800');
  R(x,  y+p*2,p*2,p*5,'#7a3800');
  R(x+p*3,y,  p,  p*2,'#8a4800');
}
function drawMushroom(x,y) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  R(x+p*2,y+p*3,p*2,p*3,'#c8a070');
  R(x,    y,    p*6,p*4,'#cc2222');
  R(x+p,  y+p,  p,  p,  '#ffffff'); R(x+p*3,y+p,p,p,'#ffffff'); R(x+p*5,y+p*2,p,p,'#ffffff');
}
function drawFernLog(x,y) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  R(x,y+p*3,p*8,p*4,'#5a2800');
  R(x,y+p*3,p*8,p,'#7a3800');
  for(var i=0;i<4;i++){R(x+i*p*2,y,p*2,p*4,'#1a6010'); R(x+i*p*2+p,y+p,p,p*3,'#2a8020');}
}
function drawIceShard(x,y,tall) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  var h=tall?p*8:p*5;
  ctx.fillStyle='#a0e0ff';
  ctx.beginPath(); ctx.moveTo(x+p*2,y); ctx.lineTo(x+p*4,y+p*2); ctx.lineTo(x+p*5,y+h); ctx.lineTo(x,y+h); ctx.fill();
  ctx.fillStyle='#d0f8ff';
  ctx.beginPath(); ctx.moveTo(x+p*2,y); ctx.lineTo(x+p*3,y+p); ctx.lineTo(x+p,y+h); ctx.lineTo(x,y+h); ctx.fill();
}
function drawSnowball(x,y) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  ctx.fillStyle='#e8f8ff';
  ctx.beginPath(); ctx.arc(x+p*3,y+p*3,p*3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c0e8ff';
  ctx.beginPath(); ctx.arc(x+p*4,y+p*2,p*1.5,0,Math.PI*2); ctx.fill();
}
function drawLavaRock(x,y,big) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  if (big){
    R(x+p,y+p*2,p*5,p*4,'#333'); R(x+p*2,y,p*3,p*5,'#333');
    R(x+p*3,y,  p*2,p,  '#555'); R(x+p*2,y+p,p,p,'#555');
    R(x+p*2,y+p*4,p,p,'#ff6600'); R(x+p*4,y+p*3,p,p,'#ff4400');
  } else {
    R(x+p,  y+p,  p*3,p*3,'#333'); R(x+p*2,y,p*2,p*4,'#333');
    R(x+p*2,y+p*2,p,  p,  '#ff6600');
  }
}
function drawFireGeyser(x,y) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  R(x+p*2,y+p*4,p*2,p*4,'#333');
  R(x+p,  y+p*2,p*4,p*4,'#ff4400');
  R(x+p*2,y,    p*2,p*4,'#ff8800');
  R(x+p*2,y+p,  p*2,p*2,'#ffcc00');
}
function drawPtero(x,y,wingUp,tint) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  var c=tint||'#8b4010', w='#c06820', d='#5a2808';
  R(x+p*3,y+p*2,p*4,p*3,c); R(x+p*6,y+p,p*3,p*2,c); R(x+p*8,y+p,p*2,p,w); R(x+p*7,y+p,p,p,d);
  R(x+p*2,y+p*3,p*2,p*2,d);
  if (wingUp){R(x,y,p*3,p*2,w);R(x+p*2,y+p,p*3,p,c);R(x+p*7,y,p*3,p*2,w);R(x+p*5,y+p,p*3,p,c);}
  else       {R(x,y+p*3,p*3,p*2,w);R(x+p*2,y+p*2,p*3,p,c);R(x+p*7,y+p*3,p*3,p*2,w);R(x+p*5,y+p*2,p*3,p,c);}
}

// ── Level themes ─────────────────────────────────────────────────
var THEMES = [
  { name:'GRASSLANDS', env:'grasslands', num:'1',
    skyT:'#2060d0',skyB:'#60b0ff',hillB:'#2a7020',hillF:'#3a9030',
    gT:'#5a9020',gnd:'#6ab030',gTex:'#3a6010',
    obs:['cS','cL','rS','rL','gl','pt','rS','pt'], cloud:'#e8f4ff',
    drawExtra: function(sc){ drawGrassExtra(sc); }
  },
  { name:'VOLCANO', env:'volcano', num:'2', lava:true,
    skyT:'#200800',skyB:'#600808',hillB:'#2a0808',hillF:'#400808',
    gT:'#201008',gnd:'#180808',gTex:'#ff4400',
    obs:['lL','fg','pt','lB','oS','cT','sV','lP','pt','lS','oS','lP'], cloud:'#402010',
    // Ground set pieces (kind, gap px, kind, ...) mixed in for variety.
    combos:[['lS',6,'lL'],['lS',5,'lL',5,'lS'],['lL',150,'fg'],['lB',140,'lL'],['lS',4,'lB'],
            ['lP',4,'lS'],['oS',140,'lP'],['cT',150,'sV'],['lP',150,'oS'],['sV',6,'lS']],
    drawExtra: function(sc){ drawVolcanoExtra(sc); }
  },
  { name:'DESERT', env:'desert', num:'3',
    skyT:'#3080d0',skyB:'#a0d0f0',hillB:'#c08850',hillF:'#d8a868',
    gT:'#e0b070',gnd:'#c89050',gTex:'#a87038',
    obs:['cS','cL','rS','pt','rL','cS','pt'], cloud:'#fff4e0',
    drawExtra: function(sc){}
  },
  { name:'SWAMP', env:'swamp', num:'4',
    skyT:'#103830',skyB:'#2a6a60',hillB:'#1a4a40',hillF:'#245a4a',
    gT:'#2a5a3a',gnd:'#1e3a2a',gTex:'#3a6a4a',
    obs:['mu','fl','pt','gl','st','mu','pt'], cloud:'#80a8a0',
    drawExtra: function(sc){ drawForestExtra(sc); }
  },
  { name:'CAVERNS', env:'caverns', num:'∞',
    skyT:'#100820',skyB:'#301050',hillB:'#200828',hillF:'#301038',
    gT:'#202020',gnd:'#181818',gTex:'#ff00aa',
    obs:['iS','pt','st','iT','pt','rL','pt'], cloud:'#303050',
    drawExtra: function(sc){ drawEndlessExtra(sc); }
  },
];

// ── Background extras per level ───────────────────────────────────
function drawGrassExtra(sc) {
  // Grass blades
  ctx.fillStyle='#5aba20';
  for(var i=0;i<28;i++){var gx=((i*22-sc*0.15)%(W+30)+W+30)%(W+30)-15; ctx.fillRect(Math.round(gx),GROUND-3,2,5); ctx.fillRect(Math.round(gx)+4,GROUND-5,2,7);}
  // Wildflowers
  var fclr=['#ff4488','#ff8800','#ffdd00','#ee44ff','#44aaff'];
  for(var j=0;j<10;j++){
    var fx=((j*52-sc*0.12)%(W+60)+W+60)%(W+60)-30;
    ctx.fillStyle=fclr[j%5]; ctx.fillRect(Math.round(fx),GROUND-9,3,3);
    ctx.fillStyle='#ffff88'; ctx.fillRect(Math.round(fx)+1,GROUND-11,1,2);
    ctx.fillStyle='#5aba20'; ctx.fillRect(Math.round(fx)+1,GROUND-6,1,6);
  }
  // Birds (tiny V shapes far away)
  ctx.fillStyle='#1a3a7a';
  for(var b=0;b<5;b++){var bx2=((b*110-sc*0.05)%(W+80)+W+80)%(W+80)-40; var by=18+b*7; ctx.fillRect(Math.round(bx2),by,3,1); ctx.fillRect(Math.round(bx2)+4,by,3,1); ctx.fillRect(Math.round(bx2)+2,by+1,2,1);}
}
function drawForestExtra(sc) {
  var tsc=sc*0.45;
  [30,95,165,235,315,385,455].forEach(function(bx){
    var tx=((bx-tsc%(W+120)+W+120)%(W+120))-60;
    R(Math.round(tx)+8,GROUND-55,6,55,'#3a1a00');
    ctx.fillStyle='#0d2208'; ctx.beginPath(); ctx.arc(Math.round(tx)+11,GROUND-70,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a3d10'; ctx.beginPath(); ctx.arc(Math.round(tx)+9,GROUND-84,12,0,Math.PI*2); ctx.fill();
  });
  // Ground roots
  ctx.fillStyle='#3a1a00';
  for(var i=0;i<18;i++){var gx=((i*30-sc*0.15)%(W+40)+W+40)%(W+40)-20; ctx.fillRect(Math.round(gx),GROUND-2,8,3);}
  // Fireflies (glowing dotted line in sky)
  ctx.fillStyle='rgba(255,60,60,0.85)';
  for(var f=0;f<8;f++){var ffx=((f*68+sc*0.18)%(W+40)+W+40)%(W+40)-20; var ffy=GROUND*0.35+Math.sin((sc*0.018+f*0.9))*22+f*8; ctx.fillRect(Math.round(ffx),Math.round(ffy),2,2);}
}
function drawVolcanoExtra(sc) {
  var vsc=sc*0.18;
  // Glowing sky
  ctx.fillStyle='rgba(180,30,0,0.08)';
  for(var y=0;y<GROUND*0.5;y+=8){ctx.fillRect(0,y,W,4);}
  // Volcanoes
  [100,300].forEach(function(bx){
    var vx=((bx-vsc%(W+200)+W+200)%(W+200))-100;
    ctx.fillStyle='#180808'; ctx.beginPath(); ctx.moveTo(Math.round(vx)-70,GROUND); ctx.lineTo(Math.round(vx),GROUND-90); ctx.lineTo(Math.round(vx)+70,GROUND); ctx.fill();
    // Lava rim glow
    ctx.fillStyle='rgba(255,80,0,0.65)'; ctx.beginPath(); ctx.arc(Math.round(vx),GROUND-90,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,200,0,0.5)'; ctx.beginPath(); ctx.arc(Math.round(vx),GROUND-90,5,0,Math.PI*2); ctx.fill();
    // Smoke puffs rising
    for(var sp=0;sp<4;sp++){var soff=(sc*0.35+sp*40)%80; ctx.fillStyle='rgba(60,40,40,'+(0.35-sp*0.07)+')'; ctx.beginPath(); ctx.arc(Math.round(vx)+(sp%2?4:-4),GROUND-95-soff,4+sp*1.5,0,Math.PI*2); ctx.fill();}
  });
  // Lava rivers on ground
  ctx.fillStyle='rgba(255,60,0,0.4)';
  for(var i=0;i<10;i++){var gx=((i*50-sc*0.3)%(W+60)+W+60)%(W+60)-30; ctx.fillRect(Math.round(gx),GROUND+4,18,3); ctx.fillStyle='rgba(255,150,0,0.3)'; ctx.fillRect(Math.round(gx)+4,GROUND+5,8,2); ctx.fillStyle='rgba(255,60,0,0.4)';}
  // Embers floating
  ctx.fillStyle='rgba(255,130,0,0.7)';
  for(var e=0;e<10;e++){var ex=((e*55+sc*0.22)%(W+30)+W+30)%(W+30)-15; var ey=GROUND*0.2+Math.sin(sc*0.02+e*0.8)*25+e*12; if(ey>0&&ey<GROUND-10)ctx.fillRect(Math.round(ex),Math.round(ey),2,2);}
}
function drawEndlessExtra(sc) {
  // Stars + neon ground
  if (!drawEndlessExtra._s) { drawEndlessExtra._s=[]; for(var i=0;i<30;i++)drawEndlessExtra._s.push([Math.random()*W,Math.random()*GROUND*0.7]); }
  ctx.fillStyle='#ffffff';
  drawEndlessExtra._s.forEach(function(s){ctx.fillRect(s[0],s[1],1,1);});
  ctx.fillStyle='#ff00aa';
  for(var i=0;i<8;i++){var gx=((i*65-sc*0.5)%(W+80)+W+80)%(W+80)-40; ctx.fillRect(Math.round(gx),GROUND+3,6,3);}
}

// Background / ground
function drawFg(sc,th){ Assets.drawEnvironment(ctx,th.env,'front',sc,tick,W); }
var clouds=[{x:80,y:18,w:52},{x:260,y:28,w:38},{x:400,y:14,w:60}];
function drawBg(sc,th) {
  if(Assets.hasEnvironment(th.env)){
    R(0,0,W,H,th.skyB);
    Assets.drawEnvironment(ctx,th.env,'back',sc,tick,W);
    if(th.env==='volcano'&&state===ST.PLAY)drawVolcanoEruption(sc);
    return;
  }
  R(0,0,W,GROUND,th.skyT); R(0,GROUND*0.5,W,GROUND*0.5,th.skyB);
  var ms=sc*0.25;
  ctx.fillStyle=th.hillB;
  [80,200,340,440].forEach(function(bx){var mx=((bx-ms%(W+130)+W+130)%(W+130))-65; ctx.beginPath(); ctx.moveTo(mx-55,GROUND); ctx.lineTo(mx,GROUND-55); ctx.lineTo(mx+55,GROUND); ctx.fill();});
  ctx.fillStyle=th.hillF;
  [150,310,430].forEach(function(bx){var mx=((bx-ms%(W+130)+W+130)%(W+130))-65; ctx.beginPath(); ctx.moveTo(mx-38,GROUND); ctx.lineTo(mx,GROUND-38); ctx.lineTo(mx+38,GROUND); ctx.fill();});
  clouds.forEach(function(c){R(c.x,c.y+4,c.w,12,th.cloud);R(c.x+c.w*.2,c.y,c.w*.6,14,th.cloud);R(c.x+c.w*.1,c.y+2,c.w*.75,14,th.cloud);});
  th.drawExtra(sc);
}
function drawGround(sc,th) {
  if(Assets.environmentHasGround(th.env))return;
  R(0,GROUND,W,H-GROUND,th.gnd); R(0,GROUND,W,4,th.gT);
  ctx.fillStyle=th.gTex;
  for(var i=0;i<22;i++){var gx=((i*28-sc)%W+W)%W; ctx.fillRect(Math.round(gx),GROUND+8,14,2);}
  for(var j=0;j<16;j++){var gx2=((j*32+14-sc*0.7)%W+W)%W; ctx.fillRect(Math.round(gx2),GROUND+16,9,2);}
}

// ── Player ───────────────────────────────────────────────────────
var player = {
  x:55, y:GROUND-DINO_H, vy:0, onGround:true, jumps:0, MAX_JUMPS:2,
  rF:0, rT:0, biting:false, bT:0, rawring:false, raT:0, rawrSize:0, anim:new Animator('run'),

  get hitX(){return this.x+PIX*3;}, get hitY(){return this.y+PIX*2;},
  get hitW(){return PIX*6;},        get hitH(){return this.y+PIX*11-this.hitY;},
  // Mouth: where eaten prey is held. Bite zone: what a BITE can catch, from the
  // snout down to the feet so it reaches ground prey and head-height swoopers.
  get mouthX(){return this.x+24;},  get mouthY(){return this.y+4;},
  mouthW:18, mouthH:26,
  get biteX(){return this.x+22;},   get biteY(){return this.y+2;},
  biteW:24, get biteH(){return DINO_H-2;},
  biteCD:0,

  jump:function(){if(this.jumps<this.MAX_JUMPS){this.vy=-10;this.jumps++;sfxJump();Encounters.onJump();}},

  rawr:function(big){
    this.rawring=true; this.rawrSize=big?2:1; this.raT=big?50:28;
    if(big)sfxRawrBig(); else sfxRawrSmall();
  },

  // BITE button: snap the jaws. Prey in the bite zone during the snap is eaten.
  bite:function(){
    if(this.biteCD>0)return;
    this.biteCD=BITE_CD; this.biting=true; this.bT=14; sfxSnap();
    // Short 4-frame snap (~0.21s); a catch switches to the longer eat follow-through.
    var n=Assets.animLength('trex','bite'); if(isFinite(n))this.anim.playOnce('bite','run',n,true);
    if(navigator.vibrate)try{navigator.vibrate(12);}catch(e){}
  },
  // Successful catch: play the full eat animation (doesn't extend the bite window).
  chomp:function(){
    var n=Assets.animLength('trex','eat'); if(isFinite(n))this.anim.playOnce('eat','run',n,true);
  },

  triggerBite:function(){
    this.biting=true;this.bT=14;
    // The eat animation is longer than the gameplay bite window; let it finish.
    var n=Assets.animLength('trex','eat'); if(isFinite(n))this.anim.playOnce('eat','run',n,true);
  },

  update:function(){
    if(!this.onGround)this.vy+=0.65;
    this.y+=this.vy;
    var fl=GROUND-DINO_H;
    if(this.y>=fl){var wa=!this.onGround;this.y=fl;this.vy=0;this.onGround=true;this.jumps=0;if(wa){sfxLand();spawnEffect('fx-dust','play',this.x,GROUND-16,DINO_W,16,true,{center:true});
      var ln=Assets.animLength('trex','land'); if(isFinite(ln)&&!this.anim.locked)this.anim.playOnce('land','run',ln);}}
    else this.onGround=false;
    if(this.bT>0&&--this.bT===0)this.biting=false;
    if(this.biteCD>0)this.biteCD--;
    if(this.raT>0&&--this.raT===0)this.rawring=false;
    if(this.onGround){this.rT++;if(this.rT>=7){this.rT=0;this.rF=1-this.rF;}}
  },

  // pose: 'idle' / 'hurt' to override the gameplay-driven animation
  draw:function(pose){
    var a=pose||(this.biting?'bite':this.rawring?'rawr':!this.onGround?(this.vy<0?'jump':'fall'):'run');
    if(pose)this.anim.locked=false; // screen poses (game over, level done) win
    this.anim.play(a,a!=='run');
    var self=this;
    drawArt('trex',this.anim,this.x,this.y,DINO_W,DINO_H,function(){
      drawDino(self.x,self.y,self.rF,self.biting,!self.onGround,self.rawring);
    });
    this.anim.update();
    if(this.rawring){
      var bx=this.x+PIX*9, by=this.y-(this.rawrSize===2?22:16);
      var txt=this.rawrSize===2?'RAAAWR!':'RAWR!';
      var tw=ctx.measureText(txt).width+8;
      R(bx,by,tw,14,'#ffff88');
      ctx.strokeStyle='#cc8800'; ctx.lineWidth=1; ctx.strokeRect(bx,by,tw,14);
      ctx.fillStyle='#000'; ctx.font='bold '+(this.rawrSize===2?9:8)+'px monospace';
      ctx.textAlign='left'; ctx.fillText(txt,bx+4,by+10);
      if(this.rawrSize===2){
        // Stars burst
        ctx.fillStyle='#ffff00';
        for(var i=0;i<6;i++){var a=i/6*Math.PI*2,rd=16+this.raT; ctx.fillRect(bx+tw/2+Math.cos(a)*rd,by+7+Math.sin(a)*rd,3,3);}
      }
    }
  },

  reset:function(){
    this.x=55;this.y=GROUND-DINO_H;this.vy=0;this.onGround=true;this.jumps=0;
    this.rF=0;this.rT=0;this.biting=false;this.bT=0;this.biteCD=0;this.rawring=false;this.raT=0;this.anim=new Animator('run');
  }
};

// ── Obstacles & Enemies ──────────────────────────────────────────
var obstacles=[], chaseables=[], popups=[];
var spawnT=0, spawnI=90, spawnNext=90, chaseT=0, chaseI=300;
// SkiFree-style scatter: obstacles come at uneven gaps around the level's
// interval, with the odd breather, but never closer than a full jump plus
// landing room (32 steps), so the field looks hand-placed and stays fair.
function nextSpawnGap(){
  var g=spawnI*(0.75+Math.random()*0.6);
  if(Math.random()<0.12)g*=2;
  return Math.round(Math.max(32,g*Encounters.spawnScale()));
}

var OBJ = {
  cS:{w:PIX*5,h:PIX*10}, cL:{w:PIX*7,h:PIX*13},
  rS:{w:PIX*5,h:PIX*4},  rL:{w:PIX*9,h:PIX*8}, gl:{w:PIX*9,h:PIX*3},
  st:{w:PIX*6,h:PIX*7},  mu:{w:PIX*6,h:PIX*7}, fl:{w:PIX*8,h:PIX*7},
  iS:{w:PIX*5,h:PIX*5},  iT:{w:PIX*5,h:PIX*8}, sb:{w:PIX*6,h:PIX*6},
  lS:{w:PIX*5,h:PIX*5},  lL:{w:PIX*7,h:PIX*7}, fg:{w:PIX*6,h:PIX*8},
  lB:{w:32,h:30}, // landed lava bomb: the large lava rock drawn 1.6x
  // Volcano art PR #33. Boxes hug the solid part: the tree's trunk, the
  // vent's steam column (always puffing), the spikes. The lava pool is flat:
  // it only catches feet on the ground (see checkCollisions).
  oS:{w:16,h:32}, cT:{w:16,h:40}, sV:{w:14,h:26}, lP:{w:36,h:9},
  pt:{w:PIX*10,h:PIX*5},
};

// Pterodactyl flight heights (box top y), lowest first; level N uses the first N.
// All sit above the standing T-Rex's head, so they're prey you jump to catch.
var PTERO_TOPS=[GROUND-64,GROUND-80,GROUND-96];
// Swoopers dive at the T-Rex's head once they're close: jump and eat them, or
// they hit you. Chance per pterodactyl rises with the level.
var SWOOP_CHANCE=[0.3,0.35,0.4,0.45,0.5];
var SWOOP_START=170;          // px ahead of the T-Rex where the dive begins
var SWOOP_END=24;             // px ahead where it reaches head height
var SWOOP_TOP=GROUND-36;      // box top at the bottom of the dive (head/neck height)
function updateSwoop(o){
  if(!o.swoop||o.flee)return;
  var dx=o.x-player.x;
  if(!o.swooping){
    if(dx>SWOOP_START)return;
    o.swooping=true; o.swoopFromY=o.y; o.anim.playOnce('dive','dive',Infinity); sfxSwoop();
  }
  var p=Math.min(1,Math.max(0,(SWOOP_START-dx)/(SWOOP_START-SWOOP_END)));
  o.y=o.swoopFromY+(SWOOP_TOP-o.swoopFromY)*p*p; // accelerating dive
}
function spawnObs(th) {
  // Don't drop an obstacle right where a lava bomb is about to land.
  if(lavaRocks.some(function(r){return Math.abs(r.x-(W+30))<110;})){spawnT=spawnNext-15;return;}
  var kind=th.obs[Math.floor(Math.random()*th.obs.length)];
  var sz=OBJ[kind]||OBJ.cS;
  var oy=GROUND-sz.h;
  if(kind==='pt'){var numHts=Math.min(levelIdx+1,3); oy=PTERO_TOPS[Math.floor(Math.random()*numHts)];}
  // Some worlds mix in set pieces of several ground obstacles.
  if(kind!=='pt'&&th.combos&&Math.random()<0.4){
    var cb=th.combos[Math.floor(Math.random()*th.combos.length)], cx=W+20;
    for(var ci=0;ci<cb.length;ci+=2){
      var ck=cb[ci], cs=OBJ[ck];
      obstacles.push({kind:ck,x:cx,y:GROUND-cs.h,w:cs.w,h:cs.h,bitable:false,wT:0,wF:0,flee:false,anim:new Animator('idle')});
      cx+=cs.w+(cb[ci+1]||0);
    }
    spawnT=Math.min(spawnT,0)-Math.round((cx-W-20)/Math.max(gameSpeed,1)); // room after a long set piece
    return;
  }
  obstacles.push({kind:kind,x:W+20,y:oy,w:sz.w,h:sz.h,bitable:kind==='pt',wT:0,wF:0,flee:false,glide:false,swoop:kind==='pt'&&Math.random()<SWOOP_CHANCE[levelIdx],gT:60+Math.floor(Math.random()*90),anim:new Animator(kind==='pt'?'fly':'idle')});
  // Occasional paired ground obstacle
  if(!th.combos&&(kind==='cS'||kind==='st'||kind==='lS')&&Math.random()<0.28){
    var k2=th.obs.filter(function(t){return t!=='pt';})[0]||kind;
    var s2=OBJ[k2]||sz;
    obstacles.push({kind:k2,x:W+20+sz.w+PIX*5,y:GROUND-s2.h,w:s2.w,h:s2.h,bitable:false,wT:0,wF:0,flee:false,anim:new Animator('idle')});
  }
}

var CHASE_SPRITE={sd:'small-dino',cm:'caveman',sg:'stegosaurus'};
function spawnChase() {
  var r=Math.random(), kind=r<0.34?'sd':r<0.67?'cm':'sg';
  var sw=kind==='sd'?14:kind==='cm'?14:32;
  var sh=kind==='sd'?14:kind==='cm'?22:20;
  chaseables.push({kind:kind,x:W+50,y:GROUND-sh,w:sw,h:sh,rF:0,rT:0,vy:0,onGround:true,scared:false,anim:new Animator('run')});
}

function drawObstaclePlaceholder(o){
  switch(o.kind){
    case 'cS': drawCactus(o.x,o.y,false); break;
    case 'cL': drawCactus(o.x,o.y,true);  break;
    case 'rS': drawRock(o.x,o.y,false);   break;
    case 'rL': drawRock(o.x,o.y,true);    break;
    case 'gl': drawGrassLog(o.x,o.y);     break;
    case 'st': drawStump(o.x,o.y);         break;
    case 'mu': drawMushroom(o.x,o.y);      break;
    case 'fl': drawFernLog(o.x,o.y);       break;
    case 'iS': drawIceShard(o.x,o.y,false);break;
    case 'iT': drawIceShard(o.x,o.y,true); break;
    case 'sb': drawSnowball(o.x,o.y);      break;
    case 'lS': drawLavaRock(o.x,o.y,false);break;
    case 'lL': drawLavaRock(o.x,o.y,true); break;
    case 'fg': drawFireGeyser(o.x,o.y);    break;
    case 'pt': drawPtero(o.x,o.y,o.wF===0);break;
    // Volcano art fallbacks (only if the PNGs fail to load)
    case 'oS': R(o.x+3,o.y,10,o.h,'#1a1424'); R(o.x+6,o.y+6,3,12,'#7a5aa8'); break;
    case 'cT': R(o.x+4,o.y,8,o.h,'#2a1c1c'); R(o.x+6,o.y+12,2,14,'#ff6a1a'); break;
    case 'sV': R(o.x-4,GROUND-6,o.w+8,6,'#2a2228'); R(o.x+3,o.y,8,o.h-6,'rgba(220,215,225,0.8)'); break;
    case 'lP': R(o.x,o.y+3,o.w,6,'#ff7a1a'); R(o.x+4,o.y+4,o.w-8,2,'#ffd040'); break;
  }
}

function updateAndDrawObs(spd) {
  obstacles.forEach(function(o){
    o.x-=o.flee?spd+4:spd;
    if(o.kind==='pt'){o.wT++;if(o.wT>=10){o.wT=0;o.wF=1-o.wF;} if(o.flee)o.y-=3;}
    if(o.kind==='pt'){
      updateSwoop(o);
      // Alternate flapping and gliding; dive pose only while swooping.
      if(--o.gT<=0){o.glide=!o.glide&&Math.random()<0.6; o.gT=o.glide?50:80+Math.floor(Math.random()*60);}
      o.anim.play(o.flee?'frightened':o.glide?'glide':'fly',o.flee);
    }
    if(o.hot>0){ // a freshly landed lava bomb glows as it cools
      o.hot--; ctx.fillStyle='rgba(255,100,0,'+(o.hot/90*0.5)+')';
      ctx.beginPath(); ctx.ellipse(Math.round(o.x+o.w/2),GROUND-o.h/2,o.w*0.75,o.h*0.65,0,0,Math.PI*2); ctx.fill();
    }
    if(o.kind==='lB')drawLavaBomb(o.x+o.w/2,GROUND,o.anim);
    else drawArt(OBS_SPRITE[o.kind],o.anim,o.x,o.y,o.w,o.h,function(){drawObstaclePlaceholder(o);},o.kind==='pt'?{flipX:true}:null);
    o.anim.update();
  });
  obstacles=obstacles.filter(function(o){return o.x>-100&&o.y>-80;});
}

function updateAndDrawChase(spd) {
  chaseables.forEach(function(c){
    var baseSpd=c.kind==='sg'?spd*0.62:spd*0.55; // stego moves a bit faster (harder to catch)
    var mv=c.scared?spd+3.5:baseSpd;
    if(c.tripT>0){ // tripped: lies there, sliding away with the ground, then gets up
      c.tripT--; c.x-=spd; c.anim.play('hurt');
      drawArt(CHASE_SPRITE[c.kind],c.anim,c.x,c.y,c.w,c.h,function(){drawCaveman(c.x,c.y,0);});
      c.anim.update(); return;
    }
    c.x-=mv;
    // A caveman who runs into an obstacle trips over it (he misjudges some jumps).
    if(c.kind==='cm'&&c.y>GROUND-c.h-6&&!c.tripped)for(var ti=0;ti<obstacles.length;ti++){
      var to=obstacles[ti];
      if(to.kind==='pt'||to.flee)continue;
      if(hits(c.x+3,c.y,c.w-6,c.h,to.x+2,to.y+2,to.w-4,to.h-2)){
        c.tripT=60; c.tripped=true; c.y=GROUND-c.h; c.vy=0; c.onGround=true; c.anim.playOnce('hurt','run',60);
        addPopup(c.x+c.w/2,c.y-6,'OOF!','#ffd27a'); sfxLand(); return;
      }
    }
    if(c.kind==='cm'&&c.onGround){
      var mustJump=false;
      for(var oi=0;oi<obstacles.length;oi++){
        var ob=obstacles[oi];
        if(ob.kind==='pt'||ob.flee)continue;
        var gap=ob.x-(c.x+c.w);
        if(gap>0&&gap<60){mustJump=true;break;}
      }
      // Each caveman is either careful or clumsy; clumsy ones jump late and trip.
      if(c.clumsy===undefined)c.clumsy=Math.random()<0.35;
      if(c.clumsy)mustJump=false;
      if(mustJump||Math.random()<0.002){c.vy=-8;c.onGround=false;}
    }
    if(!c.onGround){c.vy+=0.5;c.y+=c.vy;var fl=GROUND-c.h;if(c.y>=fl){c.y=fl;c.onGround=true;c.vy=0;
      var sn=Assets.animLength(CHASE_SPRITE[c.kind],'stumble'); if(isFinite(sn)&&!c.scared&&Math.random()<0.3)c.anim.playOnce('stumble','run',sn);}}
    c.rT++;if(c.rT>=8){c.rT=0;c.rF=1-c.rF;}
    c.anim.play(spd===0?'idle':c.scared?'panic':!c.onGround?'jump':'run');
    drawArt(CHASE_SPRITE[c.kind],c.anim,c.x,c.y,c.w,c.h,function(){
      if(c.kind==='sd')drawSmallDino(c.x,c.y,c.rF);
      else if(c.kind==='sg')drawStego(c.x,c.y,c.rF);
      else drawCaveman(c.x,c.y,c.rF);
    });
    c.anim.update();
  });
  chaseables=chaseables.filter(function(c){return c.x>-80;});
}

// ── Lava eruption projectiles (Volcano only) ─────────────────────
// A lava bomb's landing spot glows on the ground ahead, the bomb drops onto
// it, and the cooling rock it leaves is a solid obstacle to jump. It always
// lands in front of the T-Rex (never behind), clear of other obstacles.
var lavaRocks=[], eruptT=0;
var BOMB_WARN=40, BOMB_G=0.42, BOMB_Y0=-34, BOMB_FALL=(function(){var y=BOMB_Y0,v=0,n=0;while(y<GROUND-30){v+=BOMB_G;y+=v;n++;}return n;})();
// The big lava rock art at 1.6x, bottom-centre at (cx, bottom).
function drawLavaBomb(cx,bottom,anim){
  ctx.save(); ctx.translate(Math.round(cx),Math.round(bottom)); ctx.scale(1.6,1.6);
  drawArt('lava-rock-large',anim,-PIX*3.5,-PIX*7,PIX*7,PIX*7,function(){drawLavaRock(-PIX*3.5,-PIX*7,true);});
  ctx.restore();
}

function spawnLavaBomb(spd){
  var steps=BOMB_WARN+BOMB_FALL;
  for(var tries=0;tries<4;tries++){
    var land=200+Math.random()*130;            // screen x when it lands
    var x0=land+spd*steps, clear=true;
    obstacles.forEach(function(o){ if(o.kind!=='pt'&&Math.abs(o.x+o.w/2-x0)<95)clear=false; });
    if(clear){ lavaRocks.push({x:x0,y:BOMB_Y0,vy:0,phase:'warn',timer:BOMB_WARN,anim:new Animator('idle')}); return; }
  }
}

function updateLavaRocks(spd,paused) {
  if(!paused)eruptT++; // no new eruptions during the boss
  var interval=Math.max(240, 420-tick*0.08);
  if(eruptT>=interval){ eruptT=0; if(!Encounters.blocksPrey())spawnLavaBomb(spd); }
  for(var i=lavaRocks.length-1;i>=0;i--){
    var r=lavaRocks[i], rx=Math.round(r.x);
    r.x-=spd;
    // Landing glow, brightening as the bomb gets close.
    var k=r.phase==='warn'?1-r.timer/BOMB_WARN:1, a=Math.min(1,(0.45+0.45*Math.abs(Math.sin(tick*0.25)))*(0.6+0.5*k));
    ctx.fillStyle='rgba(255,40,0,'+a+')'; ctx.fillRect(rx-22,GROUND-4,44,7); ctx.fillRect(rx-17,GROUND-6,34,11);
    ctx.fillStyle='rgba(255,210,60,'+a+')'; ctx.fillRect(rx-10,GROUND-3,20,5);
    if(r.phase==='warn'){
      if(--r.timer<=0){r.phase='fall'; sfxSwoop();}
    } else {
      r.vy+=BOMB_G; r.y+=r.vy;
      var ry=Math.round(r.y);
      // Flickering flame trail above the falling rock.
      for(var f=0;f<4;f++){
        var fw=14-f*3, fy=ry-f*11-(tick+f)%3;
        ctx.fillStyle=f<1?'rgba(255,220,80,0.9)':f<2?'rgba(255,140,20,0.8)':'rgba(230,50,10,'+(0.6-f*0.12)+')';
        ctx.fillRect(rx-fw/2+((tick>>1)+f)%2,fy-10,fw,10);
      }
      drawLavaBomb(rx,ry+30,r.anim);
      if(r.y>=GROUND-30){
        // Lands as a hot, solid boulder (a normal obstacle from here on).
        var sz=OBJ.lB;
        obstacles.push({kind:'lB',x:rx-sz.w/2,y:GROUND-sz.h,w:sz.w,h:sz.h,bitable:false,wT:0,wF:0,flee:false,hot:90,anim:new Animator('idle')});
        sfxLavaLand();
        for(var d=0;d<3;d++)spawnEffect('fx-dust','play',rx-16+d*16,GROUND-16,24,16,true,{center:true});
        lavaRocks.splice(i,1);
      }
    }
  }
}

// A bomb that falls straight onto the T-Rex counts as a hit.
function checkLavaCollision(){
  var mg=4, px=player.hitX+mg, py=player.hitY+mg, pw=player.hitW-mg*2, ph=player.hitH-mg*2;
  for(var i=0;i<lavaRocks.length;i++){
    var r=lavaRocks[i]; if(r.phase!=='fall')continue;
    if(hits(px,py,pw,ph, r.x-16+mg, r.y+mg, 32-mg*2, 30-mg*2))return true;
  }
  return false;
}

// Background eruptions: now and then the far volcano (far_hills layer,
// crater at x=248, y=91 in the 480-wide tile) throws up lava and smoke.
// Scenery only.
var bgErupt={parts:[],cool:240};
function drawVolcanoEruption(sc){
  var cx=((248-sc*0.18)%480+480)%480, cy=91;
  if(cx>460)cx-=480;
  var e=bgErupt;
  if(--e.cool<=0&&cx>40&&cx<440&&Math.random()<0.02){
    e.cool=360+Math.floor(Math.random()*360);
    for(var i=0;i<18;i++)e.parts.push({x:(Math.random()-0.5)*6,y:0,vx:(Math.random()-0.5)*1.6,vy:-1.6-Math.random()*1.8,life:60+Math.random()*40,c:Math.random()<0.4?'#ffd040':Math.random()<0.5?'#ff7a20':'#e83a10',smoke:false});
    for(var j=0;j<5;j++)e.parts.push({x:(Math.random()-0.5)*8,y:-4,vx:(Math.random()-0.5)*0.3,vy:-0.35-Math.random()*0.3,life:140,r:5+j*1.5,smoke:true});
    e.flash=30; sfxRumble();
  }
  if(e.flash>0){ e.flash--; ctx.fillStyle='rgba(255,140,40,'+(e.flash/30*0.6)+')'; ctx.beginPath(); ctx.arc(Math.round(cx),cy,10+(30-e.flash)*0.4,0,Math.PI*2); ctx.fill(); }
  e.parts=e.parts.filter(function(p){
    p.life--; p.x+=p.vx; p.y+=p.vy; if(!p.smoke)p.vy+=0.05; else p.r+=0.04;
    var px=cx+p.x, py=cy+p.y;
    if(p.life<=0||py>cy+22)return false;
    if(p.smoke){ ctx.fillStyle='rgba(150,125,130,'+Math.min(0.55,p.life/140*0.7)+')'; ctx.beginPath(); ctx.arc(Math.round(px),Math.round(py),p.r,0,Math.PI*2); ctx.fill(); }
    else { ctx.fillStyle=p.c; ctx.fillRect(Math.round(px)-1,Math.round(py)-1,p.life>30?3:2,p.life>30?3:2); }
    return true;
  });
}

// ── Collision ────────────────────────────────────────────────────
function hits(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}

// ?debug: collision boxes as the game actually tests them
function drawDebug(){
  ctx.lineWidth=1;
  ctx.strokeStyle='#ff00ff';
  ctx.strokeRect(player.hitX+5.5,player.hitY+5.5,player.hitW-11,player.hitH-11);
  ctx.strokeStyle='#ff4444';
  obstacles.forEach(function(o){ctx.strokeRect(o.x+5.5,o.y+5.5,o.w-11,o.h-11);});
  ctx.strokeStyle='#44ff44';
  chaseables.forEach(function(c){ctx.strokeRect(c.x+2.5,c.y-1.5,c.w-5,c.h+1);});
  ctx.strokeStyle=player.biting?'#ffff00':'rgba(255,255,0,0.35)';
  ctx.strokeRect(player.biteX+0.5,player.biteY+0.5,player.biteW-1,player.biteH-1);
}

function addPopup(x,y,txt,col){ popups.push({x:x,y:y,txt:txt,col:col||'#ffff00',life:36}); }

function checkCollisions() {
  var mg=5;
  var px=player.hitX+mg,py=player.hitY+mg,pw=player.hitW-mg*2,ph=player.hitH-mg*2;
  for(var i=obstacles.length-1;i>=0;i--){
    var o=obstacles[i];
    if(o.flee)continue;
    // A pterodactyl in the bite zone during a BITE is eaten (jump for high ones;
    // swoopers can be bitten from the ground). Removing it right away means it
    // can only score once.
    if(o.bitable&&player.biting&&hits(player.biteX,player.biteY,player.biteW,player.biteH,o.x+3,o.y+3,o.w-6,o.h-6)){
      obstacles.splice(i,1); player.chomp();
      spawnEffect('pterodactyl','eaten',o.x,o.y,o.w,o.h,false,{flipX:true},stickToMouth);
      spawnEffect('fx-chomp','play',o.x,o.y,o.w,o.h,false,{center:true},stickToMouth);
      score+=50; addPopup(o.x+o.w/2,o.y-4,'+50 CHOMP!','#ffee44'); sfxBite();
      continue;
    }
    if(o.kind==='lP'){ // lava pool: deadly only to feet on the ground
      if(player.y+DINO_H>GROUND-6&&px+pw>o.x+6&&px<o.x+o.w-6)return true;
      continue;
    }
    if(hits(px,py,pw,ph,o.x+mg,o.y+mg,o.w-mg*2,o.h-mg*2))return true;
  }
  for(var j=chaseables.length-1;j>=0;j--){
    var c=chaseables[j];
    // Prey is only caught by a BITE; running into it without biting just passes.
    if(player.biting&&hits(player.biteX,player.biteY,player.biteW,player.biteH,c.x+2,c.y-2,c.w-4,c.h+2)){
      chaseables.splice(j,1); player.chomp();
      // Into the T-Rex's mouth (like a pterodactyl): it struggles there, then gulp.
      spawnEffect(CHASE_SPRITE[c.kind],'caught',c.x,c.y,c.w,c.h,false,null,stickToMouth);
      spawnEffect('fx-chomp','play',c.x,c.y,c.w,c.h,false,{center:true},stickToMouth);
      var pts=c.kind==='cm'?40:c.kind==='sg'?35:25;
      score+=pts; addPopup(player.mouthX+8,player.y-6,'+'+pts+' CHOMP!','#88ff88'); sfxBite(); sfxCatch();
    }
  }
  return false;
}

// Small RAWR (tap / R): 1.5 s cooldown. Big RAWR (hold / E): 5 s cooldown,
// scares nearby pterodactyls and chaseables. Both can reveal or stun the boss.
function doRawr(big) {
  rawrCD=big?300:90; player.rawr(big);
  if(big){applyRawr(); Sound.duck(0.6);}
  Boss.onRawr(big); Encounters.onRawr(big);
}
function applyRawr() {
  obstacles.forEach(function(o){if(o.kind==='pt'&&o.x<player.x+160)o.flee=true;});
  chaseables.forEach(function(c){c.scared=true;});
}

// ── Score & HUD ──────────────────────────────────────────────────
var score=0, hiScore=parseInt(localStorage.getItem('trex-hi')||'0',10);
var scoreTick=0, flash=0;
function updateScore(){scoreTick++;if(scoreTick>=6){scoreTick=0;score++;}if(score%100===0&&score>0&&scoreTick===0){sfxPoints();flash=22;}}

// RAWR button state
var rawrCD=0, rawrHoldStart=0, rawrHolding=false;

function drawRawrBtn() {
  if(PAD)return; // the on-screen pad has its own RAWR button
  var bx=W-52,by=H-28;
  var ready=rawrCD===0;
  R(bx,by,48,24,ready?'rgba(200,100,0,0.88)':'rgba(80,40,0,0.7)');
  ctx.strokeStyle=ready?'#ffaa00':'#804000'; ctx.lineWidth=2; ctx.strokeRect(bx,by,48,24); ctx.lineWidth=1;
  ctx.textAlign='center'; ctx.font='bold 9px monospace';
  ctx.fillStyle=ready?'#ffff44':'#804000';
  ctx.fillText(ready?'RAWR!':'~'+Math.ceil(rawrCD/60)+'s',bx+24,by+15);
  ctx.textAlign='left';
}

// Music on/off (also the M key), under the level tag.
function drawMusicBtn() {
  var off=Sound.isMuted();
  R(2,17,16,13,'rgba(0,0,0,0.55)');
  ctx.fillStyle=off?'#777':'#ffff88'; ctx.font='bold 9px monospace'; ctx.textAlign='center';
  ctx.fillText('♪',10,27); ctx.textAlign='left';
  if(off){ctx.strokeStyle='#ff6666';ctx.beginPath();ctx.moveTo(4,28);ctx.lineTo(16,19);ctx.stroke();}
}
function isOnMusicBtn(ex,ey) {
  var r=canvas.getBoundingClientRect(), s=canvas.width/r.width;
  var cx=(ex-r.left)*s, cy=(ey-r.top)*s;
  return cx<22&&cy>14&&cy<34;
}

function isOnRawrBtn(ex,ey) {
  if(PAD)return false;
  var r=canvas.getBoundingClientRect(), s=canvas.width/r.width;
  var cx=(ex-r.left)*s, cy=(ey-r.top)*s;
  return cx>W-56&&cy>H-32;
}

function drawHUD(th,timeLeft) {
  // Level tag (top left)
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(2,2,84,13);
  ctx.font='bold 9px monospace'; ctx.textAlign='left';
  ctx.fillStyle='#fff'; ctx.fillText('LV'+th.num+' '+th.name,5,12);
  // Timer (top center)
  ctx.textAlign='center';
  if(isFinite(timeLeft)){
    var s2=Math.ceil(timeLeft/1000), mm=String(Math.floor(s2/60)).padStart(2,'0'), ss=String(s2%60).padStart(2,'0');
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(W/2-26,2,52,13);
    ctx.fillStyle=s2<30?'#ff5555':'#ffffff'; ctx.font='bold 9px monospace'; ctx.fillText(mm+':'+ss,W/2,12);
  } else {
    ctx.fillStyle='#ff88ff'; ctx.font='bold 8px monospace'; ctx.fillText('ENDLESS MODE',W/2,12);
  }
  // Score (top right)
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(W-78,2,76,13);
  ctx.textAlign='right'; ctx.font='8px monospace'; ctx.fillStyle='#9999ff'; ctx.fillText('HI:'+String(hiScore).padStart(5,'0'),W-3,9);
  ctx.font='bold 9px monospace'; ctx.fillStyle=flash>0?(flash%4<2?'#ffff00':'#fff'):'#ffff88'; ctx.fillText(String(score).padStart(5,'0'),W-3,19);
  if(flash>0)flash--;
  // Popups
  ctx.textAlign='center';
  popups=popups.filter(function(p){return p.life>0;});
  popups.forEach(function(p){
    ctx.globalAlpha=p.life/36; ctx.fillStyle=p.col; ctx.font='bold 9px monospace';
    ctx.fillText(p.txt,p.x,p.y-(36-p.life)*0.6); p.life--;
  });
  ctx.globalAlpha=1; ctx.textAlign='left';
  drawRawrBtn();
  drawMusicBtn();
}

// ── Game state ───────────────────────────────────────────────────
var ST={TITLE:0,PLAY:1,LVLDONE:2,DEAD:3,BOARD:4};
var deathCount=0;
var state=ST.TITLE;
var levelIdx=parseInt(localStorage.getItem('trex-lv')||'0',10);
if(levelIdx<0||levelIdx>4)levelIdx=0;
var scroll=0, tick=0, gameSpeed=4.0, bossTicks=0; // level timer is frozen during the boss
var STEP_MS=1000/60; // the game advances in fixed 60 Hz steps; level time is counted in steps

function resetLevel() {
  var cfg=LEVEL_CFG[levelIdx];
  player.reset();
  obstacles.length=0; chaseables.length=0; popups.length=0; lavaRocks.length=0; effects.length=0;
  Boss.reset(); Encounters.reset(); bossTicks=0;
  spawnT=0; spawnI=cfg.spawnI; spawnNext=cfg.spawnI; chaseT=0; scroll=0; tick=0; score=0; scoreTick=0; flash=0; rawrCD=0; eruptT=0;
  gameSpeed=cfg.speed;
}

// Music alpha test switch, top centre of the title and game-over screens.
function drawMusicTestBtn() {
  if(MUSIC_V1)return;
  var on=musicTest, x=W/2-85, y=22;
  R(x,y,170,15,on?'rgba(150,50,190,0.9)':'rgba(0,0,0,0.65)');
  ctx.strokeStyle=on?'#e0a0ff':'#999'; ctx.strokeRect(x+0.5,y+0.5,169,14);
  ctx.textAlign='center'; ctx.font='bold 8px monospace'; ctx.fillStyle='#fff';
  ctx.fillText(on?'♪ MUSIC: NEW  (tap for original V4)':'♪ MUSIC: ORIGINAL V4  (tap for new)',W/2,y+10);
  ctx.textAlign='left';
}
function isOnMusicTestBtn(ex,ey) {
  if(MUSIC_V1)return false;
  var r=canvas.getBoundingClientRect(), s=canvas.width/r.width;
  var cx=(ex-r.left)*s, cy=(ey-r.top)*s;
  return cx>W/2-90&&cx<W/2+90&&cy>18&&cy<41;
}
function isOnHallOfFameBtn(ex,ey) {
  var r=canvas.getBoundingClientRect(), s=canvas.width/r.width;
  var cx=(ex-r.left)*s, cy=(ey-r.top)*s;
  return cx>W/2-60&&cx<W/2+60&&cy>H/2+56&&cy<H/2+74;
}

function doTap(ex,ey) {
  goLandscape();
  getAC().state==='suspended'&&getAC().resume();
  if(state===ST.BOARD){
    boardFromDead=false; state=ST.TITLE; return;
  }
  if((state===ST.TITLE||state===ST.DEAD)&&ex!==undefined&&isOnMusicTestBtn(ex,ey)){ toggleMusicTest(); return; }
  if(state===ST.TITLE){
    if(ex!==undefined&&isOnHallOfFameBtn(ex,ey)){
      boardFromDead=false; state=ST.BOARD; loadBoard(); return;
    }
    function startGame(){ state=ST.PLAY; resetLevel(); startMusic(levelIdx); }
    if(!playerName){ askName(startGame); } else { startGame(); }
    return;
  }
  if(state===ST.DEAD){state=ST.PLAY;resetLevel();startMusic(levelIdx);return;}
  if(state===ST.LVLDONE){
    levelIdx=Math.min(levelIdx+1,4);
    localStorage.setItem('trex-lv',levelIdx);
    var savedScore=score;
    state=ST.PLAY; resetLevel(); score=savedScore; startMusic(levelIdx); return;
  }
  if(state===ST.PLAY){
    if(ex!==undefined&&isOnRawrBtn(ex,ey)){
      // handled in touch events
    } else {
      player.jump();
    }
  }
}

// Input
canvas.addEventListener('touchstart',function(e){
  e.preventDefault();
  var t=e.changedTouches[0];
  if(state!==ST.PLAY){doTap(t.clientX,t.clientY);return;}
  if(isOnMusicBtn(t.clientX,t.clientY)){Sound.toggleMute();return;}
  if(isOnRawrBtn(t.clientX,t.clientY)){
    rawrHolding=true; rawrHoldStart=performance.now();
  } else {
    player.jump();
  }
},{passive:false});

canvas.addEventListener('touchend',function(e){
  e.preventDefault();
  if(!rawrHolding)return;
  rawrHolding=false;
  if(rawrCD>0)return;
  var held=performance.now()-rawrHoldStart;
  doRawr(held>350);
},{passive:false});

canvas.addEventListener('mousedown',function(e){
  if(state===ST.PLAY&&isOnMusicBtn(e.clientX,e.clientY)){Sound.toggleMute();return;}
  if(state===ST.PLAY&&isOnRawrBtn(e.clientX,e.clientY)){rawrHolding=true;rawrHoldStart=performance.now();}
  else doTap(e.clientX,e.clientY);
});
canvas.addEventListener('mouseup',function(e){
  if(!rawrHolding)return;
  rawrHolding=false;
  if(state!==ST.PLAY||rawrCD>0)return;
  var held=performance.now()-rawrHoldStart;
  doRawr(held>350);
});
document.addEventListener('keydown',function(e){
  if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(state===ST.PLAY)player.jump();else doTap();}
  if(e.code==='KeyM')Sound.toggleMute();
  if(e.code==='KeyT')toggleMusicTest();
  if(e.code==='KeyH'&&state===ST.TITLE){boardFromDead=false;state=ST.BOARD;loadBoard();}
  // E (or X / F / Right) bites; R roars, hold R for a big RAWR (like the pad).
  if((e.code==='KeyE'||e.code==='KeyX'||e.code==='KeyF'||e.code==='ArrowRight')&&state===ST.PLAY){e.preventDefault();if(!e.repeat)player.bite();}
  if(e.code==='KeyR'&&state===ST.PLAY&&!e.repeat&&!rawrHolding){rawrHolding=true;rawrHoldStart=performance.now();}
});
document.addEventListener('keyup',function(e){
  if(e.code!=='KeyR'||!rawrHolding)return;
  rawrHolding=false;
  if(state!==ST.PLAY||rawrCD>0)return;
  doRawr(performance.now()-rawrHoldStart>350);
});

// On-screen buttons. Pointer events per button, so JUMP and BITE/RAWR can be
// held with different thumbs at once.
(function(){
  if(!PAD)return;
  function on(id,down,up){
    var el=document.getElementById(id);
    el.addEventListener('pointerdown',function(e){
      e.preventDefault(); el.classList.add('down');
      try{el.setPointerCapture(e.pointerId);}catch(_){}
      down();
    });
    function release(e){ if(!el.classList.contains('down'))return; el.classList.remove('down'); if(up)up(e.type==='pointerup'); }
    el.addEventListener('pointerup',release);
    el.addEventListener('pointercancel',release);
    el.addEventListener('contextmenu',function(e){e.preventDefault();});
  }
  on('bJump',function(){ if(state===ST.PLAY)player.jump(); else doTap(); });
  // Only JUMP starts / restarts, so mashing BITE as you crash can't skip the scores.
  on('bBite',function(){ if(state===ST.PLAY)player.bite(); });
  on('bRawr',function(){
    if(state!==ST.PLAY)return;
    rawrHolding=true; rawrHoldStart=performance.now();
  },function(ok){
    if(!rawrHolding)return;
    rawrHolding=false;
    if(!ok||state!==ST.PLAY||rawrCD>0)return;
    doRawr(performance.now()-rawrHoldStart>350);
  });
})();
document.getElementById('rotateAnyway').addEventListener('click',function(){
  uprightOK=true; try{sessionStorage.setItem('trex-upright','1');}catch(e){} resize();
});
// Reflect cooldowns and the big-RAWR charge on the buttons (only touches the DOM on change).
var padShown='';
function updatePad(){
  if(!PAD)return;
  var b=state===ST.PLAY&&player.biteCD>0, r=state===ST.PLAY&&rawrCD>0;
  var big=rawrHolding&&performance.now()-rawrHoldStart>350;
  var pr=state===ST.PLAY&&Encounters.prompting();
  var key=b+'|'+r+'|'+big+'|'+pr+'|'+(r?Math.ceil(rawrCD/60):0);
  if(key===padShown)return; padShown=key;
  document.getElementById('bBite').classList.toggle('cool',b);
  var rb=document.getElementById('bRawr');
  rb.classList.toggle('cool',r); rb.classList.toggle('big',big); document.getElementById('bJump').classList.toggle('pulse',pr);
  rb.querySelector('span').textContent=r?Math.ceil(rawrCD/60)+'s':big?'RAAAWR!':'RAWR';
  rb.querySelector('img').src='assets/ui/'+(big?'rawr_charged':'rawr')+'_64.png';
}

// ── Overlay screens ──────────────────────────────────────────────
var titleAnim=new Animator('idle');
function drawTitle() {
  if(Assets.hasEnvironment(THEMES[0].env)){ drawBg(0,THEMES[0]); drawGround(0,THEMES[0]); }
  else {
    R(0,0,W,GROUND,THEMES[0].skyT); R(0,GROUND*0.5,W,GROUND*0.5,THEMES[0].skyB);
    R(0,GROUND,W,H-GROUND,THEMES[0].gnd); R(0,GROUND,W,4,THEMES[0].gT);
  }
  drawArt('trex',titleAnim,50,GROUND-DINO_H,DINO_W,DINO_H,function(){drawDino(50,GROUND-DINO_H,0,false,false,false);});
  titleAnim.update();
  R(W/2-152,H/2-72,304,144,'rgba(0,10,40,0.82)');
  ctx.strokeStyle='#ffff44'; ctx.lineWidth=2; ctx.strokeRect(W/2-152,H/2-72,304,144); ctx.lineWidth=1;
  ctx.textAlign='center';
  ctx.fillStyle='#ffff44'; ctx.font='bold 24px monospace'; ctx.fillText('T-REX RUN!',W/2,H/2-48);
  ctx.fillStyle='#88ff88'; ctx.font='bold 8px monospace'; ctx.fillText('4 WORLDS + ENDLESS  ✦  JUMP ✦ BITE ✦ RAWR!',W/2,H/2-32);
  ctx.fillStyle='#ccc'; ctx.font='8px monospace';
  if(PAD){
    ctx.fillText('JUMP (tap twice = double jump)   BITE   RAWR',W/2,H/2-16);
  } else {
    ctx.fillText('SPACE jump   E bite   R rawr (hold R = big rawr)',W/2,H/2-16);
  }
  ctx.fillText('BITE pterodactyls (+50) - jump for the high ones!',W/2,H/2-2);
  ctx.fillText('BITE dinos (+25), stegos (+35) & cavemen (+40)',W/2,H/2+12);
  ctx.fillText('Hold RAWR for a BIG roar that scares everything',W/2,H/2+26);
  ctx.fillStyle='#88ffff'; ctx.font='bold 11px monospace'; ctx.fillText('TAP TO START',W/2,H/2+46);
  // Hall of Fame button
  R(W/2-60,H/2+56,120,18,'rgba(255,215,0,0.2)');
  ctx.strokeStyle='#ffd700'; ctx.lineWidth=1; ctx.strokeRect(W/2-60,H/2+56,120,18);
  ctx.fillStyle='#ffd700'; ctx.font='bold 9px monospace'; ctx.fillText('🏆 HALL OF FAME (H)',W/2,H/2+68);
  ctx.textAlign='left';
  drawMusicTestBtn();
}

function drawLevelDone(th) {
  R(W/2-130,H/2-50,260,100,'rgba(0,20,0,0.85)');
  ctx.strokeStyle='#44ff44'; ctx.lineWidth=2; ctx.strokeRect(W/2-130,H/2-50,260,100); ctx.lineWidth=1;
  ctx.textAlign='center';
  ctx.fillStyle='#44ff44'; ctx.font='bold 16px monospace'; ctx.fillText('LEVEL COMPLETE!',W/2,H/2-26);
  ctx.fillStyle='#ffff88'; ctx.font='9px monospace'; ctx.fillText('Score this level: '+score,W/2,H/2-8);
  var next=THEMES[levelIdx+1];
  ctx.fillStyle='#aaffaa'; ctx.fillText('Next: '+(next?next.name:'—'),W/2,H/2+8);
  ctx.fillStyle='#88ff88'; ctx.font='bold 10px monospace'; ctx.fillText('TAP TO CONTINUE',W/2,H/2+32);
  ctx.textAlign='left';
}

function drawDead() {
  R(W/2-112,H/2-44,224,88,'rgba(40,0,0,0.85)');
  ctx.strokeStyle='#ff4444'; ctx.lineWidth=2; ctx.strokeRect(W/2-112,H/2-44,224,88); ctx.lineWidth=1;
  ctx.textAlign='center';
  ctx.fillStyle='#ff4444'; ctx.font='bold 17px monospace'; ctx.fillText('GAME OVER',W/2,H/2-20);
  ctx.fillStyle='#ffff88'; ctx.font='9px monospace';
  var isHi=score>=hiScore&&score>0;
  ctx.fillText('Score: '+score+(isHi?' ★ NEW BEST!':''),W/2,H/2-4);
  ctx.fillStyle='#aaa'; ctx.font='8px monospace'; ctx.fillText('Loading leaderboard...',W/2,H/2+10);
  ctx.fillStyle='#88ff88'; ctx.font='bold 10px monospace'; ctx.fillText('TAP TO RETRY',W/2,H/2+28);
  ctx.textAlign='left';
  drawMusicTestBtn();
}

function drawStarburst(cx,cy,outerR,innerR,pts){
  ctx.beginPath();
  for(var i=0;i<pts*2;i++){
    var a=i*Math.PI/pts-Math.PI/2;
    var r=i%2===0?outerR:innerR;
    if(i===0)ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
    else ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
  }
  ctx.closePath(); ctx.fill();
}

function drawBoard() {
  R(0,0,W,H,'rgba(0,0,20,0.96)');
  ctx.textAlign='center';
  // Title
  ctx.fillStyle='#ffd700'; ctx.font='bold 15px monospace'; ctx.fillText('🏆 HALL OF FAME 🏆',W/2,18);
  ctx.fillStyle='#555'; ctx.font='8px monospace'; ctx.fillText('TOP 10 ALL DEVICES',W/2,30);
  // Divider
  ctx.fillStyle='#ffd700'; ctx.fillRect(W/2-120,34,240,1);

  if (!boardReady) {
    ctx.fillStyle='#aaa'; ctx.font='9px monospace'; ctx.fillText('Loading...',W/2,H/2);
  } else if (boardError) {
    ctx.fillStyle='#ff8888'; ctx.font='9px monospace'; ctx.fillText("Couldn't reach the leaderboard.",W/2,H/2-6);
    ctx.fillStyle='#aaa'; ctx.fillText('Check your connection and try again.',W/2,H/2+8);
  } else if (topScores.length===0) {
    ctx.fillStyle='#aaa'; ctx.font='9px monospace'; ctx.fillText('No scores yet — be the first!',W/2,H/2);
  } else {
    var medals=['🥇','🥈','🥉'];
    topScores.forEach(function(s,i){
      var y=48+i*14;
      var isMe=boardFromDead&&s.score===lastScore&&s.name===playerName;
      ctx.fillStyle= i===0?'#ffd700': i===1?'#c0c0c0': i===2?'#cd7f32': isMe?'#88ff88':'#dddddd';
      ctx.font=(isMe?'bold ':'')+'9px monospace';
      var medal=i<3?medals[i]:(i+1)+'.';
      var nameStr=String(s.name||'?').substring(0,10);
      var pts=String(s.score).padStart(5,'0');
      ctx.fillText(medal+' '+nameStr+'  '+pts,W/2,y);
    });
  }

  // Your-score starburst badge on the left
  if(boardFromDead){
    var cx=58, cy=102;
    ctx.fillStyle='rgba(255,200,0,0.18)'; drawStarburst(cx,cy,54,42,18); // outer glow
    ctx.fillStyle='#aa7700';             drawStarburst(cx,cy,48,36,18); // dark gold ring
    ctx.fillStyle='#ffcc00';             drawStarburst(cx,cy,43,32,18); // bright gold
    ctx.fillStyle='#0d0d00';
    ctx.beginPath(); ctx.arc(cx,cy,28,0,Math.PI*2); ctx.fill();         // dark centre
    ctx.strokeStyle='#ffcc00'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(cx,cy,28,0,Math.PI*2); ctx.stroke();       // inner ring
    ctx.lineWidth=1;
    ctx.fillStyle='#ffcc00'; ctx.font='bold 6px monospace';
    ctx.fillText('YOUR',cx,cy-13);
    ctx.fillText('SCORE',cx,cy-5);
    ctx.fillStyle='#ffffff'; ctx.font='bold 12px monospace';
    ctx.fillText(String(lastScore),cx,cy+8);
    if(playerName){
      ctx.fillStyle='#88ff88'; ctx.font='6px monospace';
      ctx.fillText(playerName.substring(0,9),cx,cy+19);
    }
  }

  ctx.fillStyle='#333'; ctx.fillRect(W/2-120,H-34,240,1);
  ctx.fillStyle='#88ffff'; ctx.font='bold 10px monospace';
  ctx.fillText(boardFromDead?'TAP TO PLAY AGAIN':'TAP TO GO BACK',W/2,H-8);
  ctx.textAlign='left';
}

// ── Main loop ────────────────────────────────────────────────────
// Run the game in fixed 60 Hz steps whatever the display's refresh rate
// (120 Hz screens used to play at double speed). A long gap (hidden tab,
// stall) counts as one step, so the level timer pauses with the game.
var lastFrame=0, stepAcc=0;
function loop(now) {
  requestAnimationFrame(loop);
  if(rotatePrompt()){lastFrame=now;return;} // paused while asking to rotate
  var dt=lastFrame?now-lastFrame:STEP_MS;
  lastFrame=now;
  if(dt>250)dt=STEP_MS;
  stepAcc+=dt;
  // Small tolerance so 60 Hz displays with timing jitter still step every frame.
  for(var n=0;stepAcc>=STEP_MS-1&&n<4;n++){stepAcc-=STEP_MS;step();}
  updatePad();
  if(stepAcc>STEP_MS*4)stepAcc=0;
}
function step() {
  var th=THEMES[levelIdx];

  if(state===ST.TITLE){drawTitle();return;}

  drawBg(scroll,th);
  drawGround(scroll,th);

  if(state===ST.PLAY){
    tick++; scroll+=gameSpeed;
    clouds.forEach(function(c){c.x-=gameSpeed*0.12;if(c.x<-(c.w+20))c.x=W+20;});

    var lcfg=LEVEL_CFG[levelIdx];
    Boss.maybeStart(tick);
    if(Boss.active())bossTicks++;
    else{ // the boss encounter replaces random obstacles and prey
      Encounters.tick(tick);
      spawnT++;if(spawnT>=spawnNext){spawnT=0;if(levelIdx>=3)spawnI=Math.max(lcfg.minSpawnI,spawnI-1);spawnObs(th);spawnNext=nextSpawnGap();}
      if(!Encounters.blocksPrey()){chaseT++;if(chaseT>=chaseI){chaseT=0;spawnChase();}}
    }
    if(levelIdx>=3&&tick%280===0)gameSpeed=Math.min(levelIdx===4?22:13,gameSpeed+0.35);
    if(rawrCD>0)rawrCD--;

    Encounters.drawBack(gameSpeed);
    updateAndDrawObs(gameSpeed);
    updateAndDrawChase(gameSpeed);
    Encounters.drawFront(gameSpeed);
    Boss.update(gameSpeed); Boss.draw();
    if(th.lava)updateLavaRocks(gameSpeed,Boss.active());
    player.update(); player.draw();
    updateAndDrawEffects(gameSpeed);
    drawFg(scroll,th);
    if(Assets.debug)drawDebug();
    updateScore();
    var lvDur=LEVEL_CFG[levelIdx].dur;
    var played=(tick-bossTicks)*STEP_MS;
    drawHUD(th,Math.max(0,lvDur-played));
    if(Boss.active()){R(W/2-52,17,104,11,'rgba(0,0,0,0.55)');ctx.textAlign='center';ctx.font='bold 8px monospace';ctx.fillStyle='#d8b8ff';ctx.fillText('BOSS: PHANTOM RAPTOR',W/2,25);ctx.textAlign='left';}

    // Level complete check (not endless)
    if(levelIdx<4&&played>=lvDur&&!Boss.active()&&!Encounters.blocksPrey()){ // let a chase finish first
      state=ST.LVLDONE; sfxLevelUp(); stopMusic();
      if(score>hiScore){hiScore=score;localStorage.setItem('trex-hi',hiScore);}
    }
    Boss.checkNom();
    if(state===ST.PLAY&&(checkCollisions()||Encounters.caught()||(th.lava&&checkLavaCollision()))){
      sfxDie(); stopMusic();
      if(score>hiScore){hiScore=score;localStorage.setItem('trex-hi',hiScore);}
      lastScore=score;
      levelIdx=0; localStorage.setItem('trex-lv',0);
      // Submit score then show board
      // Only if the player is still on the game-over screen (a quick tap restarts the run).
      var run=++deathCount;
      function goToBoard(){ if(state!==ST.DEAD||run!==deathCount)return; boardFromDead=true; state=ST.BOARD; loadBoard(); }
      if(!playerName){
        state=ST.DEAD;
        askName(function(){ submitScore(playerName,lastScore,goToBoard); });
      } else {
        state=ST.DEAD;
        // Board after at least 1.2 s on the game-over screen and once the score is saved.
        var waits=2, next=function(){ if(--waits===0)goToBoard(); };
        submitScore(playerName,lastScore,next);
        setTimeout(next, 1200);
        setTimeout(goToBoard, 4000); // don't wait on a slow server forever
      }
    }
  }

  if(state===ST.LVLDONE){updateAndDrawObs(0);updateAndDrawChase(0);player.draw('celebrate');updateAndDrawEffects(0);drawFg(scroll,th);drawLevelDone(th);}
  if(state===ST.DEAD){player.draw('hurt');drawFg(scroll,th);drawDead();}
  if(state===ST.BOARD){drawBoard();}
}
requestAnimationFrame(loop);
