'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    no_hp: '',
    usia: '',
    profesi: '',
    domisili: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (form.password !== form.confirmPassword) {
      setLoading(false)
      setError('Konfirmasi password tidak sama')
      return
    }

    // Field tambahan (nama, no_hp, usia, dst) dikirim lewat `options.data`.
    // Ini yang ditangkep trigger `handle_new_user()` di database buat
    // otomatis ngisi tabel `users` — lihat schema-fase1.sql.
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nama: form.nama,
          no_hp: form.no_hp,
          usia: form.usia,
          profesi: form.profesi,
          domisili: form.domisili,
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 18,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 10px 30px rgba(17, 24, 39, 0.06)',
          }}
        >
          <div>
            <Link href="/" style={{ color: '#4b5563', fontSize: 14 }}>
              ← Kembali ke landing page
            </Link>
            <h1 style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: -0.8, marginTop: 18 }}>
              Daftar Akun
            </h1>
            <p style={{ color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
              Buat akun untuk booking sesi offline dan mendapatkan tiket QR.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Nama</span>
              <input
                value={form.nama}
                onChange={updateField('nama')}
                autoComplete="name"
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                autoComplete="email"
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={updateField('password')}
                autoComplete="new-password"
                minLength={8}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Konfirmasi Password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                autoComplete="new-password"
                minLength={8}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>No. HP</span>
              <input
                value={form.no_hp}
                onChange={updateField('no_hp')}
                inputMode="tel"
                autoComplete="tel"
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Usia</span>
              <input
                type="number"
                min={1}
                value={form.usia}
                onChange={updateField('usia')}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Profesi</span>
              <input
                value={form.profesi}
                onChange={updateField('profesi')}
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Domisili</span>
              <input
                value={form.domisili}
                onChange={updateField('domisili')}
                style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
              />
            </label>
          </div>

          {error && (
            <div role="alert" style={{ padding: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 12 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#111827',
              color: '#fff',
              border: 0,
              borderRadius: 10,
              padding: '11px 16px',
              fontWeight: 800,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>

          <p style={{ color: '#4b5563', lineHeight: 1.6 }}>
            Sudah punya akun?{' '}
            <Link href="/login" style={{ color: '#1d4ed8', fontWeight: 700 }}>
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
