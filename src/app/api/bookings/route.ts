import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBookingSchema } from '@/lib/validators/booking.schema'
import { createBooking, BookingError } from '@/lib/services/booking-service'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Auth check — cuma user yang login yang boleh booking.
  //    Ini juga otomatis ngeblok akses dari luar tanpa session valid,
  //    baik dari web maupun native app nanti.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Kamu harus login dulu' }, { status: 401 })
  }

  // 2. Validasi body JSON + input pakai Zod
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request harus berupa JSON valid' },
      { status: 400 }
    )
  }

  const parsed = createBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // 3. Jalanin business logic (lewat RPC, aman dari race condition kuota)
  try {
    const booking = await createBooking(supabase, parsed.data.session_id)
    return NextResponse.json({ data: booking }, { status: 201 })
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan, coba lagi' }, { status: 500 })
  }
}
