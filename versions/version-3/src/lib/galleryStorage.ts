// IndexedDB storage for gallery uploaded videos to ensure instant persistence & zero-loss
const DB_NAME = 'nexverze_gallery_db';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeGalleryVideoBlob(videoId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, videoId);
      if (safeId !== videoId) {
        store.put(blob, safeId);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to store video in IndexedDB:', err);
  }
}

export async function loadGalleryVideoBlob(videoId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else if (safeId !== videoId) {
          const req2 = store.get(safeId);
          req2.onsuccess = () => resolve(req2.result || null);
          req2.onerror = () => resolve(null);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function loadAllGalleryVideoBlobs(): Promise<Record<string, string>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      const urls: Record<string, string> = {};
      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value instanceof Blob) {
            const key = cursor.key as string;
            const objUrl = URL.createObjectURL(cursor.value);
            urls[key] = objUrl;
            const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
            if (safeKey !== key && !urls[safeKey]) {
              urls[safeKey] = objUrl;
            }
          }
          cursor.continue();
        } else {
          resolve(urls);
        }
      };
      req.onerror = () => resolve(urls);
    });
  } catch {
    return {};
  }
}

export async function deleteGalleryVideoBlob(videoId: string): Promise<void> {
  try {
    const db = await openDB();
    const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(videoId);
      if (safeId !== videoId) {
        store.delete(safeId);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB:', err);
  }
}
