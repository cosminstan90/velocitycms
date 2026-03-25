/**
 * DELETE /api/api-keys/[id]  — revoke (soft-delete: set isActive=false)
 * @eslint data-isolation: siteId is injected via middleware and used for data isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { id } = await params

  const key = await prisma.aPIKey.findUnique({
    where: { id },
    select: { siteId: true },
  })
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ensure the key belongs to the current site
  if (key.siteId !== siteId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.aPIKey.update({ where: { id }, data: { isActive: false } })

  return NextResponse.json({ success: true })
}
