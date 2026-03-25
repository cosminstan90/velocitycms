/**
 * PATCH /api/redirects/[id]/hits
 * Increments the hit counter. Called fire-and-forget from Edge middleware.
 * Protected by x-internal-key header (no user session required).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const internalKey = req.headers.get('x-internal-key') ?? ''
  const expectedKey = process.env.INTERNAL_API_KEY ?? ''

  // Enforce key only when one is configured
  if (expectedKey && internalKey !== expectedKey) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.redirect.update({
      where: { id },
      data: { hits: { increment: 1 } },
    })
  } catch {
    // Redirect may have been deleted between middleware lookup and here — non-fatal
  }

  return NextResponse.json({ ok: true })
}
