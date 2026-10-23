import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  toggleSupabaseFavorite,
  deleteSupabaseFavorite,
  fetchSupabaseFavorites,
  FavoriteVideo,
} from './supabase';

export interface FavoriteCreation {
  id: string; // unique ID (e.g. videoId)
  videoId: string;
  title: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  video_url: string;
  thumbnail_url: string;
  duration?: string;
  favorited_at: string;
  userEmail?: string;
}

const LOCAL_STORAGE_KEY = 'nexverze_favorite_creations_v1';
const FAVORITES_EVENT = 'nexverze-favorites-updated';

// Helper to sanitize document ID for Firestore
function getSafeDocId(videoId: string, userEmail?: string | null): string {
  const prefix = userEmail ? userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest';
  const cleanId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}_${cleanId}`.slice(0, 120);
}

// 1. Read all local favorites
export function getLocalFavorites(): FavoriteCreation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading favorites from localStorage:', err);
    return [];
  }
}

// 2. Save favorites array to local storage and broadcast event
function saveLocalFavorites(items: FavoriteCreation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: items }));
  } catch (err) {
    console.error('Error saving favorites to localStorage:', err);
  }
}

// 3. Check if specific video ID is favorited
export function isCreationFavorited(videoId: string): boolean {
  const items = getLocalFavorites();
  return items.some((item) => item.videoId === videoId || item.id === videoId);
}

// 4. Toggle favorite status (Returns new favorited state: true = liked, false = unliked)
export async function toggleFavoriteCreation(
  item: Omit<FavoriteCreation, 'favorited_at'>,
  userEmail?: string | null
): Promise<boolean> {
  const current = getLocalFavorites();
  const vidId = item.videoId || item.id;
  const existsIndex = current.findIndex(
    (fav) => fav.videoId === vidId || fav.id === vidId
  );

  const docId = getSafeDocId(vidId, userEmail);

  // Sync with Supabase favorite_videos table
  toggleSupabaseFavorite({
    email: userEmail || 'guest@nexverze.ai',
    video_id: vidId,
    title: item.title,
    prompt: item.prompt,
    model: item.model,
    aspect_ratio: item.aspect_ratio,
    video_url: item.video_url,
    thumbnail_url: item.thumbnail_url,
    duration: item.duration,
  }).catch((e) => console.warn('Supabase toggle background notice:', e));

  if (existsIndex >= 0) {
    // UNLIKE / REMOVE
    const updated = current.filter((_, idx) => idx !== existsIndex);
    saveLocalFavorites(updated);

    // Sync removal with Firestore
    try {
      const docRef = doc(db, 'user_favorites', docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore favorite delete error (handled offline):', err);
    }

    return false;
  } else {
    // LIKE / ADD
    const newFavorite: FavoriteCreation = {
      ...item,
      id: vidId,
      videoId: vidId,
      userEmail: userEmail || undefined,
      favorited_at: new Date().toISOString(),
    };

    const updated = [newFavorite, ...current];
    saveLocalFavorites(updated);

    // Sync addition with Firestore
    try {
      const docRef = doc(db, 'user_favorites', docId);
      await setDoc(docRef, newFavorite);
    } catch (err) {
      console.warn('Firestore favorite save error (handled offline):', err);
    }

    return true;
  }
}

// 5. Remove favorite directly by videoId
export async function removeFavoriteCreation(videoId: string, userEmail?: string | null): Promise<void> {
  const current = getLocalFavorites();
  const updated = current.filter((fav) => fav.videoId !== videoId && fav.id !== videoId);
  saveLocalFavorites(updated);

  // Delete from Supabase
  deleteSupabaseFavorite(videoId, userEmail || undefined).catch((e) =>
    console.warn('Supabase delete error:', e)
  );

  // Delete from Firestore
  const docId = getSafeDocId(videoId, userEmail);
  try {
    const docRef = doc(db, 'user_favorites', docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore favorite removal error (handled offline):', err);
  }
}

// 6. Hook / Listener for live updates across components
export function subscribeFavorites(callback: (items: FavoriteCreation[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<FavoriteCreation[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getLocalFavorites());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      callback(getLocalFavorites());
    }
  };

  window.addEventListener(FAVORITES_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Initial invoke
  callback(getLocalFavorites());

  return () => {
    window.removeEventListener(FAVORITES_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// 7. Sync with Supabase and Firestore for signed-in user
export async function syncUserFavoritesFromCloud(userEmail?: string | null): Promise<FavoriteCreation[]> {
  const local = getLocalFavorites();

  // Try Supabase favorite_videos table
  try {
    const supaList = await fetchSupabaseFavorites(userEmail || undefined);
    if (supaList && supaList.length > 0) {
      const mapped: FavoriteCreation[] = supaList.map((s) => ({
        id: s.video_id,
        videoId: s.video_id,
        title: s.title,
        prompt: s.prompt,
        model: s.model,
        aspect_ratio: s.aspect_ratio,
        video_url: s.video_url,
        thumbnail_url: s.thumbnail_url || '',
        duration: s.duration,
        favorited_at: s.created_at || new Date().toISOString(),
        userEmail: s.email,
      }));
      saveLocalFavorites(mapped);
      return mapped;
    }
  } catch (e) {
    console.warn('Supabase sync favorites notice:', e);
  }

  // Also query Firestore
  if (!userEmail) return local;

  try {
    const colRef = collection(db, 'user_favorites');
    const snapshot = await getDocs(colRef);
    const cloudFavs: FavoriteCreation[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as FavoriteCreation;
      if (!data.userEmail || data.userEmail.toLowerCase() === userEmail.toLowerCase()) {
        cloudFavs.push(data);
      }
    });

    if (cloudFavs.length > 0) {
      const map = new Map<string, FavoriteCreation>();
      cloudFavs.forEach((f) => map.set(f.videoId || f.id, f));
      local.forEach((f) => map.set(f.videoId || f.id, f));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime()
      );
      saveLocalFavorites(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Cloud favorites sync info:', err);
  }

  return local;
}
