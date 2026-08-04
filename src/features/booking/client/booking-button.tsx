'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function BookingButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBooking() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: { id?: unknown }; error?: unknown }
        | null

      if (!response.ok) {
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : 'Gagal membuat booking, coba lagi'
        setError(message)
        return
      }

      if (typeof payload?.data?.id === 'string') {
        router.push(`/tiket-saya/${payload.data.id}`)
      } else {
        router.push('/tiket-saya')
      }
      router.refresh()
    } catch {
      setError('Tidak bisa terhubung ke server, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        onClick={handleBooking}
        disabled={loading}
        style={{
          background: loading ? '#6b7280' : '#111827',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 10,
          fontWeight: 700,
          border: 0,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Memproses booking...' : 'Booking Seat'}
      </button>

      {error && (
        <p role="alert" style={{ color: '#b91c1c', lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </div>
  )
}
