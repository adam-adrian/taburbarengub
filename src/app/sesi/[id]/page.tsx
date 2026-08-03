import Link from 'next/link'
import { ProfileCompletionPrompt } from '@/app/complete-profile/profile-completion-prompt'
import { BookingButton } from './booking-button'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: session, error } = await supabase
    .from('event_sessions')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !session) {
    notFound()
  }

  const [{ data: existingBooking }, { data: profile }] = user
    ? await Promise.all([
        supabase
          .from('bookings')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('session_id', session.id)
          .maybeSingle(),
        supabase
          .from('users')
          .select('nama, nama_panggilan, no_hp, usia, profesi, domisili, profile_completed')
          .eq('id', user.id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }]

  const sisaKuota = Math.max(session.kapasitas - session.kuota_terisi, 0)
  const isOffline = session.tipe === 'offline'
  const isFull = sisaKuota <= 0
  const isPast = new Date(session.tanggal_waktu) <= new Date()

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>
        <Link href="/" style={{ color: '#4b5563' }}>
          ← Kembali ke landing page
        </Link>

        <article
          style={{
            marginTop: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            background: '#ffffff',
            padding: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontWeight: 700, marginBottom: 8 }}>
                {session.tipe === 'offline' ? 'Sesi Offline' : 'Sesi Online'}
              </p>
              <h1 style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: -0.8 }}>
                {session.nama_sesi}
              </h1>
            </div>
            <span
              style={{
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 800,
                background: session.tipe === 'offline' ? '#ecfdf5' : '#eff6ff',
                color: session.tipe === 'offline' ? '#047857' : '#1d4ed8',
                border: `1px solid ${session.tipe === 'offline' ? '#a7f3d0' : '#bfdbfe'}`,
              }}
            >
              {session.tipe.toUpperCase()}
            </span>
          </div>

          <dl style={{ display: 'grid', gap: 16, marginTop: 28 }}>
            <div>
              <dt style={{ fontSize: 13, color: '#6b7280', fontWeight: 700 }}>Tanggal & waktu</dt>
              <dd style={{ marginTop: 4 }}>{formatDateTime(session.tanggal_waktu)} WIB</dd>
            </div>

            {session.lokasi_atau_link && (
              <div>
                <dt style={{ fontSize: 13, color: '#6b7280', fontWeight: 700 }}>
                  {session.tipe === 'offline' ? 'Lokasi' : 'Catatan online'}
                </dt>
                <dd style={{ marginTop: 4 }}>{session.lokasi_atau_link}</dd>
              </div>
            )}

            <div>
              <dt style={{ fontSize: 13, color: '#6b7280', fontWeight: 700 }}>Kuota</dt>
              <dd style={{ marginTop: 4 }}>
                {isPast
                  ? 'Sesi sudah selesai'
                  : session.tipe === 'offline'
                    ? `${sisaKuota} seat tersisa dari ${session.kapasitas}`
                    : 'Sesi online belum dibuka untuk booking di Fase 1'}
              </dd>
            </div>
          </dl>

          {session.deskripsi && (
            <section style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Deskripsi</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.8 }}>{session.deskripsi}</p>
            </section>
          )}

          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isPast ? (
              <button disabled style={{ padding: '12px 16px', borderRadius: 10 }}>
                Sesi sudah selesai
              </button>
            ) : !isOffline ? (
              <button disabled style={{ padding: '12px 16px', borderRadius: 10 }}>
                Sesi online terkunci
              </button>
            ) : isFull ? (
              <button disabled style={{ padding: '12px 16px', borderRadius: 10 }}>
                Kuota penuh
              </button>
            ) : existingBooking ? (
              <Link
                href={`/tiket-saya/${existingBooking.id}`}
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                  border: '1px solid #a7f3d0',
                }}
              >
                Kamu sudah booking — lihat tiket
              </Link>
            ) : user && !profile?.profile_completed ? (
              <ProfileCompletionPrompt
                profile={profile ?? null}
                autoOpen={false}
                showDismissedBanner={false}
                triggerLabel="Lengkapi Profil untuk Booking"
              />
            ) : user ? (
              <BookingButton sessionId={session.id} />
            ) : (
              <Link
                href="/login"
                style={{
                  background: '#111827',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                Masuk untuk Booking
              </Link>
            )}
          </div>
        </article>
      </div>
    </main>
  )
}
