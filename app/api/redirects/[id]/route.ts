import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { refreshRedirectsCache } from '@/lib/redis/redirects'

type Params = { params: Promise<{ id: string }> }

// ─── PUT — update redirect ────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.redirect.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as {
    fromPath?: string
    toPath?: string
    statusCode?: number
    isActive?: boolean
  }

  const fromPath  = body.fromPath  ?? existing.fromPath
  const toPath    = body.toPath    ?? existing.toPath
  const statusCode = body.statusCode ?? existing.statusCode

  if (!fromPath.startsWith('/'))
    return NextResponse.json({ error: 'fromPath must start with /' }, { status: 422 })
  if (!toPath.startsWith('/') && !toPath.startsWith('http'))
    return NextResponse.json({ error: 'toPath must start with / or http(s)://' }, { status: 422 })
  if (fromPath === toPath)
    return NextResponse.json({ error: 'Circular redirect' }, { status: 422 })

  try {
    const redirect = await prisma.redirect.update({
      where: { id },
      data: {
        fromPath,
        toPath,
        statusCode,
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })
    await refreshRedirectsCache(existing.siteId)
    return NextResponse.json({ redirect })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002')
      return NextResponse.json({ error: `fromPath ${fromPath} already in use` }, { status: 409 })
    throw e
  }
}

// ─── DELETE — remove redirect ─────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.redirect.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.redirect.delete({ where: { id } })
  await refreshRedirectsCache(existing.siteId)
  return NextResponse.json({ success: true })
}
