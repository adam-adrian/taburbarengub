import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import type { CompleteProfileInput } from '@/lib/validators/profile.schema'

type UserProfile = Database['public']['Tables']['users']['Row']

export class ProfileError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
  }
}

const PETA_ERROR: Record<string, { pesan: string; status: number }> = {
  '28000': { pesan: 'Kamu harus login dulu', status: 401 },
  TB401: { pesan: 'Nama lengkap wajib diisi', status: 400 },
  TB402: { pesan: 'No. HP wajib diisi', status: 400 },
  TB403: { pesan: 'Usia wajib diisi dan harus lebih dari 0', status: 400 },
  TB404: { pesan: 'Profile tidak ditemukan', status: 404 },
}

export async function completeUserProfile(
  supabase: SupabaseClient<Database>,
  input: CompleteProfileInput
): Promise<UserProfile> {
  const { data, error } = await supabase
    .rpc('complete_user_profile', {
      p_nama: input.nama,
      p_nama_panggilan: input.nama_panggilan,
      p_no_hp: input.no_hp,
      p_usia: input.usia,
      p_profesi: input.profesi,
      p_domisili: input.domisili,
    })
    .single()

  if (error) {
    const dikenal = error.code ? PETA_ERROR[error.code] : undefined

    if (dikenal) {
      throw new ProfileError(dikenal.pesan, dikenal.status)
    }

    console.error('complete_user_profile: errcode tidak dikenal', error.code, error.message)
    throw new ProfileError('Gagal menyimpan profil, coba lagi', 500)
  }

  return data as UserProfile
}
