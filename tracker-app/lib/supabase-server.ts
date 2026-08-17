import { createClient } from '@supabase/supabase-js'

// Server-only admin client — uses service role key to bypass RLS.
// Falls back to anon key if service role key is not configured.
// NEVER import this in client components.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey ?? anonKey, {
  auth: { persistSession: false },
})
