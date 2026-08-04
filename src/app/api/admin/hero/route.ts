import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '@/lib/auth/require-admin'
import { updateHeroContent, HeroContentError } from '@/features/hero/server/hero-service'
import { createClient } from '@/lib/supabase/server'
import { heroContentSchema } from '@/features/hero/shared/hero.schema'

export async function PATCH(request: Request) {
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

  const parsed = heroContentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const hero = await updateHeroContent(supabase, parsed.data)
    return NextResponse.json({ data: hero }, { status: 200 })
  } catch (err) {
    if (err instanceof HeroContentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan, coba lagi' }, { status: 500 })
  }
}
