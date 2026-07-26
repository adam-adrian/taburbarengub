'use client'

import { useEffect, useRef, useState } from 'react'

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'stopped' | 'error'

type CameraDevice = {
  id: string
  label: string
}

type ScannerStartConfig = {
  fps: number
  qrbox: { width: number; height: number }
  aspectRatio?: number
}

type Html5QrcodeScanner = {
  start: (
    cameraConfig: { facingMode: 'environment' } | { deviceId: { exact: string } },
    config: ScannerStartConfig,
    onSuccess: (decodedText: string) => void,
    onError?: (errorMessage: string) => void
  ) => Promise<void>
  stop: () => Promise<void>
  clear: () => Promise<void>
  isScanning: boolean
}

type Html5QrcodeModule = {
  Html5Qrcode: {
    new (elementId: string): Html5QrcodeScanner
    getCameras: () => Promise<CameraDevice[]>
  }
}

type CheckInResult = {
  booking_id: string
  user_id: string
  session_id: string
  nama: string
  booking_status: string
  checked_in_at: string
}

const READER_ELEMENT_ID = 'qr-scanner-reader'

export default function AdminScannerPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const processingRef = useRef(false)
  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [result, setResult] = useState<string | null>(null)
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function stopScanner() {
    const scanner = scannerRef.current
    if (!scanner) return

    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
      await scanner.clear()
    } catch {
      // Gagal stop/clear tidak perlu bikin UI error.
    } finally {
      scannerRef.current = null
      setStatus('stopped')
    }
  }

  async function submitCheckIn(qrToken: string) {
    if (processingRef.current) return

    processingRef.current = true
    setCheckingIn(true)
    setResult(qrToken)
    setCheckInResult(null)
    setError(null)

    await stopScanner()

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_token: qrToken }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: CheckInResult; error?: unknown }
        | null

      if (!response.ok) {
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : 'Gagal memproses check-in, coba lagi'
        setError(message)
        return
      }

      if (payload?.data) {
        setCheckInResult(payload.data)
      } else {
        setError('Response check-in tidak valid')
      }
    } catch {
      setError('Tidak bisa terhubung ke server, coba lagi')
    } finally {
      setCheckingIn(false)
      processingRef.current = false
    }
  }

  async function startScanner() {
    setError(null)
    setResult(null)
    setCheckInResult(null)
    setStatus('starting')
    processingRef.current = false

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('Browser ini tidak mendukung akses kamera. Coba Chrome Android atau Safari iOS terbaru.')
      return
    }

    try {
      const { Html5Qrcode } = (await import('html5-qrcode')) as unknown as Html5QrcodeModule
      const scanner = new Html5Qrcode(READER_ELEMENT_ID)
      scannerRef.current = scanner

      const config: ScannerStartConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      }

      const onSuccess = (decodedText: string) => {
        const qrToken = decodedText.trim()
        if (qrToken.length > 0) {
          void submitCheckIn(qrToken)
        }
      }

      // Coba kamera belakang dulu. Kalau gagal, fallback ke daftar kamera.
      try {
        await scanner.start({ facingMode: 'environment' }, config, onSuccess)
      } catch {
        const cameras = await Html5Qrcode.getCameras()
        const fallbackCamera =
          cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ?? cameras[0]

        if (!fallbackCamera) {
          throw new Error('Tidak ada kamera yang terdeteksi')
        }

        await scanner.start(
          { deviceId: { exact: fallbackCamera.id } },
          config,
          onSuccess
        )
      }

      setStatus('scanning')
    } catch (err) {
      scannerRef.current = null
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Gagal menyalakan scanner QR')
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (scanner?.isScanning) {
        void scanner.stop().finally(() => scanner.clear())
      }
    }
  }, [])

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <h1>Scan QR</h1>
      <p>
        Arahkan kamera ke QR tiket peserta. Sistem akan validasi token dan menandai
        peserta sebagai checked-in jika tiket masih aktif.
      </p>

      <div
        id={READER_ELEMENT_ID}
        style={{
          width: '100%',
          minHeight: 320,
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden',
          margin: '16px 0',
          background: '#f9fafb',
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={startScanner} disabled={status === 'starting' || status === 'scanning' || checkingIn}>
          {status === 'starting' ? 'Menyalakan kamera...' : checkingIn ? 'Memproses...' : 'Mulai scan'}
        </button>
        <button type="button" onClick={stopScanner} disabled={!scannerRef.current}>
          Stop
        </button>
      </div>

      <p>Status scanner: {status}</p>

      {checkingIn && (
        <div style={{ padding: 12, border: '1px solid #bfdbfe', background: '#eff6ff', marginTop: 12 }}>
          Memproses check-in...
        </div>
      )}

      {checkInResult && (
        <div role="status" style={{ padding: 16, border: '1px solid #a7f3d0', background: '#ecfdf5', marginTop: 12, borderRadius: 8 }}>
          <h2 style={{ marginBottom: 8 }}>Check-in berhasil</h2>
          <p><strong>Nama:</strong> {checkInResult.nama}</p>
          <p><strong>Status:</strong> {checkInResult.booking_status}</p>
          <p><strong>Waktu:</strong> {new Date(checkInResult.checked_in_at).toLocaleString('id-ID')}</p>
        </div>
      )}

      {result && !checkInResult && (
        <div style={{ padding: 12, border: '1px solid #e5e7eb', marginTop: 12, borderRadius: 8 }}>
          <strong>QR terbaca:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: 16, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', marginTop: 12, borderRadius: 8 }}>
          <strong>Gagal:</strong> {error}
        </div>
      )}
    </main>
  )
}
