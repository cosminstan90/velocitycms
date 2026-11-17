/**
 * Corpul robots.txt, ca text brut (servit de app/robots.txt/route.ts).
 *
 * - Fara text personalizat: regulile implicite (admin/api/_next interzise) + sitemap-urile.
 * - Cu text personalizat din /admin/seo: textul se serveste ASA CUM E (promisiunea din admin: „inlocuieste regulile
 *   generate automat"); adaugam doar liniile Sitemap care lipsesc.
 * - `blockAiTrainingBots` blocheaza DOAR crawlerele de antrenare. Crawlerele care aduc citari in cautarea AI
 *   (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User) raman permise.
 */

/** Crawlere care colecteaza date de antrenare (nu servesc rezultate de cautare). */
export const AI_TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Meta-ExternalAgent',
  'Omgilibot',
] as const

export const DEFAULT_DISALLOW = ['/admin/', '/api/', '/_next/'] as const

export type RobotsInput = {
  siteUrl: string
  customText?: string | null
  blockAiTrainingBots?: boolean
}

export function sitemapUrls(siteUrl: string): string[] {
  const base = siteUrl.replace(/\/$/, '')
  return [`${base}/sitemap.xml`, `${base}/sitemap-images.xml`]
}

export function buildRobotsTxt({ siteUrl, customText, blockAiTrainingBots = false }: RobotsInput): string {
  const sitemaps = sitemapUrls(siteUrl)
  const custom = customText?.replace(/\r\n/g, '\n').trim()

  if (custom) {
    const present = new Set(
      custom
        .split('\n')
        .map((l) => l.match(/^\s*sitemap\s*:\s*(\S+)/i)?.[1])
        .filter((u): u is string => !!u),
    )
    const missing = sitemaps.filter((u) => !present.has(u))
    return [custom, ...(missing.length ? ['', ...missing.map((u) => `Sitemap: ${u}`)] : []), ''].join('\n')
  }

  const lines = ['User-agent: *', 'Allow: /', ...DEFAULT_DISALLOW.map((p) => `Disallow: ${p}`)]
  if (blockAiTrainingBots) {
    for (const bot of AI_TRAINING_BOTS) lines.push('', `User-agent: ${bot}`, 'Disallow: /')
  }
  lines.push('', ...sitemaps.map((u) => `Sitemap: ${u}`), '')
  return lines.join('\n')
}
