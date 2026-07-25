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

const READER_ELEMENT_ID = 'qr-scanner-reader'

export default function AdminScannerPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [result, setResult] = useState<string | null>(null)
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
      // Untuk spike, gagal stop/clear tidak perlu bikin UI error.
    } finally {
      scannerRef.current = null
      setStatus('stopped')
    }
  }

  async function startScanner() {
    setError(null)
    setResult(null)
    setStatus('starting')

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
        setResult(decodedText)
        setStatus('scanning')
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
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1>Scan QR</h1>
      <p>
        Spike awal scanner QR. Halaman ini baru membuktikan kamera browser bisa scan QR;
        validasi check-in ke database akan disambungkan di step berikutnya.
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
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={startScanner} disabled={status === 'starting' || status === 'scanning'}>
          {status === 'starting' ? 'Menyalakan kamera...' : 'Mulai scan'}
        </button>
        <button type="button" onClick={stopScanner} disabled={!scannerRef.current}>
          Stop
        </button>
      </div>

      <p>Status: {status}</p>

      {result && (
        <div role="status" style={{ padding: 12, border: '1px solid #0a0', marginTop: 12 }}>
          <strong>QR terbaca:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: 12, border: '1px solid #c00', marginTop: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </main>
  )
}
