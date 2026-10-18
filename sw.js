const CACHE = 'trex-v14';
const FILES = ['/', '/index.html', '/sprites.js', '/game.js', '/manifest.json'];

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
  if (new URL(e.request.url).pathname.indexOf('/assets/') === 0) {
    e.respondWith(fetch(e.request).then(function(r){
      if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
      return r;
    }).catch(function(){ return caches.match(e.request); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(r){ return r || fetch(e.request); }));
});
