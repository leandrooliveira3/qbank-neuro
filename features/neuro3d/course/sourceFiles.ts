import manifest from './content/originals.json';

export type SourceRange = (typeof manifest.lessons)['1A'][number];
export const sources = manifest.sources;
export const originalLessons: Record<string, SourceRange[]> = manifest.lessons;

const databaseName = 'qbank-nri-aulas-originais';
const storeName = 'pdfs';

function openSources(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function useSources<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openSources();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = work(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error);
      transaction.onerror = () => reject(transaction.error ?? request.error);
    });
  } finally {
    db.close();
  }
}

export async function loadSources(): Promise<Map<string, Blob>> {
  const records = await useSources('readonly', (store) => store.getAll());
  return new Map(records.map(({ id, file }: { id: string; file: Blob }) => [id, file]));
}

export async function addSource(file: File) {
  const candidates = sources.filter((source) => source.bytes === file.size);
  if (!candidates.length) throw new Error('Selecione um dos três PDFs originais do curso.');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const source = candidates.find((candidate) => candidate.sha256 === hash);
  if (!source) throw new Error('Esta edição do PDF difere do original. Os recortes dependem da versão exata.');
  await useSources('readwrite', (store) => store.put({ id: source.id, file }, source.id));
  return source.id;
}
