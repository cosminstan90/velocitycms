import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type PostType = 'POST' | 'PAGE'
type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'DATE' | 'URL'

const validPostTypes: PostType[] = ['POST', 'PAGE']
const validFieldTypes: FieldType[] = ['TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'BOOLEAN', 'DATE', 'URL']

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')
  const postType = (req.nextUrl.searchParams.get('postType') ?? 'POST').toUpperCase() as PostType

  if (!siteId) {
    return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  }
  if (!validPostTypes.includes(postType)) {
    return NextResponse.json({ error: 'Invalid postType' }, { status: 400 })
  }

  const definitions = await prisma.fieldDefinition.findMany({
    where: { siteId, postType },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ fieldDefinitions: definitions })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { siteId, postType = 'POST', fieldLabel, fieldKey, fieldType, fieldOptions, isRequired = false, showInSchema = false, schemaProperty } = body

  if (!siteId || !fieldLabel || !fieldType) {
    return NextResponse.json({ error: 'siteId, fieldLabel and fieldType are required' }, { status: 400 })
  }

  const normalizedPostType = String(postType).toUpperCase() as PostType
  if (!validPostTypes.includes(normalizedPostType)) {
    return NextResponse.json({ error: 'Invalid postType' }, { status: 400 })
  }

  const normalizedFieldType = String(fieldType).toUpperCase() as FieldType
  if (!validFieldTypes.includes(normalizedFieldType)) {
    return NextResponse.json({ error: 'Invalid fieldType' }, { status: 400 })
  }

  const normalizedFieldKey = fieldKey ? slugify(String(fieldKey)) : slugify(String(fieldLabel))
  if (!normalizedFieldKey) {
    return NextResponse.json({ error: 'Unable to generate valid fieldKey' }, { status: 400 })
  }

  const collision = await prisma.fieldDefinition.findFirst({
    where: { siteId, postType: normalizedPostType, fieldKey: normalizedFieldKey },
  })
  if (collision) {
    return NextResponse.json({ error: 'fieldKey already exists for this site/postType' }, { status: 409 })
  }

  const maxSort = await prisma.fieldDefinition.aggregate({
    where: { siteId, postType: normalizedPostType },
    _max: { sortOrder: true },
  })

  const newField = await prisma.fieldDefinition.create({
    data: {
      siteId,
      postType: normalizedPostType,
      fieldLabel: String(fieldLabel),
      fieldKey: normalizedFieldKey,
      fieldType: normalizedFieldType,
      fieldOptions: fieldOptions ? JSON.stringify(fieldOptions) : undefined,
      isRequired: Boolean(isRequired),
      showInSchema: Boolean(showInSchema),
      schemaProperty: schemaProperty ? String(schemaProperty) : null,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  })

  return NextResponse.json({ fieldDefinition: newField }, { status: 201 })
}
