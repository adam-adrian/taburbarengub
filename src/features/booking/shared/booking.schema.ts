import { z } from 'zod'

// Validasi input SEBELUM masuk ke business logic. Kalau nanti native
// app manggil endpoint yang sama, dia dapet error message yang sama
// persis, bukan crash aneh karena input nggak dicek.
export const createBookingSchema = z.object({
  session_id: z.string().uuid({ message: 'session_id tidak valid' }),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
