import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

// Dipake di Client Component (yang ada 'use client' di atasnya) —
// misal form booking yang butuh interaktivitas di browser.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
