import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Dipanggil tiap request lewat middleware.ts. Tugasnya cuma satu:
// refresh token session Supabase biar user nggak random ke-logout.
// JANGAN taro logic proteksi route/role di sini — itu tempatnya di
// masing-masing layout.tsx (app/(member)/layout.tsx, app/admin/layout.tsx).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // PENTING: baris ini yang beneran refresh token-nya. Jangan dihapus
  // walau keliatan kayak variable yang nggak dipake.
  await supabase.auth.getUser()

  return supabaseResponse
}
