import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { notifyPostPublished } from '@/lib/notifications/email-service'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.post.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    select: { id: true, slug: true, status: true, publishedAt: true },
  })

  try {
    // ── Tag-based invalidation (for pages using unstable_cache) ────────────
    revalidateTag('homepage', { expire: 0 })
    revalidateTag('posts', { expire: 0 })
    revalidateTag(`post-${id}`, { expire: 0 })
    revalidateTag(`post-${post.slug}`, { expire: 0 })
    if (post.categoryId) {
      revalidateTag(`category-${post.categoryId}`, { expire: 0 })
    }

    // ── Path-based invalidation (works for all ISR pages) ─────────────────
    revalidatePath('/', 'page')
    revalidatePath('/blog', 'page')

    if (post.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: post.categoryId },
        select: { slug: true, parentId: true, parent: { select: { slug: true } } },
      })
      if (cat) {
        revalidateTag(`category-${cat.slug}`, { expire: 0 })
        if (cat.parent) {
          // Article is in subcategory: /parentSlug/catSlug/postSlug
          revalidatePath(`/${cat.parent.slug}`, 'page')
          revalidatePath(`/${cat.parent.slug}/${cat.slug}`, 'page')
          revalidatePath(`/${cat.parent.slug}/${cat.slug}/${post.slug}`, 'page')
        } else {
          // Article is in root category: /catSlug/postSlug
          revalidatePath(`/${cat.slug}`, 'page')
          revalidatePath(`/${cat.slug}/${post.slug}`, 'page')
        }
      }
    } else {
      // Uncategorized article: /blog/postSlug
      revalidatePath(`/blog/${post.slug}`, 'page')
    }
  } catch {
    // revalidatePath/revalidateTag only work in deployed Next.js — silently ignore in dev
  }

  // Fire-and-forget publish notification
  notifyPostPublished(post.siteId, {
    title: post.title,
    slug: post.slug,
    categorySlug: null,
  }).catch(() => {})

  return NextResponse.json({ post: updated })
}
