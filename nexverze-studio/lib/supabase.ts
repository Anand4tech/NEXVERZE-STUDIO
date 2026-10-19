import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfrndplroxqkoubzstwd.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface StudioUser {
  id: string;
  email: string;
  credits: number;
  created_at?: string;
}

export interface StudioGeneration {
  id: string;
  user_id: string;
  email: string;
  prompt: string;
  model: 'luma' | 'kling' | 'veo' | string;
  duration?: '5s' | '8s' | '10s';
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

// Profit pricing rounded (1cr = ₹0.70 flat)
export const MODEL_COST = {
  luma: { '5s': 50, '8s': 80, '10s': 100 },
  kling: { '5s': 120, '8s': 192, '10s': 240 },
  veo: { '8s': 400, '10s': 500 },
};

// Rounded Packs
export const RAZORPAY_PACKS = [
  { id: 'starter', name: 'STARTER', credits: 500, amount: 350, comparison: '10 Luma 5s or 1 Veo 8s' },
  { id: 'pro', name: 'PRO', credits: 1200, amount: 750, comparison: '24 Luma or 3 Veo' },
  { id: 'power', name: 'POWER', credits: 3000, amount: 1500, comparison: '60 Luma or 7 Veo' },
];
