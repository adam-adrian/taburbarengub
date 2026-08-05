import { PageSkeleton } from '@/components/ui/page-skeleton'

// Nutup navigasi antar-halaman admin. Boundary di app/loading.tsx nggak kepakai
// untuk ini: pada client navigation Next cuma render ulang di bawah layout yang
// di-share, dan untuk sesama /admin/* itu admin/layout.tsx — app/loading.tsx ada
// di atasnya.
//
// admin/sesi/ nggak butuh loading.tsx sendiri: nggak ada layout.tsx di situ,
// jadi layout ter-dalam yang di-share /admin/sesi dan /admin/sesi/[id] tetap
// admin/layout.tsx, dan boundary ini sudah menutupinya.
export default function Loading() {
  return <PageSkeleton />
}
