import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TicketQrCode } from './ticket-qr-code'

type BookingStatus = 'booked' | 'checked_in' | 'cancelled' | string

type SessionSummary = {
  id: string
  nama_sesi: string
  tipe: string
  tanggal_waktu: string
  lokasi_atau_link: string | null
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function statusLabel(status: BookingStatus) {
  switch (status) {
    case 'booked':
      return 'Booked'
    case 'checked_in':
      return 'Checked-in'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status
  }
}

function statusStyle(status: BookingStatus) {
  if (status === 'checked_in') {
    return {
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0',
    } as const
  }

  if (status === 'cancelled') {
    return {
      background: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca',
    } as const
  }

  return {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
  } as const
}

export default async function TiketSayaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, session_id, status, qr_token, created_at, checked_in_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const safeBookings = bookings ?? []
  const sessionIds = Array.from(new Set(safeBookings.map((booking) => booking.session_id)))

  const { data: sessions } = sessionIds.length
    ? await supabase
        .from('event_sessions')
        .select('id, nama_sesi, tipe, tanggal_waktu, lokasi_atau_link')
        .in('id', sessionIds)
    : { data: [] }

  const sessionById = new Map<string, SessionSummary>(
    (sessions ?? []).map((session) => [session.id, session])
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <Link href="/" style={{ color: '#4b5563' }}>
              ← Kembali ke landing page
            </Link>
            <h1 style={{ fontSize: 36, marginTop: 16, letterSpacing: -0.8 }}>Tiket Saya</h1>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              QR ini ditunjukkan ke staff saat check-in di venue.
            </p>
          </div>
        </div>

        {bookingsError && (
          <div
            role="alert"
            style={{
              marginTop: 24,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#991b1b',
              padding: 16,
              borderRadius: 12,
            }}
          >
            Gagal memuat tiket. Coba refresh halaman.
          </div>
        )}

        {!bookingsError && safeBookings.length === 0 && (
          <div
            style={{
              marginTop: 24,
              border: '1px dashed #d1d5db',
              background: '#fff',
              padding: 24,
              borderRadius: 14,
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Belum ada tiket</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
              Kamu belum booking sesi apa pun. Pilih sesi offline yang tersedia dari landing page.
            </p>
            <Link
              href="/#sesi"
              style={{
                display: 'inline-block',
                background: '#111827',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: 10,
                fontWeight: 700,
              }}
            >
              Lihat Sesi
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gap: 18, marginTop: 24 }}>
          {safeBookings.map((booking) => {
            const session = sessionById.get(booking.session_id)
            const canShowQr = booking.status !== 'cancelled'

            return (
              <article
                key={booking.id}
                style={{
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  borderRadius: 18,
                  padding: 24,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 24,
                  alignItems: 'center',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      ...statusStyle(booking.status),
                    }}
                  >
                    {statusLabel(booking.status)}
                  </span>

                  <h2 style={{ fontSize: 24, marginTop: 14, marginBottom: 10 }}>
                    {session?.nama_sesi ?? 'Sesi tidak ditemukan'}
                  </h2>

                  {session ? (
                    <div style={{ color: '#4b5563', lineHeight: 1.7 }}>
                      <p>{formatDateTime(session.tanggal_waktu)} WIB</p>
                      {session.lokasi_atau_link && <p>{session.lokasi_atau_link}</p>}
                      <p style={{ marginTop: 8, textTransform: 'capitalize' }}>Tipe: {session.tipe}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#b91c1c', lineHeight: 1.6 }}>
                      Data sesi tidak bisa dimuat. Hubungi panitia.
                    </p>
                  )}

                  <p style={{ color: '#6b7280', fontSize: 13, marginTop: 14 }}>
                    Booking ID: {booking.id}
                  </p>

                  {booking.checked_in_at && (
                    <p style={{ color: '#047857', fontSize: 13, marginTop: 6 }}>
                      Check-in: {formatDateTime(booking.checked_in_at)} WIB
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
                  {canShowQr ? (
                    <>
                      <TicketQrCode value={booking.qr_token} />
                      <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
                        Jangan bagikan QR ini ke orang lain.
                      </p>
                    </>
                  ) : (
                    <p style={{ color: '#6b7280', textAlign: 'center' }}>
                      Tiket dibatalkan, QR tidak aktif.
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
