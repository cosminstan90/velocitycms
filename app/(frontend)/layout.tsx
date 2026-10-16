import { Archivo, Public_Sans } from 'next/font/google'

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
  return (
    <div className={`${display.variable} ${body.variable}`}>
      {children}
    </div>
  )
}
