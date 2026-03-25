import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const detach = req.nextUrl.searchParams.get('detach') === 'true'

  const postCount = await prisma.postTag.count({ where: { tagId: id } })

  if (postCount > 0 && !detach) {
    return NextResponse.json(
      { error: `Tag is used on ${postCount} post(s). Pass ?detach=true to remove anyway.`, postCount },
      { status: 409 }
    )
  }

  // Detach from all posts first, then delete
  if (postCount > 0) {
    await prisma.postTag.deleteMany({ where: { tagId: id } })
  }

  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
