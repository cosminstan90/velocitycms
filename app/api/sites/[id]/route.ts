import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { deleteSiteDomainCache } from '@/lib/redis/redirects'

async function isSiteAdmin(userId: string, siteId: string): Promise<boolean> {
  const access = await prisma.userSiteAccess.findUnique({ where: { userId_siteId: { userId, siteId } } })
  return !!access && access.role === 'ADMIN'
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = req.nextUrl.pathname.split('/').pop()
  if (!siteId) return NextResponse.json({ error: 'site id required' }, { status: 400 })

  if (!(await isSiteAdmin(session.user.id, siteId))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()
  const { name, domain, description, timezone, language, isActive } = body

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (domain !== undefined) updates.domain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')
  if (description !== undefined) updates.description = description
  if (timezone !== undefined) updates.timezone = timezone
  if (language !== undefined) updates.language = language
  if (isActive !== undefined) updates.isActive = isActive

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const existing = await prisma.site.findUnique({ where: { id: siteId } })
  if (!existing) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  if (updates.domain && updates.domain !== existing.domain) {
    const conflict = await prisma.site.findUnique({ where: { domain: updates.domain } })
    if (conflict) return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
    await deleteSiteDomainCache(existing.domain)
  }

  const site = await prisma.site.update({ where: { id: siteId }, data: updates })
  return NextResponse.json({ site })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = req.nextUrl.pathname.split('/').pop()
  if (!siteId) return NextResponse.json({ error: 'site id required' }, { status: 400 })

  if (!(await isSiteAdmin(session.user.id, siteId))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const [postCount, pageCount] = await prisma.$transaction([
    prisma.post.count({ where: { siteId } }),
    prisma.page.count({ where: { siteId } }),
  ])

  if (postCount > 0 || pageCount > 0) {
    return NextResponse.json({ error: 'Cannot delete site with existing posts/pages' }, { status: 409 })
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  await prisma.site.delete({ where: { id: siteId } })
  await deleteSiteDomainCache(site.domain)

  return NextResponse.json({ success: true })
}
