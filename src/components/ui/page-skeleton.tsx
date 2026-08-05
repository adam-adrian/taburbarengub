// Fallback bersama untuk semua loading.tsx. Shell-nya sengaja disamain persis
// dengan <main> tiap page (#fafafa/#171717) supaya nggak ada kedip warna pas
// konten asli masuk menggantikan skeleton.
//
// Sengaja dibikin polos: restyle bakal ganti seluruh style inline di app ini,
// jadi skeleton yang detail sekarang cuma nambah permukaan edit nanti.
export function PageSkeleton({ maxWidth = 760 }: { maxWidth?: number }) {
  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', color: '#171717' }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '40px 20px 80px' }}>
        <SkeletonBar width={140} height={14} />
        <div style={{ marginTop: 24 }}>
          <SkeletonBar width="60%" height={32} />
        </div>
        <div style={{ marginTop: 16 }}>
          <SkeletonBar width="100%" height={14} />
        </div>
        <div style={{ marginTop: 10 }}>
          <SkeletonBar width="85%" height={14} />
        </div>
        <div style={{ marginTop: 32 }}>
          <SkeletonBar width="100%" height={180} radius={18} />
        </div>
      </div>
    </main>
  )
}

function SkeletonBar({
  width,
  height,
  radius = 6,
}: {
  width: number | string
  height: number
  radius?: number
}) {
  return (
    <div
      aria-hidden
      style={{ width, height, borderRadius: radius, background: '#e5e7eb' }}
    />
  )
}
