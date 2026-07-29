import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ReactNode } from 'react'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('profile_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.profile_completed) {
    redirect('/complete-profile')
  }

  return <>{children}</>
}
