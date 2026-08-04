import { z } from 'zod'
import { nullableTrimmedText } from '@/lib/zod-helpers'

export const heroContentSchema = z.object({
  judul_acara: z.string().trim().min(1, { message: 'Judul acara wajib diisi' }),
  filosofi_tabur: nullableTrimmedText,
  tagline: nullableTrimmedText,
  nama_pemateri: nullableTrimmedText,
  bio_pemateri: nullableTrimmedText,
  foto_pemateri_url: nullableTrimmedText,
})

export type HeroContentPayload = z.infer<typeof heroContentSchema>
