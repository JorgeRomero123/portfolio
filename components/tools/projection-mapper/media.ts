/**
 * Images and videos live in IndexedDB of the browser that runs the projector window,
 * so nothing is uploaded anywhere. A control page in the same browser can add files;
 * the output reads them back by id.
 */

export interface MediaItem { id: string; name: string; type: string; blob: Blob }

const DB = 'projection-mapper';
const STORE = 'media';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then((db) => new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function addMedia(file: File): Promise<MediaItem> {
  const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: file.name, type: file.type, blob: file };
  await run('readwrite', (s) => s.put(item));
  return item;
}

export const getMedia = (id: string) => run<MediaItem | undefined>('readonly', (s) => s.get(id));
export const listMedia = () => run<MediaItem[]>('readonly', (s) => s.getAll());
export const deleteMedia = (id: string) => run('readwrite', (s) => s.delete(id));
