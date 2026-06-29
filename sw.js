
const CACHE_NAME = 'neuroqbank-v3.2'; 
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

    // Removido drive-stream proxy para evitar uso excessivo de memória no Service Worker
    if (url.pathname.startsWith('/drive-stream/')) {
        // Redireciona diretamente em vez de processar no SW para economizar memória (ou ignora se já for direto)
        return;
    }

  // --- STANDARD CACHE STRATEGY ---
  if (event.request.url.includes('supabase.co') || event.request.url.includes('googleapis.com')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache valid GET requests
        if(fetchResponse.status === 200 && event.request.method === 'GET' && event.request.url.startsWith('http')) {
             return caches.open(CACHE_NAME).then((cache) => {
                 cache.put(event.request, fetchResponse.clone());
                 return fetchResponse;
             });
        }
        return fetchResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
