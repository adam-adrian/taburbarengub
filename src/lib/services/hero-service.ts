import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import type { HeroContentPayload } from '@/lib/validators/hero.schema'

type HeroContent = Database['public']['Tables']['hero_content']['Row']

export class HeroContentError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
  }
}

export async function updateHeroContent(
  supabase: SupabaseClient<Database>,
  payload: HeroContentPayload
): Promise<HeroContent> {
  const { data, error } = await supabase
    .from('hero_content')
    .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single()

  if (error) {
    console.error('hero_content update error', error.code, error.message)
    throw new HeroContentError('Gagal menyimpan konten hero, coba lagi', 500)
  }

  return data
}
