/**
 * GET  /api/seo-settings  — fetch SEO settings for the active site
 * PUT  /api/seo-settings  — update SEO settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Ensure siteId is always in where clause for data isolation

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'No active site' }, { status: 400 })

  const seo = await prisma.seoSettings.findUnique({ where: { siteId } })
  return NextResponse.json({ seo })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'No active site' }, { status: 400 })

  const body = await req.json() as {
    siteName?: string
    siteUrl?: string
    defaultMetaTitle?: string | null
    defaultMetaDesc?: string | null
    defaultOgImage?: string | null
    robotsTxt?: string | null
    blockAiTrainingBots?: boolean
    googleVerification?: string | null
    notifyEmail?: string | null
    notifyOnPublish?: boolean
    notifyOnBackup?: boolean
    notifyOnErrors?: boolean
  }

  const seo = await prisma.seoSettings.upsert({
    where: { siteId },
    update: {
      ...(body.siteName !== undefined && { siteName: body.siteName }),
      ...(body.siteUrl !== undefined && { siteUrl: body.siteUrl }),
      ...(body.defaultMetaTitle !== undefined && { defaultMetaTitle: body.defaultMetaTitle }),
      ...(body.defaultMetaDesc !== undefined && { defaultMetaDesc: body.defaultMetaDesc }),
      ...(body.defaultOgImage !== undefined && { defaultOgImage: body.defaultOgImage }),
      ...(body.robotsTxt !== undefined && { robotsTxt: body.robotsTxt }),
      ...(body.blockAiTrainingBots !== undefined && { blockAiTrainingBots: body.blockAiTrainingBots }),
      ...(body.googleVerification !== undefined && { googleVerification: body.googleVerification }),
      ...(body.notifyEmail !== undefined && { notifyEmail: body.notifyEmail }),
      ...(body.notifyOnPublish !== undefined && { notifyOnPublish: body.notifyOnPublish }),
      ...(body.notifyOnBackup !== undefined && { notifyOnBackup: body.notifyOnBackup }),
      ...(body.notifyOnErrors !== undefined && { notifyOnErrors: body.notifyOnErrors }),
    },
    create: {
      siteId,
      siteName: body.siteName ?? 'VelocityCMS',
      siteUrl: body.siteUrl ?? 'http://localhost:3000',
      defaultMetaTitle: body.defaultMetaTitle ?? null,
      defaultMetaDesc: body.defaultMetaDesc ?? null,
      defaultOgImage: body.defaultOgImage ?? null,
      robotsTxt: body.robotsTxt ?? null,
      blockAiTrainingBots: body.blockAiTrainingBots ?? false,
      googleVerification: body.googleVerification ?? null,
      notifyEmail: body.notifyEmail ?? null,
      notifyOnPublish: body.notifyOnPublish ?? false,
      notifyOnBackup: body.notifyOnBackup ?? true,
      notifyOnErrors: body.notifyOnErrors ?? true,
    },
  })

  return NextResponse.json({ seo })
}
