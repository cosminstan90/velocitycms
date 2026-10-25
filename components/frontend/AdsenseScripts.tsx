'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/**
 * Mesajul de consimtamant Google (Privacy & messaging, fost Funding Choices) si scriptul AdSense.
 * Consimtamantul este gestionat de Google CMP (certificat TCF); iframe-ul `googlefcPresent` ii semnaleaza ca pagina il ruleaza.
 * Se monteaza doar in layout-ul public, niciodata in admin.
 */
export default function AdsenseScripts({ client }: { client: string }) {
  useEffect(() => {
    if (window.frames['googlefcPresent' as unknown as number]) return
    const iframe = document.createElement('iframe')
    iframe.name = 'googlefcPresent'
    iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;left:-1000px;top:-1000px'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.tabIndex = -1
    document.body.appendChild(iframe)
  }, [])

  const pub = client.replace(/^ca-/, '')
  return (
    <>
      <Script id="google-fc" src={`https://fundingchoicesmessages.google.com/i/${pub}?ers=1`} strategy="afterInteractive" />
      <Script
        id="google-adsense"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </>
  )
}
