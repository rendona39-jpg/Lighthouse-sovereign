import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Lazy initialization to avoid build-time/import-time evaluation
let _supabase: SupabaseClient<Database> | null = null;
let _supabaseAdmin: SupabaseClient<Database> | null = null;

// Server-side Supabase clients for API routes
// These use non-prefixed env vars since they run on the server
export function getSupabase(): SupabaseClient<Database> | null {
  if (_supabase) return _supabase;
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) return null;
  
  _supabase = createClient<Database>(url, key);
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (_supabaseAdmin) return _supabaseAdmin;
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) return null;
  
  _supabaseAdmin = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return _supabaseAdmin;
}

// Legacy exports for backward compatibility (lazy getter)
export const supabase = {
  get client() {
    return getSupabase();
  }
};

export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  }
};
