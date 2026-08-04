import Link from 'next/link'
import styles from './sesi.module.css'
import { createClient } from '@/lib/supabase/server'
import { formatDateTimeCompact } from '@/lib/format'

function statusStyle(status: string) {
  if (status === 'published') {
    return { background: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
  }

  if (status === 'cancelled') {
    return { background: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  }

  return { background: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
}

function typeStyle(type: string) {
  if (type === 'offline') {
    return { background: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
  }

  return { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
}

export default async function AdminSesiPage() {
  const supabase = await createClient()

  const { data: sessions, error } = await supabase
    .from('event_sessions')
    .select('*')
    .order('tanggal_waktu', { ascending: true })

  const safeSessions = sessions ?? []

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <div>
            <Link href="/admin" style={{ color: '#4b5563' }}>
              ← Kembali ke admin
            </Link>
            <h1 style={{ fontSize: 36, marginTop: 16, letterSpacing: -0.8 }}>Kelola Sesi</h1>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              Daftar semua sesi event. Kuota terisi bersifat read-only dan dikelola sistem booking.
            </p>
          </div>

          <Link
            href="/admin/sesi/new"
            style={{
              background: '#111827',
              color: '#fff',
              padding: '11px 15px',
              borderRadius: 10,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            + Tambah Sesi
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#991b1b',
              padding: 16,
              borderRadius: 12,
              marginBottom: 18,
            }}
          >
            Gagal memuat sesi. Pastikan akun kamu punya role admin.
          </div>
        )}

        {!error && safeSessions.length === 0 && (
          <div style={{ border: '1px dashed #d1d5db', background: '#fff', padding: 24, borderRadius: 14 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Belum ada sesi</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
              Tambahkan sesi pertama supaya bisa tampil di landing page setelah statusnya published.
            </p>
          </div>
        )}

        {safeSessions.length > 0 && (
          <>
          <div className={styles.desktopOnly} style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>Nama Sesi</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>Tipe</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>Tanggal</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>Kuota</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {safeSessions.map((session) => {
                  const sisaKuota = Math.max(session.kapasitas - session.kuota_terisi, 0)
                  const currentStatusStyle = statusStyle(session.status)
                  const currentTypeStyle = typeStyle(session.tipe)

                  return (
                    <tr key={session.id}>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        <strong>{session.nama_sesi}</strong>
                        {session.lokasi_atau_link && (
                          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{session.lokasi_atau_link}</p>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            borderRadius: 999,
                            padding: '4px 9px',
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            background: currentTypeStyle.background,
                            color: currentTypeStyle.color,
                            border: `1px solid ${currentTypeStyle.border}`,
                          }}
                        >
                          {session.tipe}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        {formatDateTimeCompact(session.tanggal_waktu)} WIB
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        <strong>{session.kuota_terisi}</strong> / {session.kapasitas}
                        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Sisa {sisaKuota}</p>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            borderRadius: 999,
                            padding: '4px 9px',
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            background: currentStatusStyle.background,
                            color: currentStatusStyle.color,
                            border: `1px solid ${currentStatusStyle.border}`,
                          }}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <Link href={`/admin/sesi/${session.id}`} style={{ color: '#1d4ed8', fontWeight: 700 }}>
                            Detail
                          </Link>
                          <Link href={`/admin/sesi/${session.id}/edit`} style={{ color: '#111827', fontWeight: 700 }}>
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileOnly}>
            <div className={styles.sessionCards}>
              {safeSessions.map((session) => {
                const sisaKuota = Math.max(session.kapasitas - session.kuota_terisi, 0)
                const currentStatusStyle = statusStyle(session.status)
                const currentTypeStyle = typeStyle(session.tipe)

                return (
                  <article key={session.id} className={styles.sessionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                      <h2 style={{ fontSize: 20, lineHeight: 1.3 }}>{session.nama_sesi}</h2>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            borderRadius: 999,
                            padding: '4px 9px',
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            background: currentTypeStyle.background,
                            color: currentTypeStyle.color,
                            border: `1px solid ${currentTypeStyle.border}`,
                          }}
                        >
                          {session.tipe}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            borderRadius: 999,
                            padding: '4px 9px',
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            background: currentStatusStyle.background,
                            color: currentStatusStyle.color,
                            border: `1px solid ${currentStatusStyle.border}`,
                          }}
                        >
                          {session.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ color: '#4b5563', lineHeight: 1.6 }}>
                      <p>{formatDateTimeCompact(session.tanggal_waktu)} WIB</p>
                      {session.lokasi_atau_link && <p>{session.lokasi_atau_link}</p>}
                    </div>

                    <p style={{ color: '#374151', marginTop: 12 }}>
                      Kuota: <strong>{session.kuota_terisi}</strong> / {session.kapasitas} · Sisa {sisaKuota}
                    </p>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                      <Link href={`/admin/sesi/${session.id}`} style={{ color: '#1d4ed8', fontWeight: 800 }}>
                        Detail
                      </Link>
                      <Link href={`/admin/sesi/${session.id}/edit`} style={{ color: '#111827', fontWeight: 800 }}>
                        Edit
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
          </>
        )}
      </div>
    </main>
  )
}
