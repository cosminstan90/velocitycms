import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type FieldValueItem = { fieldDefinitionId: string; value: string }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  const values = await prisma.fieldValue.findMany({
    where: { pageId: id },
    include: { fieldDefinition: true },
  })

  return NextResponse.json({ fieldValues: values })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected an array of field values' }, { status: 400 })
  }

  const items: FieldValueItem[] = body

  const upserted = await prisma.$transaction(
    items.map((item) =>
      prisma.fieldValue.upsert({
        where: { pageId_fieldDefinitionId: { pageId: id, fieldDefinitionId: item.fieldDefinitionId } },
        create: {
          pageId: id,
          fieldDefinitionId: item.fieldDefinitionId,
          value: item.value ?? '',
        },
        update: { value: item.value ?? '' },
      })
    )
  )

  return NextResponse.json({ fieldValues: upserted })
}
