import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, description, metaTitle, metaDesc, parentId } = body

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let slug = category.slug
  if (body.slug) slug = slugify(body.slug)
  else if (name && name !== category.name) slug = slugify(name)

  // Check slug uniqueness (excluding self)
  if (slug !== category.slug) {
    const conflict = await prisma.category.findFirst({
      where: { siteId: category.siteId, slug, id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already exists for this site' }, { status: 409 })
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      slug,
      ...(description !== undefined && { description }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDesc !== undefined && { metaDesc }),
      ...(parentId !== undefined && { parentId: parentId ?? null }),
    },
  })

  try {
    revalidateTag(`category-${id}`, { expire: 0 })
    revalidatePath('/', 'page')
    revalidatePath(`/${updated.slug}`, 'page')
    if (updated.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: updated.parentId } })
      if (parent) {
        revalidatePath(`/${parent.slug}/${updated.slug}`, 'page')
      }
    }
  } catch {
    // ignore in dev
  }

  return NextResponse.json({ category: updated })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const postCount = await prisma.post.count({ where: { categoryId: id } })
  if (postCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${postCount} post(s) assigned to this category`, postCount },
      { status: 409 }
    )
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
