import { z } from 'zod'

const nullableTrimmedText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })

export const heroContentSchema = z.object({
  judul_acara: z.string().trim().min(1, { message: 'Judul acara wajib diisi' }),
  filosofi_tabur: nullableTrimmedText,
  tagline: nullableTrimmedText,
  nama_pemateri: nullableTrimmedText,
  bio_pemateri: nullableTrimmedText,
  foto_pemateri_url: nullableTrimmedText,
})

export type HeroContentPayload = z.infer<typeof heroContentSchema>
