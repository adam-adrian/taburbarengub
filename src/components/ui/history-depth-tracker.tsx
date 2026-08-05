'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { notifyPathnameChanged, notifyPopState } from '@/lib/navigation/history-depth'

// Dipasang sekali di root layout. Nggak me-render apa pun — cuma ngamatin
// perubahan route buat ngasih makan penghitung kedalaman history.
export function HistoryDepthTracker() {
  const pathname = usePathname()
  const isFirstRun = useRef(true)

  useEffect(() => {
    const handlePopState = () => notifyPopState()
    // popstate nyala duluan sebelum router Next nyetel pathname baru, jadi pas
    // efek pathname di bawah jalan, penandanya udah siap dibaca.
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    // Render pertama itu halaman yang lagi dibuka, bukan navigasi. Ngitungnya
    // bikin deep link kelihatan seolah punya history in-app.
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    notifyPathnameChanged()
  }, [pathname])

  return null
}
