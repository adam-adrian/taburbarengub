'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [linkStatus, setLinkStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [showRequestNewLink, setShowRequestNewLink] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let active = true

    function markValid() {
      if (!active) return
      setLinkStatus('valid')
      setError(null)
      setShowRequestNewLink(false)
    }

    function markInvalid() {
      if (!active) return
      setLinkStatus('invalid')
      setShowRequestNewLink(true)
      setError('Link reset password tidak valid atau sudah kedaluwarsa.')
    }

    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const authCode = searchParams.get('code')
    const hasImplicitRecoveryToken =
      hashParams.get('type') === 'recovery' && hashParams.has('access_token')

    if (authCode) {
      void (async () => {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)

        if (exchangeError) {
          markInvalid()
          return
        }

        markValid()
        window.history.replaceState(null, '', '/reset-password')
      })()

      return () => {
        active = false
      }
    }

    if (!hasImplicitRecoveryToken) {
      markInvalid()
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        markValid()
      }
    })

    const timer = window.setTimeout(async () => {
      if (!active) return

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        markValid()
      } else {
        markInvalid()
      }
    }, 3000)

    return () => {
      active = false
      window.clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setShowRequestNewLink(false)

    if (linkStatus !== 'valid') {
      setShowRequestNewLink(true)
      setError('Link reset password tidak valid atau sudah kedaluwarsa.')
      return
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)
      setShowRequestNewLink(true)
      setError('Link reset password tidak valid atau sudah kedaluwarsa.')
      return
    }

    await supabase.auth.signOut()
    setLoading(false)
    setSuccess(true)

    setTimeout(() => {
      router.replace('/login')
      router.refresh()
    }, 1200)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 16,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            borderRadius: 18,
            padding: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 32, letterSpacing: -0.8 }}>Buat Password Baru</h1>
            <p style={{ color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
              Masukkan password baru untuk akun kamu.
            </p>
          </div>

          {linkStatus === 'checking' && (
            <div role="status" style={{ padding: 14, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, lineHeight: 1.6 }}>
              Memeriksa link reset password...
            </div>
          )}

          {linkStatus === 'invalid' && (
            <div role="alert" style={{ padding: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 12, lineHeight: 1.6 }}>
              Link reset password tidak valid atau sudah kedaluwarsa.{' '}
              <Link href="/forgot-password" style={{ color: '#991b1b', fontWeight: 800 }}>
                Minta link baru
              </Link>
            </div>
          )}

          {linkStatus === 'valid' && (
            <>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Password Baru</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>Konfirmasi Password Baru</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              </label>
            </>
          )}

          {success && (
            <div role="status" style={{ padding: 14, border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', borderRadius: 12, lineHeight: 1.6 }}>
              Password berhasil diubah. Kamu akan diarahkan ke halaman login.
            </div>
          )}

          {error && linkStatus === 'valid' && (
            <div role="alert" style={{ padding: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 12, lineHeight: 1.6 }}>
              {error}
              {showRequestNewLink && (
                <>
                  {' '}
                  <Link href="/forgot-password" style={{ color: '#991b1b', fontWeight: 800 }}>
                    Minta link baru
                  </Link>
                </>
              )}
            </div>
          )}

          {linkStatus === 'valid' && (
            <button
              type="submit"
              disabled={loading || success}
              style={{
                background: loading || success ? '#9ca3af' : '#111827',
                color: '#fff',
                border: 0,
                borderRadius: 10,
                padding: '11px 16px',
                fontWeight: 800,
                cursor: loading || success ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          )}
        </form>
      </div>
    </main>
  )
}
