// IndexedDB: 'meta' holds the small gallery records (name, size, thumbnail),
// 'data' holds layers (cached pixels + the stroke list used for print export).
const NAME = 'shirt-studio';
let dbp;

function open() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(NAME, 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('meta', { keyPath: 'id' });
        d.createObjectStore('data', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}

async function run(stores, mode, fn) {
  const d = await open();
  return new Promise((res, rej) => {
    const t = d.transaction(stores, mode);
    let out;
    t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out);
    t.onerror = t.onabort = () => rej(t.error);
    out = fn(t);
  });
}

export const db = {
  list: () => run(['meta'], 'readonly', (t) => t.objectStore('meta').getAll()),
  getMeta: (id) => run(['meta'], 'readonly', (t) => t.objectStore('meta').get(id)),
  getData: (id) => run(['data'], 'readonly', (t) => t.objectStore('data').get(id)),
  put: (meta, data) =>
    run(['meta', 'data'], 'readwrite', (t) => {
      t.objectStore('meta').put(meta);
      if (data) t.objectStore('data').put(data);
    }),
  putMeta: (meta) => run(['meta'], 'readwrite', (t) => t.objectStore('meta').put(meta)),
  del: (id) =>
    run(['meta', 'data'], 'readwrite', (t) => {
      t.objectStore('meta').delete(id);
      t.objectStore('data').delete(id);
    }),
};
