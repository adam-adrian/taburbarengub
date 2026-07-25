import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'

// Dipake di Server Component & API Route. Server Component nggak
// bisa nulis cookie langsung, makanya try-catch di setAll — kalau
// dipanggil dari situ, boleh diabaikan selama middleware.ts kamu
// udah nge-refresh session tiap request (kita bahas itu belakangan).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // aman diabaikan kalau dipanggil dari Server Component
          }
        },
      },
    }
  )
}
