import { Archivo, Public_Sans } from 'next/font/google'
import AdsenseScripts from '@/components/frontend/AdsenseScripts'
import { getAdsenseClient } from '@/lib/ads'

const display = Archivo({
  subsets: ['latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-dv-display-src',
  display: 'swap',
})

const body = Public_Sans({
  subsets: ['latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-dv-body-src',
  display: 'swap',
})

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  // Reclamele si mesajul de consimtamant ruleaza doar in productie, nu pe localhost.
  const adsClient = process.env.NODE_ENV === 'production' ? getAdsenseClient() : null
  return (
    <div className={`${display.variable} ${body.variable}`}>
      {children}
      {adsClient ? <AdsenseScripts client={adsClient} /> : null}
    </div>
  )
}
