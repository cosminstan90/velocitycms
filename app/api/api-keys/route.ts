/**
 * GET  /api/api-keys  — list keys (masked display)
 * POST /api/api-keys  — create key (full key returned ONCE in response)
 * @eslint data-isolation: siteId is injected via middleware and used for data isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { hash } from 'bcryptjs'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const keys = await prisma.aPIKey.findMany({
    where: { siteId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, keyPrefix: true,
      scopes: true, lastUsedAt: true, createdAt: true,
    },
  })

  // Mask: show prefix + dots
  const masked = keys.map((k) => ({
    ...k,
    keyMasked: `${k.keyPrefix}${'•'.repeat(16)}`,
  }))

  return NextResponse.json({ keys: masked })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const body = await req.json().catch(() => ({})) as {
    name?: string
    description?: string
    scopes?: string[]
  }

  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Generate key: sk- + 64 hex chars
  const rawKey = `sk-${randomBytes(32).toString('hex')}`
  const keyPrefix = rawKey.slice(0, 11) // sk- + first 8 hex

  // Hash with bcrypt (cost 10)
  const keyHash = await hash(rawKey, 10)

  const apiKey = await prisma.aPIKey.create({
    data: {
      siteId,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      keyHash,
      keyPrefix,
      scopes: body.scopes ?? [],
      isActive: true,
    },
    select: { id: true, name: true, description: true, keyPrefix: true, createdAt: true },
  })

  return NextResponse.json(
    {
      key: apiKey,
      // ⚠️  Full key is returned ONLY ONCE — it cannot be recovered after this response
      rawKey,
      warning: 'Store this key securely. It will not be shown again.',
    },
    { status: 201 }
  )
}
