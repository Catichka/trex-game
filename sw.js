const CACHE = 'trex-v21';
// Relative paths, so the game also works from a subfolder (e.g. GitHub Pages).
const FILES = ['./', 'index.html', 'sprites.js', 'boss.js', 'encounters.js', 'audio.js', 'music.html', 'docs/audio/theme_scores.js', 'game.js', 'manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Art under /assets/ changes often: network first, cached copy for offline play.
  var url = new URL(e.request.url);
  // Leaderboard and other sites: always straight to the network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/assets/') >= 0) {
    e.respondWith(fetch(e.request).then(function(r){
      if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
      return r;
    }).catch(function(){ return caches.match(e.request); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(r){ return r || fetch(e.request); }));
});
