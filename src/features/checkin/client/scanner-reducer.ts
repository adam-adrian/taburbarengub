export type CheckInResult = {
  booking_id: string
  user_id: string
  session_id: string
  nama: string
  nama_sesi: string
  tanggal_waktu: string
  booking_status: string
  checked_in_at: string
}

// 'success' sengaja nggak nyimpen qrToken — UI cuma tampilin blok "QR
// terbaca" mentah pas belum ada checkInResult (lihat kondisi render lama).
// 'error' nyimpen qrToken nullable: null kalau gagal di tahap start kamera
// (belum sempat scan apa-apa), terisi kalau gagal di tahap check-in (biar
// blok "QR terbaca" tetap tampil bareng pesan error, sama seperti sebelumnya).
export type ScannerState =
  | { tag: 'idle' }
  | { tag: 'starting' }
  | { tag: 'scanning' }
  | { tag: 'checking_in'; qrToken: string }
  | { tag: 'success'; result: CheckInResult }
  | { tag: 'error'; message: string; qrToken: string | null }
  | { tag: 'stopped' }

export const initialScannerState: ScannerState = { tag: 'idle' }

export type ScannerAction =
  | { type: 'start_requested' }
  | { type: 'camera_unsupported'; message: string }
  | { type: 'scanner_started' }
  | { type: 'scanner_start_failed'; message: string }
  | { type: 'qr_scanned'; qrToken: string }
  | { type: 'check_in_succeeded'; result: CheckInResult }
  | { type: 'check_in_failed'; message: string }
  | { type: 'stopped' }

export function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case 'start_requested':
      return { tag: 'starting' }

    case 'camera_unsupported':
      return { tag: 'error', message: action.message, qrToken: null }

    case 'scanner_started':
      return { tag: 'scanning' }

    case 'scanner_start_failed':
      return { tag: 'error', message: action.message, qrToken: null }

    case 'qr_scanned':
      return { tag: 'checking_in', qrToken: action.qrToken }

    case 'check_in_succeeded':
      return { tag: 'success', result: action.result }

    case 'check_in_failed':
      // qrToken diambil dari state 'checking_in' yang lagi berjalan — bukan
      // dari action, karena endpoint check-in cuma balikin pesan error, bukan
      // token yang dikirim.
      return {
        tag: 'error',
        message: action.message,
        qrToken: state.tag === 'checking_in' ? state.qrToken : null,
      }

    case 'stopped':
      return { tag: 'stopped' }

    default: {
      const unhandled: never = action
      throw new Error(`Unhandled scanner action: ${JSON.stringify(unhandled)}`)
    }
  }
}

// scannerAvailable lama itu boolean terpisah yang di-set bareng status di
// setiap transisi — nggak nyimpen informasi baru, cuma derivable dari status.
export function canStopScanner(state: ScannerState): boolean {
  return state.tag === 'starting' || state.tag === 'scanning'
}

export function isScannerBusy(state: ScannerState): boolean {
  return state.tag === 'starting' || state.tag === 'scanning' || state.tag === 'checking_in'
}
