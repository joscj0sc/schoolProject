self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('game-cache').then(cache => {
      return cache.addAll([
        './game.html',
        './game.js',
        './game.css',
        './manifest.json',
        './bilder/frame0.png',
        './bilder/frame1.png',
        './bilder/frame2.png',
        './bilder/frame3.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
