'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      // Pesan generik sengaja, jangan bocorin apakah email-nya
      // terdaftar atau nggak — itu celah buat orang enumerasi akun.
      setError('Email atau password salah')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Masuk</h1>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Memproses...' : 'Masuk'}
      </button>

      <div style={{ display: 'grid', gap: 8 }}>
        <p>
          <Link href="/forgot-password">Lupa password?</Link>
        </p>
        <p>
          Belum punya akun? <Link href="/register">Daftar</Link>
        </p>
      </div>
    </form>
  )
}
