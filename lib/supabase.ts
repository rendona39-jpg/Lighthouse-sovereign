import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Server-side Supabase clients for API routes
// These use non-prefixed env vars since they run on the server
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
