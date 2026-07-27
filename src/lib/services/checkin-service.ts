import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type CheckInResult = Database['public']['Functions']['check_in_booking']['Returns'][number]

export class CheckInError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
  }
}

// Dipetakan dari SQLSTATE, bukan dari isi pesan — lihat alasan lengkapnya di
// booking-service.ts.
//
// 42501 datang dari dua arah dan keduanya memang 403: guard is_admin() di
// dalam fungsi, dan penolakan izin oleh Postgres sendiri untuk pemanggil yang
// tidak berhak. Yang kedua membawa pesan internal "permission denied for
// function check_in_booking", jadi penting kita mengganti kalimatnya di sini
// alih-alih meneruskannya ke layar staff.
const PETA_ERROR: Record<string, { pesan: string; status: number }> = {
  '42501': { pesan: 'Akses ditolak', status: 403 },
  TB201: { pesan: 'QR tidak valid', status: 404 },
  TB202: { pesan: 'QR sudah dipakai', status: 409 },
  TB203: { pesan: 'Booking tidak aktif', status: 409 },
}

export async function checkInBooking(
  supabase: SupabaseClient<Database>,
  qrToken: string
): Promise<CheckInResult> {
  const { data, error } = await supabase
    .rpc('check_in_booking', { p_qr_token: qrToken })
    .single()

  if (error) {
    const dikenal = error.code ? PETA_ERROR[error.code] : undefined

    if (dikenal) {
      throw new CheckInError(dikenal.pesan, dikenal.status)
    }

    console.error('check_in_booking: errcode tidak dikenal', error.code, error.message)
    throw new CheckInError('Gagal memproses check-in, coba lagi', 500)
  }

  return data as CheckInResult
}
