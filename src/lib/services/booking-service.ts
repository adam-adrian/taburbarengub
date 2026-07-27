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

// Dipetakan dari SQLSTATE, bukan dari isi pesan.
//
// Sebelumnya pemetaan memakai error.message.includes('...') terhadap teks
// Bahasa Indonesia yang dimiliki SQL. Itu rapuh dua arah: mengubah satu kata
// di `raise exception` membuat mapping-nya diam-diam jatuh ke 500, dan copy
// user-facing jadi hidup di dua tempat dengan bunyi yang berbeda. Kode P0001
// juga dipakai untuk empat kondisi berbeda sehingga tidak bisa dibedakan.
//
// Sekarang database memiliki KODE, aplikasi memiliki KALIMAT. Itu yang bikin
// aplikasi native atau UI berbahasa lain nanti tidak perlu menyentuh Postgres.
const PETA_ERROR: Record<string, { pesan: string; status: number }> = {
  '28000': { pesan: 'Kamu harus login dulu', status: 401 },
  TB101: { pesan: 'Sesi tidak ditemukan', status: 404 },
  TB102: { pesan: 'Sesi online belum bisa dibooking di Fase 1', status: 403 },
  TB103: { pesan: 'Kuota sesi ini sudah penuh', status: 409 },
  TB104: { pesan: 'Sesi ini sudah lewat', status: 409 },
  TB105: { pesan: 'Kamu sudah booking sesi ini sebelumnya', status: 409 },
}

export async function createBooking(
  supabase: SupabaseClient<Database>,
  sessionId: string
): Promise<Booking> {
  // qr_token TIDAK dikirim dari sini lagi. Dulu dibuat di Node lalu diteruskan
  // ke RPC, padahal RPC-nya ter-grant ke `authenticated` — jadi user login mana
  // pun bisa memanggil PostgREST langsung dan memilih token untuk tiketnya
  // sendiri, melewati seluruh validasi di lapisan ini. Sekarang token dibuat di
  // dalam RPC pakai gen_random_bytes dan parameternya sudah dihapus.
  const { data, error } = await supabase
    .rpc('create_booking', { p_session_id: sessionId })
    .single()

  if (error) {
    const dikenal = error.code ? PETA_ERROR[error.code] : undefined

    if (dikenal) {
      throw new BookingError(dikenal.pesan, dikenal.status)
    }

    // Kode tak dikenal berarti ada kondisi baru di SQL yang belum dipetakan.
    // Dicatat supaya ketahuan, bukan disembunyikan jadi 500 tanpa jejak.
    console.error('create_booking: errcode tidak dikenal', error.code, error.message)
    throw new BookingError('Gagal membuat booking, coba lagi', 500)
  }

  return data as Booking
}
