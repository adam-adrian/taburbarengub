'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { Database } from '@/lib/types/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']

type ProfileFormState = {
  nama: string
  nama_panggilan: string
  no_hp: string
  usia: string
  profesi: string
  domisili: string
}

function createInitialState(profile: UserProfile | null): ProfileFormState {
  return {
    nama: profile?.nama ?? '',
    nama_panggilan: profile?.nama_panggilan ?? '',
    no_hp: profile?.no_hp ?? '',
    usia: profile?.usia ? String(profile.usia) : '',
    profesi: profile?.profesi ?? '',
    domisili: profile?.domisili ?? '',
  }
}

export function CompleteProfileForm({
  profile,
  submitLabel = 'Simpan & Lihat Sesi',
  redirectTo = '/#sesi',
  onSuccess,
}: {
  profile: UserProfile | null
  submitLabel?: string
  redirectTo?: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<ProfileFormState>(() => createInitialState(profile))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(field: keyof ProfileFormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const usia = Number(form.usia)

    if (!form.nama.trim()) {
      setError('Nama lengkap wajib diisi')
      return
    }

    if (!form.no_hp.trim()) {
      setError('No. HP wajib diisi')
      return
    }

    if (!Number.isInteger(usia) || usia <= 0) {
      setError('Usia harus berupa angka lebih dari 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: form.nama,
          nama_panggilan: form.nama_panggilan,
          no_hp: form.no_hp,
          usia,
          profesi: form.profesi,
          domisili: form.domisili,
        }),
      })

      const result = (await response.json().catch(() => null)) as
        | { error?: unknown }
        | null

      if (!response.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : 'Gagal menyimpan profil, coba lagi'
        setError(message)
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
      router.refresh()
    } catch {
      setError('Tidak bisa terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
          <span style={{ fontWeight: 700 }}>Nama Lengkap</span>
          <input
            value={form.nama}
            onChange={updateField('nama')}
            autoComplete="name"
            required
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
          <span style={{ fontWeight: 700 }}>Nama Panggilan</span>
          <input
            value={form.nama_panggilan}
            onChange={updateField('nama_panggilan')}
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
          <span style={{ fontWeight: 700 }}>No. HP</span>
          <input
            value={form.no_hp}
            onChange={updateField('no_hp')}
            inputMode="tel"
            autoComplete="tel"
            required
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
          <span style={{ fontWeight: 700 }}>Usia</span>
          <input
            type="number"
            min={1}
            value={form.usia}
            onChange={updateField('usia')}
            required
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
          <span style={{ fontWeight: 700 }}>Profesi</span>
          <input
            value={form.profesi}
            onChange={updateField('profesi')}
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
          <span style={{ fontWeight: 700 }}>Domisili</span>
          <input
            value={form.domisili}
            onChange={updateField('domisili')}
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
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
          width: '100%',
          boxSizing: 'border-box',
          padding: '11px 16px',
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Menyimpan...' : submitLabel}
      </button>
    </form>
  )
}
