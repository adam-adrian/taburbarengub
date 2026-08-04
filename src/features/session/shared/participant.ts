export type UserSummary = {
  nama: string
  email: string
  no_hp: string
  profesi: string | null
  domisili: string | null
}

/**
 * PostgREST mengembalikan relasi join sebagai objek tunggal atau array
 * tergantung arah foreign key — bentuk ini menormalkannya jadi satu objek
 * (atau null), supaya pemanggil tidak perlu tahu bedanya.
 */
export function getUser<T extends { users: UserSummary | UserSummary[] | null }>(
  booking: T
): UserSummary | null {
  if (Array.isArray(booking.users)) {
    return booking.users[0] ?? null
  }

  return booking.users
}
