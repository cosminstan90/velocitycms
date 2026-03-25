/**
 * lib/seo/internal-linker.ts
 *
 * Internal Linking Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Two exported functions:
 *
 *   getSuggestedLinks(currentPostId, contentHtml, siteId)
 *     → Fetches 100 most-recent published posts (excluding current),
 *       sends first 500 words + post metadata to Claude Haiku,
 *       returns up to 5 ranked suggestions. Results cached in Redis 1h.
 *
 *   getLinksAlreadyInContent(contentHtml)
 *     → Parses all <a href> tags and classifies as internal / external.
 */

import Anthropic from '@anthropic-ai/sdk'
import { redis } from '@/lib/redis/client'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkSuggestion {
  anchorText: string
  targetSlug: string
  targetTitle: string
  /** 0–100 relevance score assigned by Claude */
  relevanceScore: number
  /** ~10 words from the article where the link fits naturally */
  insertionContext: string
}

export interface ContentLinks {
  internal: Array<{ href: string; text: string }>
  external: Array<{ href: string; text: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags and return plain text. */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Return first N words of a plain-text string. */
function firstNWords(text: string, n: number): string {
  return text.split(/\s+/).slice(0, n).join(' ')
}

// ─── getLinksAlreadyInContent ─────────────────────────────────────────────────

/**
 * Parse all <a href="..."> tags in contentHtml and classify them as
 * internal (href starts with /) or external (http/https).
 *
 * Strips HTML tags from anchor text.
 */
export function getLinksAlreadyInContent(contentHtml: string): ContentLinks {
  const internal: ContentLinks['internal'] = []
  const external: ContentLinks['external'] = []

  const anchorRe = /<a\b[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = anchorRe.exec(contentHtml)) !== null) {
    const href = match[1].trim()
    const rawText = match[2]
    const text = htmlToText(rawText) || href

    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue

    if (href.startsWith('/') || (!href.startsWith('http://') && !href.startsWith('https://'))) {
      internal.push({ href, text })
    } else {
      external.push({ href, text })
    }
  }

  return { internal, external }
}

// ─── getSuggestedLinks ────────────────────────────────────────────────────────

/**
 * Use Claude Haiku to suggest up to 5 internal links for the given article.
 *
 * Results are cached in Redis under `internal-links:{postId}` for 1 hour.
 * Pass force=true (or call redis.del before invoking) to bypass cache.
 */
export async function getSuggestedLinks(
  currentPostId: string,
  contentHtml: string,
  siteId: string
): Promise<LinkSuggestion[]> {
  const cacheKey = `internal-links:${currentPostId}`

  // ── 1. Cache read ───────────────────────────────────────────────────────────
  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as LinkSuggestion[]
  } catch {
    // Redis unavailable — continue to live generation
  }

  // ── 2. Fetch candidate posts ────────────────────────────────────────────────
  const candidates = await prisma.post.findMany({
    where: {
      siteId,
      status: 'PUBLISHED',
      id: { not: currentPostId },
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      focusKeyword: true,
      excerpt: true,
      category: { select: { slug: true } },
    },
  })

  if (candidates.length === 0) return []

  // ── 3. Build prompt ─────────────────────────────────────────────────────────
  const plainText = htmlToText(contentHtml)
  const first500Words = firstNWords(plainText, 500)

  const candidateJson = candidates.map((p) => ({
    title: p.title,
    slug: p.slug,
    focusKeyword: p.focusKeyword ?? '',
    excerpt: p.excerpt ? p.excerpt.slice(0, 120) : '',
    categorySlug: p.category?.slug ?? '',
  }))

  const userPrompt =
    `Current article content (first 500 words):\n${first500Words}\n\n` +
    `Available posts to link to:\n${JSON.stringify(candidateJson, null, 2)}\n\n` +
    `Return a JSON array of at most 5 suggestions with this exact shape:\n` +
    `[{"anchorText":"...","targetSlug":"...","targetTitle":"...","relevanceScore":85,"insertionContext":"...10 words from article..."}]\n` +
    `Only suggest links that are highly relevant. Anchor text must appear verbatim in the article. ` +
    `insertionContext must be a verbatim quote of ~10 consecutive words from the article where the link fits. ` +
    `Return only the JSON array, no markdown fences.`

  // ── 4. Call Claude Haiku ────────────────────────────────────────────────────
  let suggestions: LinkSuggestion[] = []

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: 'You are an SEO expert. Suggest internal links for a Romanian article. Respond only with valid JSON.',
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    // Strip optional markdown fence
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(jsonText)

    if (Array.isArray(parsed)) {
      suggestions = parsed
        .filter(
          (s): s is LinkSuggestion =>
            typeof s.anchorText === 'string' &&
            typeof s.targetSlug === 'string' &&
            typeof s.targetTitle === 'string' &&
            typeof s.relevanceScore === 'number' &&
            typeof s.insertionContext === 'string'
        )
        .slice(0, 5)
    }
  } catch (err) {
    console.error('[internal-linker] Claude call failed:', err)
    return []
  }

  // ── 5. Cache result ─────────────────────────────────────────────────────────
  try {
    await redis.set(cacheKey, JSON.stringify(suggestions), 'EX', 3600)
  } catch {
    // ignore
  }

  return suggestions
}

/** Invalidate the cached suggestions for a post. */
export async function invalidateLinkSuggestionsCache(postId: string): Promise<void> {
  try {
    await redis.del(`internal-links:${postId}`)
  } catch {
    // ignore
  }
}
