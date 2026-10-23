import { createClient } from '@supabase/supabase-js';
import { MODEL_COST, RAZORPAY_PACKS, ModelType, DurationType } from './modelConfig';
export type { ModelType, DurationType };

export const DEFAULT_SUPABASE_URL = 'https://vfrndplroxqkoubzstwd.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh';

export interface StudioUser {
  id: string;
  email: string;
  credits: number;
  plan?: 'pro' | 'enterprise' | 'starter';
  is_pro?: boolean;
  created_at?: string;
}

export interface StudioGeneration {
  id: string;
  user_id: string;
  email: string;
  prompt: string;
  model: 'luma' | 'kling' | 'veo' | string;
  duration?: DurationType;
  credits_used: number;
  video_url: string;
  image_url?: string;
  status: 'completed' | 'processing' | 'failed';
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  email: string;
  order_id: string;
  payment_id: string;
  amount_inr: number;
  credits_added: number;
  created_at?: string;
}

// Re-export for compatibility
export { MODEL_COST, RAZORPAY_PACKS };
export const RAZORPAY_PLANS = RAZORPAY_PACKS;

// Default helper to get base credit cost
export function getModelCost(model: ModelType, duration: DurationType): number {
  return MODEL_COST[model]?.[duration] || 50;
}

// Create client
export function getSupabaseClient() {
  const url = (typeof window !== 'undefined' ? localStorage.getItem('studio_supabase_url') : null) || DEFAULT_SUPABASE_URL;
  const key = (typeof window !== 'undefined' ? localStorage.getItem('studio_supabase_key') : null) || DEFAULT_SUPABASE_KEY;
  return createClient(url, key);
}

const LOCAL_USER_KEY = 'nexverze_studio_user';
const LOCAL_HISTORY_KEY = 'nexverze_studio_history';

export async function getOrCreateStudioUser(email: string): Promise<StudioUser> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('studio_users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (data && !error) {
      const userObj = data as StudioUser;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
      return userObj;
    }

    const newUser: StudioUser = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      credits: 0,
      plan: 'starter',
      is_pro: false,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('studio_users')
      .insert([newUser]);

    if (!insertError) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
      return newUser;
    }
  } catch (err) {
    console.warn('Supabase remote connection notice:', err);
  }

  const cached = localStorage.getItem(`${LOCAL_USER_KEY}_${cleanEmail}`);
  if (cached) {
    const userObj = JSON.parse(cached) as StudioUser;
    return userObj;
  }

  const fallbackUser: StudioUser = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    credits: 0,
    plan: 'starter',
    is_pro: false,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(`${LOCAL_USER_KEY}_${cleanEmail}`, JSON.stringify(fallbackUser));
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
  return fallbackUser;
}

export async function refundUserCredits(user: StudioUser, amount: number): Promise<StudioUser> {
  return addUserCredits(user, amount);
}

export async function deductUserCredits(user: StudioUser, amount: number): Promise<StudioUser> {
  const newBalance = Math.max(0, user.credits - amount);
  const updatedUser: StudioUser = { ...user, credits: newBalance };
  const supabase = getSupabaseClient();

  try {
    await supabase
      .from('studio_users')
      .update({ credits: newBalance })
      .eq('id', user.id);
  } catch (err) {
    console.warn('Credit update error:', err);
  }

  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
  localStorage.setItem(`${LOCAL_USER_KEY}_${user.email}`, JSON.stringify(updatedUser));
  return updatedUser;
}

export async function addUserCredits(user: StudioUser, amount: number): Promise<StudioUser> {
  // Credits can only be minted server-side via /api/razorpay/verify after cryptographic payment validation.
  // This helper only syncs the already-verified local user state.
  const newBalance = Math.max(0, user.credits + amount);
  const updatedUser: StudioUser = { ...user, credits: newBalance };

  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
  localStorage.setItem(`${LOCAL_USER_KEY}_${user.email}`, JSON.stringify(updatedUser));
  return updatedUser;
}

export async function saveStudioGeneration(record: StudioGeneration): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    await supabase
      .from('studio_generations')
      .insert([record]);
  } catch (err) {
    console.warn('Save generation error:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    const list: StudioGeneration[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('History storage error:', e);
  }
}

export async function deleteStudioGeneration(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  try {
    await supabase
      .from('studio_generations')
      .delete()
      .eq('id', id);
  } catch (e) {
    console.warn('Delete generation error:', e);
  }

  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (raw) {
      const list: StudioGeneration[] = JSON.parse(raw);
      const updated = list.filter((item) => item.id !== id);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

export async function fetchUserGenerations(email?: string): Promise<StudioGeneration[]> {
  const supabase = getSupabaseClient();
  let list: StudioGeneration[] = [];

  try {
    let query = supabase
      .from('studio_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (email && email !== 'anand4earn@gmail.com') {
      query = query.eq('email', email);
    }

    const { data, error } = await query;
    if (data && !error && data.length > 0) {
      list = data as StudioGeneration[];
      return list;
    }
  } catch (err) {
    console.warn('Fetch history error:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (raw) {
      const localList: StudioGeneration[] = JSON.parse(raw);
      if (email && email !== 'anand4earn@gmail.com') {
        return localList.filter((g) => g.email.toLowerCase() === email.toLowerCase());
      }
      return localList;
    }
  } catch {
    // ignore
  }

  return [];
}

export interface FavoriteVideo {
  id?: string;
  user_id?: string;
  email: string;
  video_id: string;
  title: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  created_at?: string;
}

const LOCAL_FAVORITES_KEY = 'nexverze_favorite_creations_v1';
const FAVORITES_EVENT = 'nexverze-favorites-updated';

export function getLocalFavoriteVideos(): FavoriteVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFavoriteVideos(items: FavoriteVideo[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: items }));
  } catch (err) {
    console.warn('Local favorite storage error:', err);
  }
}

export async function fetchSupabaseFavorites(email?: string): Promise<FavoriteVideo[]> {
  const supabase = getSupabaseClient();
  const cleanEmail = email ? email.trim().toLowerCase() : 'guest@nexverze.ai';

  try {
    let query = supabase
      .from('favorite_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (email && email !== 'anand4earn@gmail.com') {
      query = query.eq('email', cleanEmail);
    }

    const { data, error } = await query;
    if (data && !error && data.length > 0) {
      const list = data as FavoriteVideo[];
      saveLocalFavoriteVideos(list);
      return list;
    }
  } catch (err) {
    console.warn('Supabase fetch favorites notice (using local cache):', err);
  }

  // Fallback to local cache
  const localList = getLocalFavoriteVideos();
  return localList;
}

export async function toggleSupabaseFavorite(item: Omit<FavoriteVideo, 'id' | 'created_at'>): Promise<boolean> {
  const supabase = getSupabaseClient();
  const cleanEmail = item.email ? item.email.trim().toLowerCase() : 'guest@nexverze.ai';
  const localList = getLocalFavoriteVideos();
  const existsIndex = localList.findIndex(
    (f) => (f.video_id === item.video_id || (f as any).id === item.video_id)
  );

  let isLiked = false;

  if (existsIndex >= 0) {
    // REMOVE / UNLIKE
    const updated = localList.filter((_, idx) => idx !== existsIndex);
    saveLocalFavoriteVideos(updated);
    isLiked = false;

    try {
      await supabase
        .from('favorite_videos')
        .delete()
        .eq('video_id', item.video_id);
    } catch (e) {
      console.warn('Supabase delete favorite notice (handled offline):', e);
    }
  } else {
    // ADD / LIKE
    const newRecord: FavoriteVideo = {
      ...item,
      email: cleanEmail,
      created_at: new Date().toISOString(),
    };
    const updated = [newRecord, ...localList];
    saveLocalFavoriteVideos(updated);
    isLiked = true;

    try {
      await supabase
        .from('favorite_videos')
        .insert([newRecord]);
    } catch (e) {
      console.warn('Supabase insert favorite notice (handled offline):', e);
    }
  }

  return isLiked;
}

export async function deleteSupabaseFavorite(videoId: string, email?: string): Promise<void> {
  const supabase = getSupabaseClient();
  const localList = getLocalFavoriteVideos();
  const updated = localList.filter((f) => f.video_id !== videoId && (f as any).id !== videoId);
  saveLocalFavoriteVideos(updated);

  try {
    await supabase
      .from('favorite_videos')
      .delete()
      .eq('video_id', videoId);
  } catch (e) {
    console.warn('Supabase delete favorite error:', e);
  }
}

export const SUPABASE_STUDIO_SQL = `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS studio_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  credits int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  prompt text NOT NULL,
  model text NOT NULL,
  duration text DEFAULT '5s',
  credits_used int NOT NULL,
  video_url text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'completed',
  aspect_ratio text DEFAULT '9:16',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  order_id text UNIQUE NOT NULL,
  payment_id text UNIQUE NOT NULL,
  amount_inr numeric NOT NULL,
  credits_added int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- New Table: favorite_videos for Liked Showcase & Studio creations
CREATE TABLE IF NOT EXISTS favorite_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  video_id text NOT NULL,
  title text NOT NULL,
  prompt text NOT NULL,
  model text NOT NULL,
  aspect_ratio text DEFAULT '9:16',
  video_url text NOT NULL,
  thumbnail_url text,
  duration text DEFAULT '10s',
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, video_id)
);

ALTER TABLE studio_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_videos ENABLE ROW LEVEL SECURITY;

-- Prevent client-side DevTools credit tampering: anon can read & create 0-credit profiles, but cannot mint credits directly
CREATE POLICY "Allow anon select studio_users" ON studio_users
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert zero-credit studio_users" ON studio_users
  FOR INSERT WITH CHECK (credits = 0);

CREATE POLICY "Allow anon select credit_transactions" ON credit_transactions
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read/write studio_generations" ON studio_generations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write favorite_videos" ON favorite_videos
  FOR ALL USING (true) WITH CHECK (true);
`;

