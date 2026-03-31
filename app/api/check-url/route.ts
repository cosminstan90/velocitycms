import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { paths } = await request.json() as { paths: string[] }

  const seo = await prisma.seoSettings.findFirst()
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  const results = await Promise.all(
    paths.map(async (path: string) => {
      try {
        const res = await fetch(`${siteUrl}${path}`, {
          method: 'HEAD',
          redirect: 'follow',
          headers: { 'User-Agent': 'VelocityCMS-Checker/1.0' },
          signal: AbortSignal.timeout(8000),
        })
        return { path, status: res.status, redirected: res.redirected, finalUrl: res.url }
      } catch {
        return { path, status: null, redirected: false, finalUrl: null }
      }
    })
  )

  return NextResponse.json({ results })
}
