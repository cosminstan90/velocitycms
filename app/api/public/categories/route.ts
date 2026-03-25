/**
 * GET /api/public/categories
 * Returns all categories as a nested tree. Requires X-API-Key header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth/api-key'

interface CategoryNode {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  children: CategoryNode[]
}

function buildTree(flat: Omit<CategoryNode, 'children'>[], parentId: string | null = null): CategoryNode[] {
  return flat
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(flat, c.id) }))
}

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req.headers.get('x-api-key') ?? '')
  if (!ctx) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { siteId: ctx.siteId },
    select: { id: true, name: true, slug: true, description: true, parentId: true },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  })

  const tree = buildTree(categories)
  return NextResponse.json({ categories: tree, total: categories.length })
}
