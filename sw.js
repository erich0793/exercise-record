/*
 * 離線支援（Service Worker）
 *
 * 設計原則是「寧可多連一次網路，也不要讓使用者卡在舊版」：
 *   - 頁面本身（index.html）一律先連網路，失敗才用快取 → 每次部署都會立即生效
 *   - 其餘同源資源（圖示、OCR 引擎）先給快取、背景更新 → 離線也能開、也能辨識
 *   - 不快取任何跨網域請求；本站本來就不呼叫外部 API
 *
 * 運動紀錄本身存在 localStorage，不經過這裡；這個檔案只負責讓網站在沒網路時打得開。
 * 更動快取策略時，請一併調升 CACHE 的版本字串，舊快取會在 activate 時清掉。
 */
const CACHE = 'wex-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                               .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/** 頁面：先網路，成功就順手更新快取；失敗（離線）才回快取 */
function networkFirst(request) {
  return fetch(request).then(function (res) {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(request).then(function (hit) {
      return hit || caches.match('./index.html');
    });
  });
}

/** 其他資源：有快取先給快取，同時背景向網路取新版 */
function staleWhileRevalidate(request) {
  return caches.open(CACHE).then(function (c) {
    return c.match(request).then(function (hit) {
      const update = fetch(request).then(function (res) {
        if (res && res.ok) c.put(request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || update;
    });
  });
}

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // 跨網域一律不碰
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});
