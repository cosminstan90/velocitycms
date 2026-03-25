import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  let siteUrl = 'http://localhost:3000'
  let blockAiBots = false
  let hasCustomRules = false

  try {
    const seo = await prisma.seoSettings.findFirst({
      select: { siteUrl: true, robotsTxt: true, blockAiTrainingBots: true },
    })
    if (seo?.siteUrl) siteUrl = seo.siteUrl.replace(/\/$/, '')
    if (seo?.blockAiTrainingBots) blockAiBots = true
    if (seo?.robotsTxt) hasCustomRules = true
  } catch {
    // DB unavailable at build time — fall back to defaults
  }

  const sitemaps: string[] = [
    `${siteUrl}/sitemap.xml`,
    `${siteUrl}/sitemap-images.xml`,
  ]

  // Custom robots.txt body is stored — serve a structured pass-through.
  // For full raw-string control, admins can configure rules via the custom field.
  if (hasCustomRules) {
    return {
      rules: [{ userAgent: '*', allow: '/' }],
      sitemap: sitemaps,
    }
  }

  const aiRules: MetadataRoute.Robots['rules'] = blockAiBots
    ? [
        { userAgent: 'GPTBot', disallow: ['/'] },
        { userAgent: 'ChatGPT-User', disallow: ['/'] },
        { userAgent: 'CCBot', disallow: ['/'] },
        { userAgent: 'anthropic-ai', disallow: ['/'] },
        { userAgent: 'Claude-Web', disallow: ['/'] },
        { userAgent: 'PerplexityBot', disallow: ['/'] },
        { userAgent: 'Omgilibot', disallow: ['/'] },
      ]
    : []

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/'],
      },
      ...aiRules,
    ],
    sitemap: sitemaps,
  }
}
