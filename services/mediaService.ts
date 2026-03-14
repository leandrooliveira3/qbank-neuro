
import { localDB } from './localDB';

class MediaService {
  private objectUrls: Set<string> = new Set();

  async getImageUrl(url: string | undefined): Promise<string> {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    const isLocal = url.startsWith('/');

    try {
      // 1. Tenta Cache Local (IndexedDB)
      const cached = await localDB.get('media_cache', url);
      if (cached && cached.blob) {
        const objectUrl = URL.createObjectURL(cached.blob);
        this.objectUrls.add(objectUrl);
        return objectUrl;
      }

      // 2. Se não tem local, baixa da rede
      if (navigator.onLine || isLocal) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout aumentado
          
          const fetchOptions: RequestInit = { 
            signal: controller.signal,
            mode: isLocal ? 'same-origin' : 'cors',
            // CRITICAL FIX: Mudado de 'no-cache' para 'default' ou 'force-cache'
            // Isso permite que o navegador use seu disk cache se o Supabase mandar headers de cache válidos
            cache: 'default' 
          };

          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const blob = await response.blob();
            // Salva no IndexedDB para uso offline futuro
            await localDB.put('media_cache', { id: url, blob, timestamp: Date.now() });
            const newObjectUrl = URL.createObjectURL(blob);
            this.objectUrls.add(newObjectUrl);
            return newObjectUrl;
          }
        } catch (e) {
          console.warn("MediaService: Falha ao baixar mídia:", url);
        }
      }
    } catch (e) {
      console.error("MediaService: Erro no acesso ao DB local:", e);
    }

    // Fallback: retorna a URL original para o navegador tentar resolver nativamente
    return url;
  }

  async deleteFromCache(url: string | undefined) {
    if (!url) return;
    try {
      await localDB.delete('media_cache', url);
    } catch (e) {
      console.warn("MediaService: Erro ao limpar cache de:", url);
    }
  }

  async prefetch(urls: (string | undefined)[]) {
    const validUrls = Array.from(new Set(urls.filter(u => u && !u.startsWith('data:')))) as string[];
    
    // Otimização: Processar em lotes pequenos para não congestionar a rede
    const BATCH_SIZE = 5;
    for (let i = 0; i < validUrls.length; i += BATCH_SIZE) {
        const batch = validUrls.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (url) => {
            try {
                const cached = await localDB.get('media_cache', url);
                if (!cached) {
                    const isLocal = url.startsWith('/');
                    // Usa force-cache aqui para garantir que se o navegador tem, não baixa de novo
                    const response = await fetch(url, { 
                        mode: isLocal ? 'same-origin' : 'cors',
                        cache: 'force-cache' 
                    });
                    if (response.ok) {
                        const blob = await response.blob();
                        await localDB.put('media_cache', { id: url, blob, timestamp: Date.now() });
                    }
                }
            } catch (e) {}
        }));
    }
  }

  clearMemory() {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}

export const mediaService = new MediaService();
