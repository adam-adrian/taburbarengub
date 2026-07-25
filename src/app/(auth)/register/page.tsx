'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
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
    <form onSubmit={handleSubmit}>
      <h1>Daftar Akun</h1>

      <label>
        Nama
        <input value={form.nama} onChange={updateField('nama')} required />
      </label>

      <label>
        Email
        <input type="email" value={form.email} onChange={updateField('email')} required />
      </label>

      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={updateField('password')}
          minLength={8}
          required
        />
      </label>

      <label>
        No. HP
        <input value={form.no_hp} onChange={updateField('no_hp')} required />
      </label>

      <label>
        Usia
        {/* type="number" + required — WAJIB diisi angka, jangan sampai
            kosong. Trigger di database nge-cast usia jadi integer;
            kalau string kosong yang masuk, cast-nya error dan
            signup gagal dengan pesan yang membingungkan. */}
        <input
          type="number"
          min={1}
          value={form.usia}
          onChange={updateField('usia')}
          required
        />
      </label>

      <label>
        Profesi
        <input value={form.profesi} onChange={updateField('profesi')} />
      </label>

      <label>
        Domisili
        <input value={form.domisili} onChange={updateField('domisili')} />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Memproses...' : 'Daftar'}
      </button>
    </form>
  )
}
