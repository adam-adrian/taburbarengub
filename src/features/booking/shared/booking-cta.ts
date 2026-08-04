/**
 * Menentukan CTA apa yang tampil di halaman detail sesi.
 *
 * Dipisah dari page.tsx supaya urutan prioritasnya eksplisit dan bisa diuji
 * tanpa render — di JSX urutan itu cuma tersirat dari posisi ternary, dan
 * cabang yang hilang tidak kelihatan (contoh nyata: `booking.status` sempat
 * di-select tapi tak pernah dibaca, sehingga booking `cancelled` tetap tampil
 * sebagai "sudah booking").
 *
 * Perenderannya ada di BookingCtaAction pada page.tsx — switch exhaustive,
 * jadi menambah varian di sini otomatis memaksa cabang barunya ditangani.
 */

/**
 * Nilai yang diizinkan CHECK constraint bookings_status_check.
 *
 * Dipakai sebagai dokumentasi, bukan sebagai tipe input: codegen Supabase
 * melebarkan kolom text ber-CHECK jadi `string` biasa, jadi memaksa union ini
 * di boundary cuma memindahkan `as` ke pemanggil tanpa menambah jaminan apa
 * pun. Perbandingannya di bawah tetap aman karena nilai di luar daftar ini
 * jatuh ke cabang yang sama dengan 'booked'.
 */
export type BookingStatus = 'booked' | 'checked_in' | 'cancelled'

export type BookingCta =
  /** Sesi sudah lewat tanggalnya. */
  | { tag: 'past' }
  /** Sesi online — booking belum didukung di Fase 1. */
  | { tag: 'online_locked' }
  /** kuota_terisi >= kapasitas. */
  | { tag: 'full' }
  /**
   * User punya booking aktif. `checkedIn` dan `sessionPast` cuma membedakan
   * label, tujuan link-nya tetap sama (halaman tiket).
   */
  | { tag: 'has_booking'; bookingId: string; checkedIn: boolean; sessionPast: boolean }
  /**
   * Booking user untuk sesi ini berstatus dibatalkan.
   *
   * Kalimatnya harus netral ("Booking dibatalkan"), bukan menuduh user yang
   * membatalkan — pembatalan bisa juga datang dari sisi admin ketika sesinya
   * dibatalkan (event_sessions.status punya 'cancelled' sendiri). Siapa saja
   * yang boleh membatalkan diputuskan di PR-04.
   *
   * Ditampilkan apa adanya, tidak disamakan dengan "belum pernah booking" —
   * karena DB memang belum mengizinkan booking ulang: UNIQUE(user_id,
   * session_id) di baseline dan guard TB105 di create_booking() sama-sama
   * tidak memfilter status. Menawarkan tombol booking di sini akan berujung
   * error TB105 "sudah booking sesi ini" yang membingungkan.
   *
   * Kalau PR-04 nanti mengizinkan booking ulang (hapus baris, atau partial
   * unique index + guard TB105 yang memfilter status), cabang ini yang
   * menyesuaikan — bukan sebaliknya.
   */
  | { tag: 'cancelled'; bookingId: string }
  /** Sudah login, tapi profile_completed = false. Booking akan ditolak TB106. */
  | { tag: 'profile_incomplete' }
  /** Boleh booking sekarang. */
  | { tag: 'can_book' }
  /** Belum login. */
  | { tag: 'needs_login' }
  /**
   * Profil tidak bisa dipastikan — query error, atau barisnya tidak ada.
   *
   * Jangan menebak. Tanpa cabang ini, error query ditelan jadi
   * 'profile_incomplete' dan user yang profilnya sudah lengkap disuruh
   * mengisi ulang.
   *
   * Baris hilang juga masuk sini, bukan 'profile_incomplete': akun bisa ada
   * di auth.users tapi barisnya di public.users terhapus (dua tabel terpisah,
   * dijembatani trigger handle_new_user() yang cuma jalan saat INSERT). Dalam
   * keadaan itu form lengkapi profil DIJAMIN gagal — complete_user_profile()
   * melakukan UPDATE, bukan UPSERT, jadi 0 baris terkena dan RPC melempar
   * TB404 PROFILE_TIDAK_DITEMUKAN. Terkonfirmasi dari kejadian nyata.
   */
  | { tag: 'unavailable' }

export type BookingCtaInput = {
  session: {
    /** 'offline' | 'online' — lihat catatan di BookingStatus soal kenapa string. */
    tipe: string
    tanggal_waktu: string
    kapasitas: number
    kuota_terisi: number
  }
  /**
   * Keadaan profil, biasanya diisi `gate.tag` dari getProfileGate().
   *
   * Sengaja dideklarasikan ulang di sini sebagai union tag saja, bukan
   * meng-import ProfileGate — itu yang menjaga modul ini bebas dependensi
   * sehingga bisa dikompilasi dan diuji sendiri. Kalau tag di profile-service
   * berubah, pemanggilnya gagal compile, jadi keduanya tidak bisa menyimpang
   * diam-diam.
   */
  profileState: 'anonymous' | 'unavailable' | 'incomplete' | 'complete'
  /** Booking user untuk sesi ini, apa pun statusnya. null = belum pernah. */
  booking: { id: string; status: string } | null
  /** Disuntik supaya bisa diuji, jangan panggil new Date() di dalam. */
  now: Date
}

export function resolveBookingCta(input: BookingCtaInput): BookingCta {
  const { session, profileState, booking, now } = input

  const isPast = new Date(session.tanggal_waktu) <= now
  const isOnline = session.tipe === 'online'
  const isFull = session.kuota_terisi >= session.kapasitas

  // Urutannya ADALAH kebijakannya — yang di atas menang. Tiga lapis:
  //
  //   1. Relasi user ke sesi ini (booking)  — informasi tentang dirinya,
  //      tetap relevan walau aksinya sudah tertutup.
  //   2. Gerbang sesi (lewat/online/penuh)  — berlaku sama untuk semua orang,
  //      termasuk pengunjung yang belum login.
  //   3. Syarat bertindak (login, profil)   — cuma ditagih kalau aksinya
  //      memang masih terbuka.

  // ── 1. Relasi user ────────────────────────────────────────────────────
  // Dicek sebelum gerbang: pemegang tiket harus tetap bisa membuka tiketnya
  // meski sesinya sudah penuh atau sudah lewat.
  // Sengaja pakai narrowing `booking !== null` alih-alih boolean turunan,
  // supaya TypeScript tahu booking bukan null dan `!` tidak diperlukan.
  if (booking !== null && booking.status !== 'cancelled') {
    return {
      tag: 'has_booking',
      bookingId: booking.id,
      checkedIn: booking.status === 'checked_in',
      sessionPast: isPast,
    }
  }

  if (booking !== null) {
    // Sisanya pasti 'cancelled'. Ditampilkan apa adanya — lihat catatan di
    // tipe 'cancelled' soal kenapa ini tidak disamakan dengan belum booking.
    return { tag: 'cancelled', bookingId: booking.id }
  }

  // ── 2. Gerbang sesi ───────────────────────────────────────────────────
  // Di atas 'needs_login' supaya pengunjung anonim tetap melihat alasan
  // sebenarnya ("Sesi sudah lewat"), bukan diajak login untuk sesuatu yang
  // sudah tidak bisa dibooking siapa pun.
  if (isPast) return { tag: 'past' }
  if (isOnline) return { tag: 'online_locked' }
  if (isFull) return { tag: 'full' }

  // ── 3. Syarat bertindak ───────────────────────────────────────────────
  // Urutan mengikuti ProfileGate: 'unavailable' harus mendahului kesimpulan
  // "belum lengkap", supaya kegagalan baca tidak tampil sebagai suruhan
  // mengisi form kepada user yang profilnya sebenarnya sudah lengkap.
  if (profileState === 'anonymous') return { tag: 'needs_login' }
  if (profileState === 'unavailable') return { tag: 'unavailable' }
  if (profileState === 'incomplete') return { tag: 'profile_incomplete' }

  return { tag: 'can_book' }
}
