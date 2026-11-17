import { prisma } from '@/lib/prisma'
import { buildRobotsTxt } from '@/lib/robots'

export const dynamic = 'force-dynamic'

/** /robots.txt ca text brut, ca sa putem servi exact textul personalizat din /admin/seo (vezi lib/robots.ts). */
export async function GET() {
  let siteUrl = 'http://localhost:3000'
  let customText: string | null = null
  let blockAiTrainingBots = false
  try {
    const seo = await prisma.seoSettings.findFirst({
      select: { siteUrl: true, robotsTxt: true, blockAiTrainingBots: true },
    })
    if (seo?.siteUrl) siteUrl = seo.siteUrl
    customText = seo?.robotsTxt ?? null
    blockAiTrainingBots = !!seo?.blockAiTrainingBots
  } catch {
    // baza indisponibila: regulile implicite
  }
  return new Response(buildRobotsTxt({ siteUrl, customText, blockAiTrainingBots }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
