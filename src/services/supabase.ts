import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!supabase) {
  console.warn('[Supabase] Credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}
