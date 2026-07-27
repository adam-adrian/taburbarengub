import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function requireAdmin(
  supabase: SupabaseClient<Database>
): Promise<User> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new AuthError('Kamu harus login dulu', 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw new AuthError('Akses ditolak', 403)
  }

  return user
}
