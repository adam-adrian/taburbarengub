/**
 * Format tanggal+waktu lengkap ("Selasa, 4 Agustus 2026 pukul 12.00").
 * Dipakai di halaman publik/member — landing, detail sesi, tiket.
 */
export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

/**
 * Format tanggal+waktu ringkas ("4 Agu 2026, 12.00"). Dipakai di tabel/daftar
 * admin, di mana ruangnya sempit. Beda dateStyle dari formatDateTime, bukan
 * duplikatnya — keduanya dipertahankan terpisah.
 */
export function formatDateTimeCompact(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}
