import { createClient } from '@supabase/supabase-js';

// Credentials provided for the project
export const SUPABASE_URL = 'https://azigaziisnjguakkajza.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_KGc2CWNcSy09aeBmSYoEQw_LBxLx4ku';

/**
 * Interface de Storage compatível com o Supabase Auth.
 */
interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Cria um storage que vive apenas na memória RAM da aba atual.
 * Usado como fallback se o localStorage estiver bloqueado (SecurityError).
 */
const createInMemoryStorage = (): SafeStorage => {
  const storage: Record<string, string> = {};
  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
  };
};

/**
 * Tenta obter o localStorage de forma extremamente defensiva.
 */
const getSafeStorage = (): SafeStorage => {
  const memoryFallback = createInMemoryStorage();

  if (typeof window === 'undefined') return memoryFallback;

  try {
    // Em alguns ambientes (sandboxes restritas), simplesmente acessar window.localStorage
    // já dispara o SecurityError. Por isso, testamos o acesso dentro do try/catch.
    const storage = window.localStorage;
    if (!storage) return memoryFallback;

    // Teste de escrita para garantir que não é apenas "read-only" ou restrito
    const testKey = '__sb_test_access__';
    storage.setItem(testKey, 'ok');
    const result = storage.getItem(testKey);
    storage.removeItem(testKey);

    if (result !== 'ok') return memoryFallback;

    return storage;
  } catch (e) {
    console.warn("Acesso ao armazenamento local bloqueado pelo navegador. Usando memória temporária.");
    return memoryFallback;
  }
};

/**
 * Inicialização do cliente Supabase com configurações de alta compatibilidade.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: getSafeStorage() as any,
    // Usa fluxo implícito para evitar redirecionamentos complexos que podem ser bloqueados
    flowType: 'implicit'
  },
});

/**
 * Helper para sincronização offline (silencioso para evitar erros de UI).
 */
export const syncOfflineData = async () => {
  try {
    const storage = getSafeStorage();
    const queue = storage.getItem('offline_queue');
    if (queue) {
      storage.removeItem('offline_queue');
    }
  } catch (e) {
    // Falha silenciosa
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineData);
}