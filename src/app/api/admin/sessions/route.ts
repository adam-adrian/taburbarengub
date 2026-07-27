import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '@/lib/auth/require-admin'
import { createEventSession, SessionError } from '@/lib/services/session-service'
import { createClient } from '@/lib/supabase/server'
import { sessionPayloadSchema } from '@/lib/validators/session.schema'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    await requireAdmin(supabase)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Body request harus berupa JSON valid' },
      { status: 400 }
    )
  }

  const parsed = sessionPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const session = await createEventSession(supabase, parsed.data)
    return NextResponse.json({ data: session }, { status: 201 })
  } catch (err) {
    if (err instanceof SessionError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan, coba lagi' }, { status: 500 })
  }
}
