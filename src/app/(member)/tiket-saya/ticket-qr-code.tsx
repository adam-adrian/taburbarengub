'use client'

import QRCode from 'react-qr-code'

export function TicketQrCode({ value }: { value: string }) {
  return (
    <div
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        width: 'fit-content',
      }}
    >
      <QRCode value={value} size={192} level="M" />
    </div>
  )
}
