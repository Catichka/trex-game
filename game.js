'use strict';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = 480, H = 200, GROUND = 152, PIX = 3;
const LEVEL_MS = 5 * 60 * 1000;

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width  = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// ── Audio ────────────────────────────────────────────────────────
let AC = null;
function getAC() { return AC || (AC = new (window.AudioContext || window.webkitAudioContext)()); }

function beep(freq, type, dur, vol, delay) {
  vol = vol || 0.25; delay = delay || 0;
  const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type; o.frequency.value = freq;
  const t = ac.currentTime + delay;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}
function freqSlide(s, e, type, dur, vol, delay) {
  vol = vol || 0.4; delay = delay || 0;
  const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
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
function sfxBite()    { beep(110,'sawtooth',0.07,0.55); beep(75,'sawtooth',0.09,0.45,0.07); }
function sfxCatch()   { beep(600,'square',0.07,0.25); beep(800,'square',0.07,0.25,0.08); beep(1050,'square',0.07,0.25,0.16); }
function sfxPoints()  { beep(880,'square',0.06,0.18); beep(1100,'square',0.06,0.18,0.08); }
function sfxDie()     { [400,300,220,150].forEach(function(f,i){beep(f,'square',0.14,0.4,i*0.13);}); }
function sfxLevelUp() { [523,659,784,1047].forEach(function(f,i){beep(f,'square',0.15,0.28,i*0.1);}); }

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

// Songs per level
const SONGS = [
  // L1 Grasslands – bright
  [[392,.15],[0,.04],[440,.15],[0,.04],[392,.12],[523,.22],[0,.08],[392,.14],[0,.04],[349,.14],[0,.04],[392,.3],[0,.1],
   [440,.14],[0,.04],[494,.14],[0,.04],[440,.1],[523,.22],[0,.08],[440,.14],[0,.04],[392,.3],[0,.2],
   [523,.14],[0,.04],[587,.14],[0,.04],[523,.1],[659,.22],[0,.08],[523,.14],[0,.04],[494,.14],[0,.04],[523,.3],[0,.1],
   [587,.14],[0,.04],[659,.14],[0,.04],[698,.18],[659,.18],[0,.08],[523,.14],[0,.04],[440,.14],[0,.04],[392,.4],[0,.15]],
  // L2 Forest – mysterious
  [[330,.22],[0,.1],[370,.22],[0,.1],[330,.44],[0,.15],[294,.22],[0,.1],[330,.22],[0,.1],[294,.44],[0,.15],
   [370,.22],[0,.1],[415,.22],[0,.1],[440,.44],[0,.15],[415,.22],[0,.1],[370,.22],[0,.1],[330,.66],[0,.2]],
  // L3 Ice – slow crystalline
  [[528,.3],[0,.12],[594,.3],[0,.12],[528,.22],[0,.18],[440,.3],[0,.12],[494,.3],[0,.12],[440,.6],[0,.2],
   [594,.28],[0,.1],[660,.28],[0,.1],[740,.28],[0,.1],[660,.6],[0,.2],[528,.2],[0,.1],[594,.2],[0,.1],[660,.2],[0,.1],[528,.6],[0,.3]],
  // L4 Volcano – intense minor
  [[220,.1],[0,.05],[233,.1],[0,.05],[220,.1],[0,.05],[196,.2],[0,.1],[220,.1],[0,.05],[233,.1],[0,.05],[220,.1],[0,.05],[185,.3],[0,.15],
   [247,.1],[0,.05],[262,.1],[0,.05],[247,.1],[0,.05],[220,.2],[0,.1],[196,.1],[0,.05],[185,.1],[0,.05],[175,.4],[0,.2]],
  // L5 Endless – frantic
  [[523,.09],[0,.04],[587,.09],[0,.04],[659,.09],[0,.04],[698,.09],[0,.04],[659,.09],[0,.04],[587,.09],[0,.04],[523,.18],[0,.08],
   [440,.09],[0,.04],[494,.09],[0,.04],[523,.09],[0,.04],[587,.18],[0,.08],[440,.09],[0,.04],[415,.09],[0,.04],[440,.3],[0,.14]],
];

let musicOn=false, musicIdx=0, musicTimer=null, musicLevel=0;
function musicTick() {
  if (!musicOn) return;
  const song = SONGS[musicLevel] || SONGS[0];
  const note = song[musicIdx++ % song.length];
  if (note[0] > 0) beep(note[0], 'square', note[1]*0.82, 0.12);
  musicTimer = setTimeout(musicTick, note[1]*1000);
}
function startMusic(lv) { musicOn=true; musicLevel=Math.min(lv,SONGS.length-1); musicIdx=0; musicTick(); }
function stopMusic()    { musicOn=false; clearTimeout(musicTimer); }

// ── Draw helpers ─────────────────────────────────────────────────
function R(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }

// ── T-Rex ────────────────────────────────────────────────────────
var DC = { g:'#38a048',d:'#1e6028',b:'#70d060',e:'#ffffff',p:'#000000',m:'#e03030' };
var DINO_H = PIX*14, DINO_W = PIX*10;

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

// ── Obstacles ────────────────────────────────────────────────────
function drawCactus(x,y,big) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  if (big) {
    R(x+p*2,y,    p*2,p*9,'#207020'); R(x,y+p*2,   p*2,p*4,'#207020');
    R(x,    y+p*2,p*3,p*2,'#207020'); R(x+p*4,y+p*3,p*2,p*3,'#207020');
    R(x+p*4,y+p*3,p*3,p*2,'#207020'); R(x+p,y+p*7, p*4,p*2,'#207020');
    R(x+p*3,y,    p,  p*9,'#104010');
  } else {
    R(x+p,  y,    p*2,p*7,'#207020');
    R(x,    y+p*2,p,  p*3,'#207020'); R(x+p*3,y+p*3,p,p*2,'#207020');
    R(x+p*2,y,    p,  p*7,'#104010');
  }
}
function drawRock(x,y,big) {
  var p=PIX; x=Math.round(x); y=Math.round(y);
  if (big){R(x+p,y+p*2,p*5,p*3,'#777');R(x+p*2,y,p*3,p*5,'#777');R(x+p*2,y,p*2,p*3,'#999');R(x+p,y+p*3,p*2,p*2,'#555');}
  else    {R(x+p,y+p,  p*3,p*2,'#777');R(x+p*2,y,p*2,p*3,'#777');R(x+p*2,y+p,p,p*2,'#999');}
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
  { name:'GRASSLANDS', num:'1',
    skyT:'#2060d0',skyB:'#60b0ff',hillB:'#2a7020',hillF:'#3a9030',
    gT:'#5a9020',gnd:'#6ab030',gTex:'#3a6010',
    obs:['cS','cL','pt'], cloud:'#e8f4ff',
    drawExtra: function(sc){ drawGrassExtra(sc); }
  },
  { name:'DARK FOREST', num:'2',
    skyT:'#080e04',skyB:'#142808',hillB:'#0a1806',hillF:'#142e0a',
    gT:'#3a1a00',gnd:'#2a1200',gTex:'#5a2800',
    obs:['st','mu','fl','pt'], cloud:'#202820',
    drawExtra: function(sc){ drawForestExtra(sc); }
  },
  { name:'ICE WORLD', num:'3',
    skyT:'#102840',skyB:'#2060a0',hillB:'#508090',hillF:'#80b8c8',
    gT:'#d0eeff',gnd:'#b0d8f0',gTex:'#90c0e0',
    obs:['iS','iT','sb','pt'], cloud:'#c8e8ff',
    drawExtra: function(sc){ drawIceExtra(sc); }
  },
  { name:'VOLCANO', num:'4',
    skyT:'#200800',skyB:'#600808',hillB:'#2a0808',hillF:'#400808',
    gT:'#201008',gnd:'#180808',gTex:'#ff4400',
    obs:['lS','lL','fg','pt'], cloud:'#402010',
    drawExtra: function(sc){ drawVolcanoExtra(sc); }
  },
  { name:'ENDLESS!', num:'∞',
    skyT:'#100820',skyB:'#301050',hillB:'#200828',hillF:'#301038',
    gT:'#202020',gnd:'#181818',gTex:'#ff00aa',
    obs:['cS','cL','st','iT','lL','fg','pt'], cloud:'#303050',
    drawExtra: function(sc){ drawEndlessExtra(sc); }
  },
];

// ── Background extras per level ───────────────────────────────────
function drawGrassExtra(sc) {
  ctx.fillStyle='#5aba20';
  for(var i=0;i<28;i++){var gx=((i*22-sc*0.15)%(W+30)+W+30)%(W+30)-15; ctx.fillRect(Math.round(gx),GROUND-3,2,5); ctx.fillRect(Math.round(gx)+4,GROUND-5,2,7);}
}
function drawForestExtra(sc) {
  var tsc=sc*0.45;
  [30,95,165,235,315,385,455].forEach(function(bx){
    var tx=((bx-tsc%(W+120)+W+120)%(W+120))-60;
    R(Math.round(tx)+8,GROUND-55,6,55,'#3a1a00');
    ctx.fillStyle='#0a2006'; ctx.beginPath(); ctx.arc(Math.round(tx)+11,GROUND-65,22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#142e0a'; ctx.beginPath(); ctx.arc(Math.round(tx)+11,GROUND-80,15,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle='#3a1a00';
  for(var i=0;i<18;i++){var gx=((i*30-sc*0.15)%(W+40)+W+40)%(W+40)-20; ctx.fillRect(Math.round(gx),GROUND-2,8,3);}
}
function drawIceExtra(sc) {
  ctx.fillStyle='rgba(180,240,255,0.5)';
  for(var i=0;i<22;i++){var gx=((i*25-sc*0.1)%(W+30)+W+30)%(W+30)-15; ctx.fillRect(Math.round(gx),GROUND,10,2); ctx.fillRect(Math.round(gx)+2,GROUND-1,6,2);}
  // Snowfall
  ctx.fillStyle='rgba(220,240,255,0.6)';
  for(var j=0;j<15;j++){var sx=((j*37+sc*0.3)%(W+10)+W+10)%(W+10)-5; var sy=(j*17+sc*0.5)%GROUND; ctx.fillRect(Math.round(sx),Math.round(sy),2,2);}
}
function drawVolcanoExtra(sc) {
  var vsc=sc*0.18;
  [100,300].forEach(function(bx){
    var vx=((bx-vsc%(W+200)+W+200)%(W+200))-100;
    ctx.fillStyle='#180808'; ctx.beginPath(); ctx.moveTo(Math.round(vx)-70,GROUND); ctx.lineTo(Math.round(vx),GROUND-90); ctx.lineTo(Math.round(vx)+70,GROUND); ctx.fill();
    ctx.fillStyle='rgba(255,80,0,0.6)'; ctx.beginPath(); ctx.arc(Math.round(vx),GROUND-90,10,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle='#ff4400';
  for(var i=0;i<10;i++){var gx=((i*50-sc*0.3)%(W+60)+W+60)%(W+60)-30; ctx.fillRect(Math.round(gx),GROUND+5,3,3); ctx.fillRect(Math.round(gx)+15,GROUND+9,4,2);}
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
var clouds=[{x:80,y:18,w:52},{x:260,y:28,w:38},{x:400,y:14,w:60}];
function drawBg(sc,th) {
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
  R(0,GROUND,W,H-GROUND,th.gnd); R(0,GROUND,W,4,th.gT);
  ctx.fillStyle=th.gTex;
  for(var i=0;i<22;i++){var gx=((i*28-sc)%W+W)%W; ctx.fillRect(Math.round(gx),GROUND+8,14,2);}
  for(var j=0;j<16;j++){var gx2=((j*32+14-sc*0.7)%W+W)%W; ctx.fillRect(Math.round(gx2),GROUND+16,9,2);}
}

// ── Player ───────────────────────────────────────────────────────
var player = {
  x:55, y:GROUND-DINO_H, vy:0, onGround:true, jumps:0, MAX_JUMPS:2,
  rF:0, rT:0, biting:false, bT:0, rawring:false, raT:0, rawrSize:0,

  get hitX(){return this.x+PIX*3;}, get hitY(){return this.y+PIX*2;},
  get hitW(){return PIX*6;},        get hitH(){return this.y+PIX*11-this.hitY;},

  jump:function(){if(this.jumps<this.MAX_JUMPS){this.vy=-10;this.jumps++;sfxJump();}},

  rawr:function(big){
    this.rawring=true; this.rawrSize=big?2:1; this.raT=big?50:28;
    if(big)sfxRawrBig(); else sfxRawrSmall();
  },

  triggerBite:function(){this.biting=true;this.bT=14;},

  update:function(){
    if(!this.onGround)this.vy+=0.65;
    this.y+=this.vy;
    var fl=GROUND-DINO_H;
    if(this.y>=fl){var wa=!this.onGround;this.y=fl;this.vy=0;this.onGround=true;this.jumps=0;if(wa)sfxLand();}
    else this.onGround=false;
    if(this.bT>0&&--this.bT===0)this.biting=false;
    if(this.raT>0&&--this.raT===0)this.rawring=false;
    if(this.onGround){this.rT++;if(this.rT>=7){this.rT=0;this.rF=1-this.rF;}}
  },

  draw:function(){
    drawDino(this.x,this.y,this.rF,this.biting,!this.onGround,this.rawring);
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
    this.rF=0;this.rT=0;this.biting=false;this.bT=0;this.rawring=false;this.raT=0;
  }
};

// ── Obstacles & Enemies ──────────────────────────────────────────
var obstacles=[], chaseables=[], popups=[];
var spawnT=0, spawnI=90, chaseT=0, chaseI=550;

var OBJ = {
  cS:{w:PIX*4,h:PIX*7},  cL:{w:PIX*6,h:PIX*9},
  st:{w:PIX*6,h:PIX*7},  mu:{w:PIX*6,h:PIX*7}, fl:{w:PIX*8,h:PIX*7},
  iS:{w:PIX*5,h:PIX*5},  iT:{w:PIX*5,h:PIX*8}, sb:{w:PIX*6,h:PIX*6},
  lS:{w:PIX*5,h:PIX*5},  lL:{w:PIX*7,h:PIX*7}, fg:{w:PIX*6,h:PIX*8},
  pt:{w:PIX*10,h:PIX*5},
};

function spawnObs(th) {
  var kind=th.obs[Math.floor(Math.random()*th.obs.length)];
  var sz=OBJ[kind]||OBJ.cS;
  var oy=GROUND-sz.h;
  if(kind==='pt'){var hs=[GROUND-sz.h-18,GROUND-sz.h-38,GROUND-sz.h-58];oy=hs[Math.floor(Math.random()*3)];}
  obstacles.push({kind:kind,x:W+20,y:oy,w:sz.w,h:sz.h,bitable:kind==='pt',wT:0,wF:0,flee:false});
  // Occasional paired ground obstacle
  if((kind==='cS'||kind==='st'||kind==='lS')&&Math.random()<0.28){
    var k2=th.obs.filter(function(t){return t!=='pt';})[0]||kind;
    var s2=OBJ[k2]||sz;
    obstacles.push({kind:k2,x:W+20+sz.w+PIX*5,y:GROUND-s2.h,w:s2.w,h:s2.h,bitable:false,wT:0,wF:0,flee:false});
  }
}

function spawnChase() {
  var kind=Math.random()<0.5?'sd':'cm';
  var sw=kind==='sd'?PIX*6:PIX*5, sh=kind==='sd'?PIX*7:PIX*11;
  chaseables.push({kind:kind,x:W+50,y:GROUND-sh,w:sw,h:sh,rF:0,rT:0,vy:0,onGround:true,scared:false});
}

function updateAndDrawObs(spd) {
  obstacles.forEach(function(o){
    o.x-=o.flee?spd+4:spd;
    if(o.kind==='pt'){o.wT++;if(o.wT>=10){o.wT=0;o.wF=1-o.wF;} if(o.flee)o.y-=3;}
    switch(o.kind){
      case 'cS': drawCactus(o.x,o.y,false); break;
      case 'cL': drawCactus(o.x,o.y,true);  break;
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
    }
  });
  obstacles=obstacles.filter(function(o){return o.x>-100&&o.y>-80;});
}

function updateAndDrawChase(spd) {
  chaseables.forEach(function(c){
    var mv=c.scared?spd+3.5:spd*0.55;
    c.x-=mv;
    if(c.kind==='cm'&&c.onGround&&Math.random()<0.004){c.vy=-7;c.onGround=false;}
    if(!c.onGround){c.vy+=0.5;c.y+=c.vy;var fl=GROUND-c.h;if(c.y>=fl){c.y=fl;c.onGround=true;c.vy=0;}}
    c.rT++;if(c.rT>=8){c.rT=0;c.rF=1-c.rF;}
    if(c.kind==='sd')drawSmallDino(c.x,c.y,c.rF); else drawCaveman(c.x,c.y,c.rF);
  });
  chaseables=chaseables.filter(function(c){return c.x>-80;});
}

// ── Collision ────────────────────────────────────────────────────
function hits(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}

function addPopup(x,y,txt,col){ popups.push({x:x,y:y,txt:txt,col:col||'#ffff00',life:36}); }

function checkCollisions() {
  var mg=5;
  var px=player.hitX+mg,py=player.hitY+mg,pw=player.hitW-mg*2,ph=player.hitH-mg*2;
  for(var i=obstacles.length-1;i>=0;i--){
    var o=obstacles[i];
    if(o.flee)continue;
    if(hits(px,py,pw,ph,o.x+mg,o.y+mg,o.w-mg*2,o.h-mg*2)){
      if(o.bitable&&!player.onGround){
        player.triggerBite(); obstacles.splice(i,1);
        score+=50; addPopup(o.x+o.w/2,o.y-4,'+50 CHOMP!','#ffee44');
      } else return true;
    }
  }
  for(var j=chaseables.length-1;j>=0;j--){
    var c=chaseables[j];
    if(hits(px,py,pw,ph,c.x+2,c.y+2,c.w-4,c.h-4)){
      chaseables.splice(j,1);
      var pts=c.kind==='cm'?40:25;
      score+=pts; addPopup(c.x+c.w/2,c.y-4,'+'+pts+' CAUGHT!','#88ff88'); sfxCatch();
    }
  }
  return false;
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
  var bx=W-52,by=H-28;
  var ready=rawrCD===0;
  R(bx,by,48,24,ready?'rgba(200,100,0,0.88)':'rgba(80,40,0,0.7)');
  ctx.strokeStyle=ready?'#ffaa00':'#804000'; ctx.lineWidth=2; ctx.strokeRect(bx,by,48,24); ctx.lineWidth=1;
  ctx.textAlign='center'; ctx.font='bold 9px monospace';
  ctx.fillStyle=ready?'#ffff44':'#804000';
  ctx.fillText(ready?'RAWR!':'~'+Math.ceil(rawrCD/60)+'s',bx+24,by+15);
  ctx.textAlign='left';
}

function isOnRawrBtn(ex,ey) {
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
  if(levelIdx<4){
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
}

// ── Game state ───────────────────────────────────────────────────
var ST={TITLE:0,PLAY:1,LVLDONE:2,DEAD:3};
var state=ST.TITLE;
var levelIdx=parseInt(localStorage.getItem('trex-lv')||'0',10);
if(levelIdx<0||levelIdx>4)levelIdx=0;
var scroll=0, tick=0, gameSpeed=4.0, levelStart=0;

function resetLevel() {
  player.reset();
  obstacles.length=0; chaseables.length=0; popups.length=0;
  spawnT=0; spawnI=90; chaseT=0; scroll=0; tick=0; score=0; scoreTick=0; flash=0; rawrCD=0;
  gameSpeed=3.5+levelIdx*0.5;
  levelStart=performance.now();
}

function doTap(ex,ey) {
  getAC().state==='suspended'&&getAC().resume();
  if(state===ST.TITLE){state=ST.PLAY;resetLevel();startMusic(levelIdx);return;}
  if(state===ST.DEAD){state=ST.PLAY;resetLevel();startMusic(levelIdx);return;}
  if(state===ST.LVLDONE){
    levelIdx=Math.min(levelIdx+1,4);
    localStorage.setItem('trex-lv',levelIdx);
    state=ST.PLAY;resetLevel();startMusic(levelIdx);return;
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
  var t=e.touches[0];
  if(state!==ST.PLAY){doTap(t.clientX,t.clientY);return;}
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
  if(held>350){rawrCD=300;player.rawr(true);applyRawr();}
  else        {rawrCD=90; player.rawr(false);}
},{passive:false});

canvas.addEventListener('mousedown',function(e){
  if(state===ST.PLAY&&isOnRawrBtn(e.clientX,e.clientY)){rawrHolding=true;rawrHoldStart=performance.now();}
  else doTap(e.clientX,e.clientY);
});
canvas.addEventListener('mouseup',function(e){
  if(!rawrHolding)return;
  rawrHolding=false;
  if(state!==ST.PLAY||rawrCD>0)return;
  var held=performance.now()-rawrHoldStart;
  if(held>350){rawrCD=300;player.rawr(true);applyRawr();}
  else        {rawrCD=90; player.rawr(false);}
});
document.addEventListener('keydown',function(e){
  if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(state===ST.PLAY)player.jump();else doTap();}
  if(e.code==='KeyR'&&state===ST.PLAY&&rawrCD===0){rawrCD=90;player.rawr(false);}
  if(e.code==='KeyE'&&state===ST.PLAY&&rawrCD===0){rawrCD=300;player.rawr(true);applyRawr();}
});

// ── Overlay screens ──────────────────────────────────────────────
function drawTitle() {
  R(0,0,W,GROUND,THEMES[0].skyT); R(0,GROUND*0.5,W,GROUND*0.5,THEMES[0].skyB);
  R(0,GROUND,W,H-GROUND,THEMES[0].gnd); R(0,GROUND,W,4,THEMES[0].gT);
  drawDino(50,GROUND-DINO_H,0,false,false,false);
  R(W/2-152,H/2-68,304,136,'rgba(0,10,40,0.82)');
  ctx.strokeStyle='#ffff44'; ctx.lineWidth=2; ctx.strokeRect(W/2-152,H/2-68,304,136); ctx.lineWidth=1;
  ctx.textAlign='center';
  ctx.fillStyle='#ffff44'; ctx.font='bold 24px monospace'; ctx.fillText('T-REX RUN!',W/2,H/2-44);
  ctx.fillStyle='#88ff88'; ctx.font='bold 8px monospace'; ctx.fillText('4 WORLDS + ENDLESS  ✦  JUMP ✦ BITE ✦ RAWR!',W/2,H/2-26);
  ctx.fillStyle='#ccc'; ctx.font='8px monospace';
  ctx.fillText('TAP = jump   Double-tap = double jump',W/2,H/2-10);
  ctx.fillText('Jump into pterodactyls to BITE them for +50pts',W/2,H/2+4);
  ctx.fillText('Catch small dinos (+25) & cavemen (+40)!',W/2,H/2+18);
  ctx.fillText('Tap RAWR! button to scare enemies away',W/2,H/2+32);
  ctx.fillText('Hold RAWR! for BIG RAAAWR! — scares everything!',W/2,H/2+46);
  ctx.fillStyle='#88ffff'; ctx.font='bold 11px monospace'; ctx.fillText('TAP TO START',W/2,H/2+64);
  ctx.textAlign='left';
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
  ctx.fillText('Score: '+score+(isHi?' ★ NEW BEST!':''),W/2,H/2+2);
  ctx.fillStyle='#88ff88'; ctx.font='bold 10px monospace'; ctx.fillText('TAP TO RETRY',W/2,H/2+26);
  ctx.textAlign='left';
}

// ── Main loop ────────────────────────────────────────────────────
function loop() {
  requestAnimationFrame(loop);
  var th=THEMES[levelIdx];

  if(state===ST.TITLE){drawTitle();return;}

  drawBg(scroll,th);
  drawGround(scroll,th);

  if(state===ST.PLAY){
    tick++; scroll+=gameSpeed;
    clouds.forEach(function(c){c.x-=gameSpeed*0.12;if(c.x<-(c.w+20))c.x=W+20;});

    spawnT++;if(spawnT>=spawnI){spawnT=0;spawnI=Math.max(36,spawnI-1);spawnObs(th);}
    chaseT++;if(chaseT>=chaseI){chaseT=0;spawnChase();}
    if(tick%280===0)gameSpeed=Math.min(levelIdx===4?22:13,gameSpeed+0.35);
    if(rawrCD>0)rawrCD--;

    updateAndDrawObs(gameSpeed);
    updateAndDrawChase(gameSpeed);
    player.update(); player.draw();
    updateScore();
    drawHUD(th,Math.max(0,LEVEL_MS-(performance.now()-levelStart)));

    // Level complete check (not endless)
    if(levelIdx<4&&performance.now()-levelStart>=LEVEL_MS){
      state=ST.LVLDONE; sfxLevelUp(); stopMusic();
      if(score>hiScore){hiScore=score;localStorage.setItem('trex-hi',hiScore);}
    }
    if(checkCollisions()){
      state=ST.DEAD; sfxDie(); stopMusic();
      if(score>hiScore){hiScore=score;localStorage.setItem('trex-hi',hiScore);}
    }
  }

  if(state===ST.LVLDONE){updateAndDrawObs(0);updateAndDrawChase(0);player.draw();drawLevelDone(th);}
  if(state===ST.DEAD){player.draw();drawDead();}
}
requestAnimationFrame(loop);
