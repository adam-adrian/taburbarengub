import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function sessionTypeLabel(type: string) {
  return type === 'offline' ? 'Offline' : 'Online'
}

function sessionTypeStyle(type: string) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 700,
    background: type === 'offline' ? '#ecfdf5' : '#eff6ff',
    color: type === 'offline' ? '#047857' : '#1d4ed8',
    border: `1px solid ${type === 'offline' ? '#a7f3d0' : '#bfdbfe'}`,
  } as const
}

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: hero }, { data: sessions, error: sessionsError }, { data: profile }] =
    await Promise.all([
      supabase.from('hero_content').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('event_sessions')
        .select('*')
        .eq('status', 'published')
        .order('tanggal_waktu', { ascending: true }),
      user
        ? supabase.from('users').select('role').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

  const upcomingSessions = sessions ?? []
  const isAdmin = profile?.role === 'admin'

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Link href="/" style={{ fontWeight: 800, fontSize: 18 }}>
            TaburBarengUB
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
            {user ? (
              <>
                <Link href="/tiket-saya">Tiket Saya</Link>
                {isAdmin && <Link href="/admin">Admin</Link>}
              </>
            ) : (
              <>
                <Link href="/login">Masuk</Link>
                <Link
                  href="/register"
                  style={{
                    background: '#111827',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  Daftar
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section style={{ background: '#ffffff' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '72px 20px 56px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ color: '#6b7280', fontWeight: 700, marginBottom: 12 }}>
              Program kajian berkelanjutan
            </p>
            <h1 style={{ fontSize: 48, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 18 }}>
              {hero?.judul_acara ?? 'Tabur Bareng UB'}
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: '#374151', marginBottom: 24 }}>
              {hero?.tagline ?? 'Tadabbur kekuatan muslimin yang tertidur'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="#sesi"
                style={{
                  background: '#111827',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                Lihat Sesi
              </a>
              {!user && (
                <Link
                  href="/register"
                  style={{
                    background: '#f3f4f6',
                    color: '#111827',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  Buat Akun
                </Link>
              )}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 18,
              padding: 24,
              background: '#f9fafb',
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Filosofi Tabur</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.7, marginBottom: 24 }}>
              {hero?.filosofi_tabur ??
                'Tabur adalah ikhtiar menebar ilmu dan menumbuhkan kesadaran melalui tadabbur yang bertahap, terarah, dan konsisten.'}
            </p>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>
              {hero?.nama_pemateri ?? 'Ustadz Budi Ashari'}
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
              {hero?.bio_pemateri ??
                'Profil singkat pemateri utama akan ditampilkan di sini. Konten ini dikelola sebagai konten global landing page.'}
            </p>
          </div>
        </div>
      </section>

      <section id="sesi" style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 20px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 32, letterSpacing: -0.8, marginBottom: 8 }}>Sesi Mendatang</h2>
          <p style={{ color: '#6b7280' }}>
            Pilih sesi offline yang tersedia untuk melihat detail dan melakukan booking seat.
          </p>
        </div>

        {sessionsError && (
          <div role="alert" style={{ border: '1px solid #fecaca', background: '#fef2f2', padding: 16 }}>
            Gagal memuat sesi. Coba refresh halaman.
          </div>
        )}

        {!sessionsError && upcomingSessions.length === 0 && (
          <div style={{ border: '1px dashed #d1d5db', background: '#fff', padding: 24, borderRadius: 14 }}>
            Belum ada sesi published yang tersedia.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {upcomingSessions.map((session) => {
            const sisaKuota = Math.max(session.kapasitas - session.kuota_terisi, 0)
            const isOffline = session.tipe === 'offline'
            const isFull = sisaKuota <= 0

            return (
              <article
                key={session.id}
                style={{
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 20, lineHeight: 1.3 }}>{session.nama_sesi}</h3>
                  <span style={sessionTypeStyle(session.tipe)}>{sessionTypeLabel(session.tipe)}</span>
                </div>

                <div style={{ color: '#4b5563', lineHeight: 1.6 }}>
                  <p>{formatDateTime(session.tanggal_waktu)} WIB</p>
                  {session.lokasi_atau_link && <p>{session.lokasi_atau_link}</p>}
                </div>

                <p style={{ color: '#6b7280', lineHeight: 1.6, flex: 1 }}>
                  {session.deskripsi ?? 'Detail sesi akan ditampilkan di halaman detail.'}
                </p>

                <div style={{ fontSize: 14, color: '#374151' }}>
                  {isOffline ? (
                    <strong>
                      Sisa kuota: {sisaKuota} / {session.kapasitas}
                    </strong>
                  ) : (
                    <strong>Sesi online terkunci untuk Fase 1</strong>
                  )}
                </div>

                <Link
                  href={`/sesi/${session.id}`}
                  aria-disabled={!isOffline || isFull}
                  style={{
                    textAlign: 'center',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontWeight: 700,
                    background: !isOffline || isFull ? '#f3f4f6' : '#111827',
                    color: !isOffline || isFull ? '#9ca3af' : '#ffffff',
                    pointerEvents: !isOffline || isFull ? 'none' : 'auto',
                  }}
                >
                  {!isOffline ? 'Terkunci' : isFull ? 'Kuota Penuh' : 'Lihat Detail'}
                </Link>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
