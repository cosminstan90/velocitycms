import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.page.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    select: { id: true, slug: true, status: true, publishedAt: true },
  })

  try {
    revalidateTag('homepage')
    revalidateTag(`page-${id}`)
    revalidatePath('/', 'page')
    revalidatePath(`/${page.slug}`, 'page')
  } catch {
    // ignore in dev
  }

  return NextResponse.json({ page: updated })
}
