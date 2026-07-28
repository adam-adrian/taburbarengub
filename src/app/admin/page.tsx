import Link from 'next/link'

const menuItems = [
  {
    href: '/admin/sesi',
    title: 'Kelola Sesi',
    description: 'Lihat daftar sesi, status publikasi, dan kuota peserta.',
  },
  {
    href: '/admin/hero',
    title: 'Konten Landing',
    description: 'Edit judul, filosofi, tagline, dan profil pemateri di landing page.',
  },
  {
    href: '/admin/scanner',
    title: 'Scan QR',
    description: 'Tool staff untuk check-in peserta di venue.',
  },
  {
    href: '/admin/peserta',
    title: 'Daftar Peserta',
    description: 'Lihat peserta per sesi dan status check-in.',
  },
]

export default function AdminDashboardPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <Link href="/" style={{ color: '#4b5563' }}>
              ← Kembali ke landing page
            </Link>
            <h1 style={{ fontSize: 36, marginTop: 16, letterSpacing: -0.8 }}>Admin Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              Panel awal untuk mengelola sesi, peserta, dan check-in event.
            </p>
          </div>
          <Link
            href="/logout"
            style={{
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            Keluar
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {menuItems.map((item) => {
            const card = (
              <article
                style={{
                  height: '100%',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>{item.title}</h2>
                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{item.description}</p>
              </article>
            )

            return (
              <Link key={item.href} href={item.href} style={{ display: 'block' }}>
                {card}
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
