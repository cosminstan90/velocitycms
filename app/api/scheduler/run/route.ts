// GET /api/scheduler/run
//
// Cron endpoint — publishes all posts whose scheduledAt <= now().
// Protected by X-Cron-Secret header (matches CRON_SECRET env var).
//
// Add to server crontab (every minute):
//   * * * * * curl -s -H "X-Cron-Secret: YOUR_CRON_SECRET" \
//     https://yourdomain.com/api/scheduler/run >> /var/log/velocitycms-scheduler.log 2>&1
//
// Response: { published: number, errors: string[] }

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { notifyPostPublished } from '@/lib/notifications/email-service'

export async function GET(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const errors: string[] = []
  let published = 0

  // ── Query due posts ────────────────────────────────────────────────────────
  const duePosts = await prisma.post.findMany({
    where: {
      status: 'DRAFT',
      scheduledAt: { not: null, lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      siteId: true,
      slug: true,
      title: true,
      categoryId: true,
      scheduledAt: true,
      category: { select: { slug: true, parentId: true, parent: { select: { slug: true } } } },
    },
  })

  for (const post of duePosts) {
    try {
      // ── Publish post ─────────────────────────────────────────────────────
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
          scheduledAt: null,
        },
      })

      // ── Update SchedulerLog ──────────────────────────────────────────────
      await prisma.schedulerLog.updateMany({
        where: { postId: post.id, status: 'PENDING' },
        data: { status: 'PUBLISHED', publishedAt: now },
      })

      // ── ISR invalidation ─────────────────────────────────────────────────
      try {
        revalidateTag('homepage', { expire: 0 })
        revalidateTag('posts', { expire: 0 })
        revalidateTag(`post-${post.id}`, { expire: 0 })
        revalidateTag(`post-${post.slug}`, { expire: 0 })
        revalidatePath('/', 'page')
        revalidatePath('/blog', 'page')

        if (post.category) {
          revalidateTag(`category-${post.categoryId}`, { expire: 0 })
          if (post.category.parent) {
            revalidatePath(`/${post.category.parent.slug}`, 'page')
            revalidatePath(`/${post.category.parent.slug}/${post.category.slug}`, 'page')
            revalidatePath(`/${post.category.parent.slug}/${post.category.slug}/${post.slug}`, 'page')
          } else {
            revalidatePath(`/${post.category.slug}`, 'page')
            revalidatePath(`/${post.category.slug}/${post.slug}`, 'page')
          }
        } else {
          revalidatePath(`/blog/${post.slug}`, 'page')
        }
      } catch {
        // revalidation errors are non-fatal
      }

      // ── Email notification (fire-and-forget) ──────────────────────────────
      notifyPostPublished(post.siteId, {
        title: post.title,
        slug: post.slug,
        categorySlug: post.category?.slug ?? null,
      }).catch(() => {})

      published++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Post ${post.id} (${post.slug}): ${msg}`)

      // Mark log as FAILED
      await prisma.schedulerLog.updateMany({
        where: { postId: post.id, status: 'PENDING' },
        data: { status: 'FAILED', error: msg },
      }).catch(() => {})
    }
  }

  console.log(`[scheduler/run] ${now.toISOString()} — published ${published}, errors ${errors.length}`)

  return NextResponse.json({
    published,
    errors,
    checkedAt: now.toISOString(),
    total: duePosts.length,
  })
}
