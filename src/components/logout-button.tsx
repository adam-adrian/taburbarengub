'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        background: compact ? 'transparent' : '#ffffff',
        color: compact ? '#4b5563' : '#111827',
        border: compact ? 0 : '1px solid #d1d5db',
        borderRadius: compact ? 0 : 10,
        padding: compact ? 0 : '10px 14px',
        font: 'inherit',
        fontSize: compact ? 14 : undefined,
        fontWeight: compact ? 400 : 800,
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? 'Keluar...' : 'Keluar'}
    </button>
  )
}
