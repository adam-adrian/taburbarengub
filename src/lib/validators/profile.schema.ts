import { z } from 'zod'

const optionalTrimmedText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== 'string') return ''
    return value.trim()
  })

export const completeProfileSchema = z.object({
  nama: z.string().trim().min(1, { message: 'Nama lengkap wajib diisi' }),
  nama_panggilan: optionalTrimmedText,
  no_hp: z.string().trim().min(1, { message: 'No. HP wajib diisi' }),
  usia: z
    .number({ message: 'Usia harus berupa angka' })
    .int({ message: 'Usia harus berupa angka bulat' })
    .positive({ message: 'Usia harus lebih dari 0' }),
  profesi: z.string().trim().min(1, { message: 'Profesi wajib diisi' }),
  domisili: z.string().trim().min(1, { message: 'Domisili wajib diisi' }),
})

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
