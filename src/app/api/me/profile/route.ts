import { NextResponse } from 'next/server'
import { completeUserProfile, ProfileError } from '@/lib/services/profile-service'
import { createClient } from '@/lib/supabase/server'
import { completeProfileSchema } from '@/lib/validators/profile.schema'

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Kamu harus login dulu' }, { status: 401 })
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

  const parsed = completeProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const profile = await completeUserProfile(supabase, parsed.data)
    return NextResponse.json({ data: profile }, { status: 200 })
  } catch (err) {
    if (err instanceof ProfileError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan, coba lagi' }, { status: 500 })
  }
}
