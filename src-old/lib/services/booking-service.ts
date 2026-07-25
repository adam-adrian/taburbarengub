import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type Booking = Database['public']['Tables']['bookings']['Row']

// Error class sendiri biar API route bisa nentuin HTTP status code
// yang pas tanpa nebak-nebak dari isi pesan error.
export class BookingError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
  }
}

function generateQrToken(): string {
  // 32 byte random — JANGAN pakai booking id atau angka urut,
  // itu bisa ditebak orang buat check-in palsu.
  return randomBytes(32).toString('hex')
}

export async function createBooking(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<Booking> {
  const qrToken = generateQrToken()

  // Manggil RPC di database (lihat schema-fase1.sql: create_booking).
  // Semua logic "cek kuota, kunci row, insert" jalan atomic di sana —
  // di sini kita cuma manggil dan nangkep hasilnya.
  const { data, error } = await supabase
    .rpc('create_booking', {
      p_session_id: sessionId,
      p_qr_token: qrToken,
    })
    .single()

  if (error) {
    // Pesan dari `raise exception` di Postgres nyampe ke sini persis
    if (error.message.includes('harus login')) {
      throw new BookingError('Kamu harus login dulu', 401)
    }
    if (error.message.includes('Sesi tidak ditemukan')) {
      throw new BookingError('Sesi tidak ditemukan', 404)
    }
    if (error.message.includes('belum tersedia untuk booking')) {
      throw new BookingError('Sesi ini belum dibuka untuk booking', 403)
    }
    if (error.message.includes('belum bisa dibooking')) {
      throw new BookingError('Sesi online belum bisa dibooking di Fase 1', 403)
    }
    if (error.message.includes('Kuota penuh')) {
      throw new BookingError('Kuota sesi ini sudah penuh', 409)
    }
    if (error.code === '23505' || error.message.includes('sudah booking')) {
      // nabrak constraint unique_user_per_session
      throw new BookingError('Kamu sudah booking sesi ini sebelumnya', 409)
    }
    throw new BookingError('Gagal membuat booking, coba lagi', 500)
  }

  return data as Booking
}
