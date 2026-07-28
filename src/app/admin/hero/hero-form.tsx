'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { Database } from '@/lib/types/database.types'

type HeroContent = Database['public']['Tables']['hero_content']['Row']

type HeroFormState = {
  judul_acara: string
  filosofi_tabur: string
  tagline: string
  nama_pemateri: string
  bio_pemateri: string
  foto_pemateri_url: string
}

function createInitialState(hero: HeroContent | null): HeroFormState {
  return {
    judul_acara: hero?.judul_acara ?? 'Tabur Bareng UB',
    filosofi_tabur: hero?.filosofi_tabur ?? '',
    tagline: hero?.tagline ?? '',
    nama_pemateri: hero?.nama_pemateri ?? '',
    bio_pemateri: hero?.bio_pemateri ?? '',
    foto_pemateri_url: hero?.foto_pemateri_url ?? '',
  }
}

export function HeroForm({ hero }: { hero: HeroContent | null }) {
  const router = useRouter()
  const [form, setForm] = useState<HeroFormState>(() => createInitialState(hero))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField<K extends keyof HeroFormState>(field: K, value: HeroFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!form.judul_acara.trim()) {
      setError('Judul acara wajib diisi')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/hero', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const result = (await response.json().catch(() => null)) as
        | { error?: unknown }
        | null

      if (!response.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : 'Gagal menyimpan konten hero, coba lagi'
        setError(message)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Tidak bisa terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Judul Acara</span>
        <input
          value={form.judul_acara}
          onChange={(event) => updateField('judul_acara', event.target.value)}
          required
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Filosofi Tabur</span>
        <textarea
          value={form.filosofi_tabur}
          onChange={(event) => updateField('filosofi_tabur', event.target.value)}
          rows={4}
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db', resize: 'vertical' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Tagline</span>
        <textarea
          value={form.tagline}
          onChange={(event) => updateField('tagline', event.target.value)}
          rows={3}
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db', resize: 'vertical' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Nama Pemateri</span>
        <input
          value={form.nama_pemateri}
          onChange={(event) => updateField('nama_pemateri', event.target.value)}
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Bio Pemateri</span>
        <textarea
          value={form.bio_pemateri}
          onChange={(event) => updateField('bio_pemateri', event.target.value)}
          rows={5}
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db', resize: 'vertical' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>URL Foto Pemateri</span>
        <input
          value={form.foto_pemateri_url}
          onChange={(event) => updateField('foto_pemateri_url', event.target.value)}
          placeholder="https://..."
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Kosongkan jika belum ada foto. Untuk sementara gunakan URL gambar publik.
        </span>
      </label>

      {error && (
        <div role="alert" style={{ padding: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 12 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: 'fit-content',
          background: loading ? '#9ca3af' : '#111827',
          color: '#fff',
          border: 0,
          borderRadius: 10,
          padding: '11px 16px',
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Menyimpan...' : 'Simpan Konten Hero'}
      </button>
    </form>
  )
}
