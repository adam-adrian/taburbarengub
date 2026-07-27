import { z } from 'zod'

const nullableTrimmedText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })

export const sessionPayloadSchema = z.object({
  nama_sesi: z.string().trim().min(1, { message: 'Nama sesi wajib diisi' }),
  tipe: z.enum(['offline', 'online'], { message: 'Tipe sesi tidak valid' }),
  tanggal_waktu: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Tanggal dan waktu tidak valid',
    }),
  lokasi_atau_link: nullableTrimmedText,
  deskripsi: nullableTrimmedText,
  kapasitas: z
    .number({ message: 'Kapasitas harus berupa angka' })
    .int({ message: 'Kapasitas harus berupa angka bulat' })
    .positive({ message: 'Kapasitas harus lebih dari 0' }),
  status: z.enum(['draft', 'published', 'cancelled'], { message: 'Status sesi tidak valid' }),
})

export type SessionPayload = z.infer<typeof sessionPayloadSchema>
