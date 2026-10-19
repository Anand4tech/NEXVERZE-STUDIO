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
  const isTargetPro = cleanEmail === 'anand4earn@gmail.com';

  if (isTargetPro && typeof window !== 'undefined') {
    localStorage.setItem('nexverze_studio_paid_user', 'true');
    localStorage.setItem('nexverze_user_plan', 'pro');
  }

  try {
    const { data, error } = await supabase
      .from('studio_users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (data && !error) {
      const userObj = data as StudioUser;
      if (isTargetPro) {
        userObj.is_pro = true;
        userObj.plan = 'pro';
        userObj.credits = Math.max(userObj.credits || 0, 5000);
      }
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
      return userObj;
    }

    const newUser: StudioUser = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      credits: isTargetPro ? 5000 : 0,
      plan: isTargetPro ? 'pro' : 'starter',
      is_pro: isTargetPro,
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
    if (isTargetPro) {
      userObj.is_pro = true;
      userObj.plan = 'pro';
      userObj.credits = Math.max(userObj.credits || 0, 5000);
      localStorage.setItem(`${LOCAL_USER_KEY}_${cleanEmail}`, JSON.stringify(userObj));
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
    }
    return userObj;
  }

  const fallbackUser: StudioUser = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    credits: isTargetPro ? 5000 : 0,
    plan: isTargetPro ? 'pro' : 'starter',
    is_pro: isTargetPro,
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
  const newBalance = user.credits + amount;
  const updatedUser: StudioUser = { ...user, credits: newBalance };
  const supabase = getSupabaseClient();

  try {
    await supabase
      .from('studio_users')
      .update({ credits: newBalance })
      .eq('id', user.id);
  } catch (err) {
    console.warn('Add credit error:', err);
  }

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

export const SUPABASE_STUDIO_SQL = `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS studio_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  credits int NOT NULL DEFAULT 50,
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
  order_id text NOT NULL,
  payment_id text NOT NULL,
  amount_inr numeric NOT NULL,
  credits_added int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE studio_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write studio_users" ON studio_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write studio_generations" ON studio_generations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write credit_transactions" ON credit_transactions
  FOR ALL USING (true) WITH CHECK (true);
`;
