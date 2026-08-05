'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { CSSProperties, MouseEvent } from 'react'
import { canGoBack, notifyRouteReplaced } from '@/lib/navigation/history-depth'
import { resolveParentRoute } from '@/lib/navigation/parent-routes'

// Client Component karena route asal cuma bisa dibaca lewat usePathname —
// Server Component sengaja nggak dikasih akses ke URL sekarang oleh Next.
// Komponennya daun (nggak ada state, nggak ada data), jadi tambahan JS-nya
// sebatas dirinya sendiri.
export function BackLink({ style }: { style?: CSSProperties }) {
  const pathname = usePathname()
  const router = useRouter()
  const parent = resolveParentRoute(pathname)

  if (!parent) {
    if (process.env.NODE_ENV !== 'production') {
      // Bukan kondisi yang bisa dipulihkan saat runtime — ini artinya ada route
      // baru yang belum didaftarkan di PARENT_ROUTES. Berisik di dev, diam di
      // production.
      console.warn(`[BackLink] route "${pathname}" belum punya parent di PARENT_ROUTES`)
    }
    return null
  }

  // Diikat ke const supaya kebaca di dalam handler: penyempitan tipe dari guard
  // di atas nggak nembus ke deklarasi function.
  const parentHref = parent.href

  // href tetap dipasang beneran, bukan '#': dia fallback yang bener kalau JS
  // belum jalan, dan bikin klik-tengah / buka-di-tab-baru / salin alamat tetap
  // berfungsi. Handler di bawah cuma nge-upgrade klik kiri biasa.
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isPlainLeftClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    if (!isPlainLeftClick) return

    event.preventDefault()

    // canGoBack dibaca pas klik, bukan pas render: BackLink di halaman tujuan
    // ke-render sebelum efek tracker sempat naikin depth, jadi bacaan saat
    // render selalu telat satu langkah.
    if (canGoBack()) {
      // back() mulangin halaman dari client cache Next — nol request server, dan
      // posisi scroll ke-restore. Untuk tujuan yang dirender dinamis (semua
      // kecuali /login) itu ngilangin roundtrip yang loading.tsx cuma bisa
      // ditutupi skeleton.
      router.back()
      return
    }

    // Fallback WAJIB replace, bukan push (bukan pula membiarkan href jalan
    // sendiri — href itu push).
    //
    // Push bikin loop: entri maju yang ditambahin jadi entri "di belakang"
    // halaman parent, jadi klik berikutnya di parent — yang depth-nya sekarang
    // > 0 — malah back() ke anak yang barusan ditinggal, lalu push lagi, terus
    // begitu. Kejadian nyata cuma dengan dua klik dari deep link QR.
    //
    // Konsekuensi yang diterima: sesudah naik lewat replace, tombol back browser
    // nggak balik ke halaman asal. Itu memang semantik Up dari entry point luar
    // — posisinya ditukar, bukan ditumpuk.
    notifyRouteReplaced()
    router.replace(parentHref)
  }

  return (
    <Link href={parent.href} onClick={handleClick} style={{ color: '#4b5563', ...style }}>
      ← Kembali ke {parent.label}
    </Link>
  )
}
