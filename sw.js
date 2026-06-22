
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

  // --- GOOGLE DRIVE VIDEO STREAM PROXY ---
  // Format: /drive-stream/{FILE_ID}?token={ACCESS_TOKEN}
  if (url.pathname.startsWith('/drive-stream/')) {
    const fileId = url.pathname.split('/')[2];
    const token = url.searchParams.get('token');

    if (fileId && token) {
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        
        // Construct headers for Google Drive API
        const newHeaders = new Headers();
        newHeaders.set('Authorization', `Bearer ${token}`);
        
        // Pass through Range header if present (Critical for seeking video)
        const range = event.request.headers.get('Range');
        if (range) {
            newHeaders.set('Range', range);
        }

        const driveRequest = new Request(driveUrl, {
            method: 'GET',
            headers: newHeaders,
            mode: 'cors',
            credentials: 'omit',
            cache: 'default',
            redirect: 'follow'
        });

        event.respondWith(
            fetch(driveRequest).then(response => {
                if (!response.ok) {
                    console.error("SW Drive Fetch Error:", response.status);
                    return response;
                }
                
                // Return response to browser with correct CORS headers for the video element
                const newResponseHeaders = new Headers(response.headers);
                newResponseHeaders.set('Access-Control-Allow-Origin', '*');
                
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newResponseHeaders
                });
            }).catch(err => {
                console.error("SW Fetch Fail:", err);
                return new Response("Stream Error", { status: 502 });
            })
        );
        return;
    }
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
