import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = 'VelocityCMS'
  let shortName = 'Velocity'
  let description = 'Content Management System'
  let startUrl = '/'

  try {
    const seo = await prisma.seoSettings.findFirst({
      select: { siteName: true, siteUrl: true, defaultMetaDesc: true },
    })
    if (seo) {
      name = seo.siteName
      shortName = seo.siteName.split(' ')[0]
      if (seo.defaultMetaDesc) description = seo.defaultMetaDesc
      if (seo.siteUrl) startUrl = seo.siteUrl
    }
  } catch {
    // DB unavailable at build time
  }

  return {
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    categories: ['news', 'productivity'],
    lang: 'ro',
    dir: 'ltr',
  }
}
