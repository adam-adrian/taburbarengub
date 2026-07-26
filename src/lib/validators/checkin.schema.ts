import { z } from 'zod'

export const checkInSchema = z.object({
  qr_token: z.string().min(32, { message: 'QR token tidak valid' }),
})

export type CheckInInput = z.infer<typeof checkInSchema>
