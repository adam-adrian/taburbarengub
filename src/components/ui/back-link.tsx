'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'
import { resolveParentRoute } from '@/lib/navigation/parent-routes'

// Client Component karena route asal cuma bisa dibaca lewat usePathname —
// Server Component sengaja nggak dikasih akses ke URL sekarang oleh Next.
// Komponennya daun (nggak ada state, nggak ada data), jadi tambahan JS-nya
// sebatas dirinya sendiri.
export function BackLink({ style }: { style?: CSSProperties }) {
  const pathname = usePathname()
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

  return (
    <Link href={parent.href} style={{ color: '#4b5563', ...style }}>
      ← Kembali ke {parent.label}
    </Link>
  )
}
