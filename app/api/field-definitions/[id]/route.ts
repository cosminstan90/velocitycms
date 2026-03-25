import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const field = await prisma.fieldDefinition.findUnique({ where: { id } })
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ fieldDefinition: field })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const payload = await req.json()
  const updates: any = {}

  if (payload.fieldLabel !== undefined) updates.fieldLabel = String(payload.fieldLabel)
  if (payload.fieldOptions !== undefined) updates.fieldOptions = payload.fieldOptions ? JSON.stringify(payload.fieldOptions) : null
  if (payload.isRequired !== undefined) updates.isRequired = Boolean(payload.isRequired)
  if (payload.showInSchema !== undefined) updates.showInSchema = Boolean(payload.showInSchema)
  if (payload.schemaProperty !== undefined) updates.schemaProperty = payload.schemaProperty ? String(payload.schemaProperty) : null
  if (payload.sortOrder !== undefined) updates.sortOrder = Number(payload.sortOrder)

  const field = await prisma.fieldDefinition.findUnique({ where: { id } })
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Avoid accidental key collision by key changing via separate endpoint (not handled here)

  const updated = await prisma.fieldDefinition.update({ where: { id }, data: updates })
  return NextResponse.json({ fieldDefinition: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const field = await prisma.fieldDefinition.findUnique({ where: { id } })
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const count = await prisma.fieldValue.count({ where: { fieldDefinitionId: id } })
  if (count > 0) {
    return NextResponse.json({ error: 'Field definition in use', references: count }, { status: 409 })
  }

  await prisma.fieldDefinition.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
