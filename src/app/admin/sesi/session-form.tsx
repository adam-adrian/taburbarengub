'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type EventSession = Database['public']['Tables']['event_sessions']['Row']

type SessionFormState = {
  nama_sesi: string
  tipe: 'offline' | 'online'
  tanggal_waktu: string
  lokasi_atau_link: string
  deskripsi: string
  kapasitas: string
  status: 'draft' | 'published' | 'cancelled'
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function createInitialState(session?: EventSession): SessionFormState {
  return {
    nama_sesi: session?.nama_sesi ?? '',
    tipe: session?.tipe === 'online' ? 'online' : 'offline',
    tanggal_waktu: session ? toDateTimeLocal(session.tanggal_waktu) : '',
    lokasi_atau_link: session?.lokasi_atau_link ?? '',
    deskripsi: session?.deskripsi ?? '',
    kapasitas: String(session?.kapasitas ?? 60),
    status:
      session?.status === 'published' || session?.status === 'cancelled'
        ? session.status
        : 'draft',
  }
}

export function SessionForm({ session }: { session?: EventSession }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<SessionFormState>(() => createInitialState(session))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(session)
  const kuotaTerisi = session?.kuota_terisi ?? 0

  function updateField<K extends keyof SessionFormState>(field: K, value: SessionFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const kapasitas = Number(form.kapasitas)

    if (!form.nama_sesi.trim()) {
      setError('Nama sesi wajib diisi')
      return
    }

    if (!form.tanggal_waktu) {
      setError('Tanggal dan waktu wajib diisi')
      return
    }

    if (!Number.isInteger(kapasitas) || kapasitas <= 0) {
      setError('Kapasitas harus berupa angka lebih dari 0')
      return
    }

    if (isEditing && kapasitas < kuotaTerisi) {
      setError(`Kapasitas tidak boleh lebih kecil dari kuota terisi saat ini (${kuotaTerisi})`)
      return
    }

    setLoading(true)

    const payload = {
      nama_sesi: form.nama_sesi.trim(),
      tipe: form.tipe,
      tanggal_waktu: new Date(form.tanggal_waktu).toISOString(),
      lokasi_atau_link: emptyToNull(form.lokasi_atau_link),
      deskripsi: emptyToNull(form.deskripsi),
      kapasitas,
      status: form.status,
    }

    const { error: saveError } = isEditing
      ? await supabase.from('event_sessions').update(payload).eq('id', session!.id)
      : await supabase.from('event_sessions').insert(payload)

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    router.push('/admin/sesi')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Nama Sesi</span>
        <input
          value={form.nama_sesi}
          onChange={(event) => updateField('nama_sesi', event.target.value)}
          required
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Tipe</span>
          <select
            value={form.tipe}
            onChange={(event) => updateField('tipe', event.target.value as SessionFormState['tipe'])}
            style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField('status', event.target.value as SessionFormState['status'])}
            style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Tanggal & Waktu</span>
        <input
          type="datetime-local"
          value={form.tanggal_waktu}
          onChange={(event) => updateField('tanggal_waktu', event.target.value)}
          required
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
        <span style={{ color: '#6b7280', fontSize: 13 }}>Disimpan sebagai timestamptz di database.</span>
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Lokasi atau Link/Catatan</span>
        <input
          value={form.lokasi_atau_link}
          onChange={(event) => updateField('lokasi_atau_link', event.target.value)}
          placeholder="Contoh: Aula Masjid / catatan online"
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Deskripsi</span>
        <textarea
          value={form.deskripsi}
          onChange={(event) => updateField('deskripsi', event.target.value)}
          rows={5}
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db', resize: 'vertical' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Kapasitas</span>
        <input
          type="number"
          min={Math.max(1, kuotaTerisi)}
          value={form.kapasitas}
          onChange={(event) => updateField('kapasitas', event.target.value)}
          required
          style={{ padding: 11, borderRadius: 10, border: '1px solid #d1d5db' }}
        />
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Kuota terisi saat ini: {kuotaTerisi}. Field ini read-only dan dikelola sistem booking.
        </span>
      </label>

      {error && (
        <div role="alert" style={{ padding: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Sesi'}
        </button>
      </div>
    </form>
  )
}
