// عامل الخدمة: يحفظ ملفات التطبيق في الجهاز ليعمل دون إنترنت
// عند تعديل أي ملف في التطبيق، غيّر رقم الإصدار هنا ليصل التحديث للمستخدمين
const CACHE = 'injaz-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/app.css',
  './assets/fontawesome.min.css',
  './assets/chart.umd.js',
  './assets/confetti.browser.js',
  './assets/webfonts/fa-solid-900.woff2',
  './assets/webfonts/fa-regular-400.woff2',
  './assets/webfonts/fa-brands-400.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  ...[300, 400, 500, 600, 700, 800].flatMap(w => [
    `./assets/fonts/cairo-arabic-${w}-normal.woff2`,
    `./assets/fonts/cairo-latin-${w}-normal.woff2`
  ])
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // الصفحة نفسها: من الإنترنت أولاً (لتصل التحديثات)، ومن الجهاز عند انقطاعه
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // باقي الملفات: من الجهاز أولاً
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
