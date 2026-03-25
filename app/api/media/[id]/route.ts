import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { siteUploadDir } from '@/lib/media/storage'

type Params = { params: Promise<{ id: string }> }

// ─── GET — single media item ──────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ media })
}

// ─── PUT — update altText / caption ──────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.media.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as { altText?: string | null; caption?: string | null }

  const updated = await prisma.media.update({
    where: { id },
    data: {
      ...(body.altText !== undefined && { altText: body.altText }),
      ...(body.caption !== undefined && { caption: body.caption }),
    },
  })

  return NextResponse.json({ media: updated })
}

// ─── DELETE — remove media record + files ────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if used as featured image in any post
  const usedInPost = await prisma.post.findFirst({
    where: { featuredImageId: id },
    select: { id: true, title: true },
  })
  if (usedInPost) {
    return NextResponse.json(
      { error: `Cannot delete: used as featured image in "${usedInPost.title}"` },
      { status: 409 }
    )
  }

  // Delete files from disk (non-fatal — files may already be missing)
  const uploadDir = siteUploadDir(media.siteId)
  const filesToDelete = [media.filename, media.urlOriginal]
    .filter(Boolean)
    .map((f) => path.join(uploadDir, path.basename(f!)))

  // Also attempt thumb + og variants
  if (media.filename) {
    const stem = media.filename.replace(/\.webp$/, '')
    filesToDelete.push(
      path.join(uploadDir, `${path.basename(stem)}-thumb.webp`),
      path.join(uploadDir, `${path.basename(stem)}-og.webp`)
    )
  }

  await Promise.allSettled(filesToDelete.map((f) => fs.unlink(f)))

  await prisma.media.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
