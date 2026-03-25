import { prisma } from '@/lib/prisma'

function stripHtml(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')  // remove tags
    .replace(/\s+/g, ' ')
    .trim()
}

function extractImageAltIssues(html: string): number {
  const imgMatches = Array.from(html.matchAll(/<img[^>]*>/gi)).map((m) => m[0])
  if (!imgMatches.length) return 0

  let missing = 0
  for (const img of imgMatches) {
    const altMatch = img.match(/alt\s*=\s*"([^"]*)"/i)
    if (!altMatch || !altMatch[1].trim()) {
      missing += 1
    }
  }

  return missing
}

function getWordCount(html: string): number {
  const text = stripHtml(html)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

async function runPerfCheck(): Promise<void> {
  console.log('▶ Running SEO/performance checks for published posts')

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      internalLinksUsed: true,
      featuredImageId: true,
      categoryId: true,
    },
  })

  if (!posts.length) {
    console.log('No published posts found.')
    process.exit(0)
  }

  const report = posts.map((post) => {
    const metaTitle = post.metaTitle?.trim() ?? ''
    const metaDescription = post.metaDescription?.trim() ?? ''
    const contentHtml = String(post.contentHtml ?? '')
    const wordCount = getWordCount(contentHtml)
    const missingAlt = extractImageAltIssues(contentHtml)

    const internalLinksUsed = post.internalLinksUsed
    const internalLinksCount = typeof internalLinksUsed === 'number'
      ? internalLinksUsed
      : (internalLinksUsed && (internalLinksUsed as any).count) ?? 0

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      metaTitle,
      metaDesc: metaDescription,
      wordCount,
      internalLinksCount,
      missingAlt,
      issues: [
        !metaTitle && 'missingMetaTitle',
        !metaDescription && 'missingMetaDescription',
        metaTitle.length > 60 && 'metaTitleTooLong',
        metaDescription.length > 155 && 'metaDescriptionTooLong',
        internalLinksCount === 0 && 'zeroInternalLinks',
        missingAlt > 0 && 'imagesMissingAltText',
        wordCount < 600 && 'lowWordCount',
      ].filter(Boolean),
    }
  })

  const flagged = report.filter((row) => row.issues.length > 0)

  console.log(`\nFound ${posts.length} published posts`)
  console.log(`Items with at least one issue: ${flagged.length}`)

  if (flagged.length > 0) {
    console.table(flagged.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      issues: row.issues.join(', '),
      wordCount: row.wordCount,
      internalLinksCount: row.internalLinksCount,
      missingAlt: row.missingAlt,
    })))
    process.exit(1)
  }

  console.log('✅ All checks passed for published posts')
}

runPerfCheck().catch((err) => {
  console.error('Perf check failed:', err)
  process.exit(2)
})
