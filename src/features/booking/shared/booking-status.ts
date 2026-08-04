/**
 * `| string` sengaja dipertahankan di union ini — codegen Supabase melebarkan
 * kolom text ber-CHECK jadi `string` biasa (lihat catatan di booking-cta.ts),
 * jadi memaksa literal union di boundary cuma memindahkan `as` ke pemanggil.
 */
export type BookingStatus = 'booked' | 'checked_in' | 'cancelled' | string

export function statusLabel(status: BookingStatus) {
  switch (status) {
    case 'booked':
      return 'Booked'
    case 'checked_in':
      return 'Checked-in'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status
  }
}

export function statusStyle(status: BookingStatus) {
  if (status === 'checked_in') {
    return {
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0',
    } as const
  }

  if (status === 'cancelled') {
    return {
      background: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca',
    } as const
  }

  return {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
  } as const
}
