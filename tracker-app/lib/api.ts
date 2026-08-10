'use client'
import { supabase } from '@/lib/supabase'

/**
 * Drop-in replacement for fetch() that automatically attaches the current
 * Supabase session token as an Authorization header so that API routes can
 * verify the caller is logged in via requireAuth().
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (init.body != null) headers['Content-Type'] = 'application/json'

  return fetch(input, { ...init, headers })
}
