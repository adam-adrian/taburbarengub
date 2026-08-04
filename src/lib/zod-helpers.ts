import { z } from 'zod'

/**
 * String opsional dari form/JSON: null, undefined, atau string kosong/whitespace
 * semuanya jadi null; string non-kosong di-trim.
 */
export const nullableTrimmedText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })
