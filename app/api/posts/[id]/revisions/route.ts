import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, revisions: true },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const revisions = Array.isArray(post.revisions) ? post.revisions : []
  return NextResponse.json({ revisions: [...revisions].reverse() })
}
