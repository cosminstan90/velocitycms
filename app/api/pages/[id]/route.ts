import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { appendRevision } from '@/lib/revisions'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      fieldValues: { include: { fieldDefinition: true } },
    },
  })

  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ page })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const revisions = appendRevision(page.revisions, {
    savedAt: new Date().toISOString(),
    savedBy: session.user.id,
    title: page.title,
    contentJson: page.contentJson,
    contentHtml: page.contentHtml,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
  })

  let slug = page.slug
  if (body.slug && body.slug !== page.slug) {
    slug = slugify(body.slug)
    const conflict = await prisma.page.findFirst({
      where: { siteId: page.siteId, slug, id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already exists for this site' }, { status: 409 })
  }

  const updated = await prisma.page.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      slug,
      ...(body.contentJson !== undefined && { contentJson: body.contentJson }),
      ...(body.contentHtml !== undefined && { contentHtml: body.contentHtml }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.template !== undefined && { template: body.template }),
      ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle }),
      ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription }),
      ...(body.canonicalUrl !== undefined && { canonicalUrl: body.canonicalUrl }),
      ...(body.noIndex !== undefined && { noIndex: body.noIndex }),
      ...(body.schemaMarkup !== undefined && { schemaMarkup: body.schemaMarkup }),
      revisions: revisions as any,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  try {
    revalidateTag(`page-${id}`)
    revalidatePath('/', 'page')
    revalidatePath(`/${updated.slug}`, 'page')
  } catch {
    // ignore in dev
  }

  return NextResponse.json({ page: updated })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (page.status !== 'DRAFT' && page.status !== 'ARCHIVED') {
    return NextResponse.json({ error: 'Only DRAFT or ARCHIVED pages can be deleted' }, { status: 409 })
  }

  await prisma.page.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
