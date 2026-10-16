import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase is optional. When the environment variables are missing (or still
 * contain the placeholder values from `.env.example`), the app runs in local
 * mode and stores progress and snippets in localStorage instead.
 */
const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

const looksLikePlaceholder =
  url.length === 0 ||
  anonKey.length === 0 ||
  url.includes('your-project-ref') ||
  anonKey.includes('your-anon')

export const isSupabaseConfigured: boolean = !looksLikePlaceholder && url.startsWith('http')

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
