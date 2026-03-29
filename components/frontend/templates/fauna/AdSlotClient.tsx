'use client'

import { useEffect } from 'react'

interface AdSlotClientProps {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  className?: string
  /** Width × height for fixed-size slots, e.g. [728, 90] */
  size?: [number, number]
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdSlotClient({
  slot,
  format = 'auto',
  className = '',
  size,
}: AdSlotClientProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_ID

  useEffect(() => {
    if (!clientId) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense not loaded yet — harmless
    }
  }, [clientId])

  // In dev (no client ID) render placeholder
  if (!clientId) {
    const [w, h] = size ?? [728, 90]
    return (
      <div
        className={`bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300 ${className}`}
        style={{ width: '100%', maxWidth: w, height: h }}
        data-ad-slot={slot}
      >
        Publicitate
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
