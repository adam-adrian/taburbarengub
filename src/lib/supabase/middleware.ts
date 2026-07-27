import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Dipanggil tiap request lewat middleware.ts. Tugasnya cuma satu:
// refresh token session Supabase biar user nggak random ke-logout.
// JANGAN taro logic proteksi route/role di sini — itu tempatnya di
// masing-masing layout.tsx (app/(member)/layout.tsx, app/admin/layout.tsx).
// @supabase/ssr menyimpan sesi di cookie `sb-<project-ref>-auth-token`, dan
// memecahnya jadi `...auth-token.0`, `.1` kalau kepanjangan.
function punyaCookieSesi(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))
}

export async function updateSession(request: NextRequest) {
  // Pengunjung anonim tidak punya sesi untuk di-refresh, jadi getUser() di bawah
  // cuma menghasilkan satu round trip ke Supabase Auth untuk dijawab null.
  // Landing page publik adalah halaman paling ramai di project ini — mendekati
  // tanggal sesi, ini beda antara nol dan satu panggilan jaringan per kunjungan.
  if (!punyaCookieSesi(request)) {
    return NextResponse.next({ request })
  }

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
