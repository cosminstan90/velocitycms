import { describe, expect, it } from 'vitest'
import { AI_TRAINING_BOTS, buildRobotsTxt } from './robots'

const siteUrl = 'https://divet.ro/'

describe('buildRobotsTxt', () => {
  it('default: disallows admin/api/_next and lists both sitemaps', () => {
    const txt = buildRobotsTxt({ siteUrl })
    expect(txt).toContain('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /_next/')
    expect(txt).toContain('Sitemap: https://divet.ro/sitemap.xml')
    expect(txt).toContain('Sitemap: https://divet.ro/sitemap-images.xml')
    expect(txt).not.toContain('GPTBot')
  })

  it('blockAiTrainingBots blocks only training crawlers, never AI search/user agents', () => {
    const txt = buildRobotsTxt({ siteUrl, blockAiTrainingBots: true })
    for (const bot of AI_TRAINING_BOTS) expect(txt).toContain(`User-agent: ${bot}\nDisallow: /`)
    for (const bot of ['ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User']) {
      expect(txt).not.toContain(bot)
    }
    expect(txt).toContain('Disallow: /admin/')
  })

  it('custom text is served verbatim, with the missing sitemap lines appended', () => {
    const custom = 'User-agent: *\r\nDisallow: /admin/\r\nDisallow: /private/\r\nSitemap: https://divet.ro/sitemap.xml'
    const txt = buildRobotsTxt({ siteUrl, customText: custom, blockAiTrainingBots: true })
    expect(txt.startsWith('User-agent: *\nDisallow: /admin/\nDisallow: /private/\nSitemap: https://divet.ro/sitemap.xml')).toBe(true)
    expect(txt.match(/sitemap\.xml/g)).toHaveLength(1)
    expect(txt).toContain('Sitemap: https://divet.ro/sitemap-images.xml')
    expect(txt).not.toContain('GPTBot')
  })

  it('blank custom text falls back to the defaults', () => {
    expect(buildRobotsTxt({ siteUrl, customText: '  \n ' })).toContain('Disallow: /api/')
  })
})
