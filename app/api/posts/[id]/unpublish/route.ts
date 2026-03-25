import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, categoryId: true, category: { select: { slug: true, parentId: true, parent: { select: { slug: true } } } } },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.post.update({
    where: { id },
    data: { status: 'DRAFT', publishedAt: null },
    select: { id: true, slug: true, status: true, publishedAt: true },
  })

  try {
    revalidateTag('homepage', { expire: 0 })
    revalidateTag('posts', { expire: 0 })
    revalidateTag(`post-${id}`, { expire: 0 })
    revalidateTag(`post-${post.slug}`, { expire: 0 })
    if (post.categoryId) {
      revalidateTag(`category-${post.categoryId}`, { expire: 0 })
    }

    revalidatePath('/', 'page')
    revalidatePath('/blog', 'page')
    if (post.category) {
      const cat = post.category
      revalidatePath(`/${cat.slug}`, 'page')
      if (cat.parent) {
        revalidatePath(`/${cat.parent.slug}/${cat.slug}`, 'page')
        revalidatePath(`/${cat.parent.slug}/${cat.slug}/${post.slug}`, 'page')
      } else {
        revalidatePath(`/${cat.slug}/${post.slug}`, 'page')
      }
    } else {
      revalidatePath(`/blog/${post.slug}`, 'page')
    }
  } catch {
    // ignore in dev
  }

  return NextResponse.json({ post: updated })
}
