// A player-imported .deltaskin is a few MB, too big for localStorage, so it
// lives in its own small IndexedDB store. Every call degrades to "no custom
// skin" if IndexedDB is unavailable (private mode, blocked storage).
const DB_NAME = 'ogba-skins'
const STORE   = 'skins'
const KEY     = 'custom'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function loadCustomSkin(): Promise<Uint8Array | null> {
  try {
    const bytes = await run<Uint8Array | undefined>('readonly', (s) => s.get(KEY))
    return bytes ?? null
  } catch {
    return null
  }
}

export async function saveCustomSkin(bytes: Uint8Array): Promise<void> {
  await run('readwrite', (s) => s.put(bytes, KEY))
}

export async function clearCustomSkin(): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(KEY))
  } catch {
    // nothing stored
  }
}
