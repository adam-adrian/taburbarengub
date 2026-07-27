import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '@/lib/auth/require-admin'
import { updateEventSession, SessionError } from '@/lib/services/session-service'
import { createClient } from '@/lib/supabase/server'
import { sessionPayloadSchema } from '@/lib/validators/session.schema'

const paramsSchema = z.object({
  id: z.string().uuid({ message: 'session id tidak valid' }),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const rawParams = await params
  const parsedParams = paramsSchema.safeParse(rawParams)

  if (!parsedParams.success) {
    return NextResponse.json({ error: 'session id tidak valid' }, { status: 400 })
  }

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
    const session = await updateEventSession(supabase, parsedParams.data.id, parsed.data)
    return NextResponse.json({ data: session }, { status: 200 })
  } catch (err) {
    if (err instanceof SessionError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan, coba lagi' }, { status: 500 })
  }
}
