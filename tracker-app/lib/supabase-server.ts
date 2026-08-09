import { createClient } from '@supabase/supabase-js'

// Server-only admin client — uses service role key, bypasses RLS.
// NEVER import this in client components (no 'use client' files).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})
