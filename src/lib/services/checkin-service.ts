import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type CheckInResult = Database['public']['Functions']['check_in_booking']['Returns'][number]

export class CheckInError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
  }
}

export async function checkInBooking(
  supabase: SupabaseClient<Database>,
  qrToken: string
): Promise<CheckInResult> {
  const { data, error } = await supabase
    .rpc('check_in_booking', { p_qr_token: qrToken })
    .single()

  if (error) {
    if (error.message.includes('Akses ditolak') || error.code === '42501') {
      throw new CheckInError('Akses ditolak', 403)
    }
    if (error.message.includes('QR tidak valid')) {
      throw new CheckInError('QR tidak valid', 404)
    }
    if (error.message.includes('QR sudah dipakai')) {
      throw new CheckInError('QR sudah dipakai', 409)
    }
    if (error.message.includes('Booking tidak aktif')) {
      throw new CheckInError('Booking tidak aktif', 409)
    }

    throw new CheckInError('Gagal memproses check-in, coba lagi', 500)
  }

  return data as CheckInResult
}
