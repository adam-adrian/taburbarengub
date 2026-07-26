import Link from 'next/link'

const menuItems = [
  {
    href: '/admin/sesi',
    title: 'Kelola Sesi',
    description: 'Lihat daftar sesi, status publikasi, dan kuota peserta.',
  },
  {
    href: '/admin/scanner',
    title: 'Scan QR',
    description: 'Tool staff untuk check-in peserta di venue.',
  },
  {
    href: '/admin/peserta',
    title: 'Daftar Peserta',
    description: 'Lihat peserta per sesi dan status check-in. Segera dibuat.',
    disabled: true,
  },
]

export default function AdminDashboardPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ color: '#4b5563' }}>
            ← Kembali ke landing page
          </Link>
          <h1 style={{ fontSize: 36, marginTop: 16, letterSpacing: -0.8 }}>Admin Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>
            Panel awal untuk mengelola sesi, peserta, dan check-in event.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {menuItems.map((item) => {
            const card = (
              <article
                style={{
                  height: '100%',
                  border: '1px solid #e5e7eb',
                  background: item.disabled ? '#f9fafb' : '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  opacity: item.disabled ? 0.65 : 1,
                }}
              >
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>{item.title}</h2>
                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{item.description}</p>
              </article>
            )

            if (item.disabled) {
              return <div key={item.href}>{card}</div>
            }

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
