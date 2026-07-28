'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function logout() {
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()

      if (!active) return

      if (signOutError) {
        setError('Gagal keluar. Coba lagi.')
        return
      }

      router.replace('/login')
      router.refresh()
    }

    void logout()

    return () => {
      active = false
    }
  }, [router])

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px' }}>
        <section
          style={{
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            borderRadius: 18,
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>Keluar</h1>
          {error ? (
            <>
              <p role="alert" style={{ color: '#991b1b', lineHeight: 1.6, marginBottom: 16 }}>
                {error}
              </p>
              <Link href="/" style={{ color: '#1d4ed8', fontWeight: 700 }}>
                Kembali ke landing page
              </Link>
            </>
          ) : (
            <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
              Memproses logout...
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
