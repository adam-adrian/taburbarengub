'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const redirectTo = `${window.location.origin}/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)

    if (resetError) {
      // Pesan dibuat generik supaya halaman ini tidak jadi alat enumerasi email.
      // Untuk email yang tidak terdaftar, Supabase bisa tetap merespons sukses
      // tergantung konfigurasi; dari sisi UI kita tetap tidak membedakannya.
      console.error(resetError)
      setError('Jika email terdaftar, link reset password akan dikirim.')
      setSubmitted(true)
      return
    }

    setSubmitted(true)
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
            <Link href="/login" style={{ color: '#4b5563' }}>
              ← Kembali ke login
            </Link>
            <h1 style={{ fontSize: 32, marginTop: 16, letterSpacing: -0.8 }}>Lupa Password</h1>
            <p style={{ color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
              Masukkan email akun kamu. Jika email terdaftar, kami akan mengirim link untuk membuat password baru.
            </p>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </label>

          {submitted && (
            <div role="status" style={{ padding: 14, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, lineHeight: 1.6 }}>
              Jika email terdaftar, link reset password akan dikirim. Cek inbox atau folder spam.
            </div>
          )}

          {error && (
            <div role="alert" style={{ padding: 14, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || submitted}
            style={{
              background: loading || submitted ? '#9ca3af' : '#111827',
              color: '#fff',
              border: 0,
              borderRadius: 10,
              padding: '11px 16px',
              fontWeight: 800,
              cursor: loading || submitted ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Mengirim...' : submitted ? 'Link dikirim jika email valid' : 'Kirim Link Reset'}
          </button>
        </form>
      </div>
    </main>
  )
}
