
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

  // Exclude range requests (streaming/video seek) from being handled by standard SW cache
  const isRangeRequest = event.request.headers.has('Range');

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
                
                // Return original response directly to avoid custom Response constructors which leak streams on Safari iOS
                return response;
            }).catch(err => {
                console.error("SW Fetch Fail:", err);
                return new Response("Stream Error", { status: 502 });
            })
        );
        return;
    }
  }

  // --- STANDARD BYPASS STRATEGY ---
  // Exclude analytics, database syncs, audio/video file formats, and keepalives from being intercepted
  const isBypass = 
    event.request.url.includes('supabase.co') || 
    event.request.url.includes('googleapis.com') || 
    event.request.url.includes('drive.google.com') || 
    event.request.url.includes('youtube.com') || 
    event.request.url.includes('youtu.be') || 
    event.request.url.includes('vimeo.com') || 
    event.request.url.includes('ping') || 
    event.request.url.includes('bypass') ||
    /\.(mp4|webm|mkv|avi|mov|mp3|wav|ogg|m4a|m4v|3gp|flac)($|\?)/i.test(url.pathname);

  if (isBypass || isRangeRequest) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Safe checks: Only cache 200 GET requests from same origin or basic HTTP resources
        const contentType = fetchResponse.headers.get('content-type') || '';
        const contentLength = fetchResponse.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : 0;

        // CRITICAL PROTECTION AGAINST MULTIMEDIA MEMORY LEAK IN SAFARI
        const isMedia = contentType.startsWith('video/') || contentType.startsWith('audio/') || contentType.startsWith('application/octet-stream');
        const isTooLarge = size > 5242880; // 5MB limit to prevent out-of-memory crash

        if (
          fetchResponse.status === 200 && 
          event.request.method === 'GET' && 
          event.request.url.startsWith('http') &&
          !isMedia && 
          !isTooLarge
        ) {
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
