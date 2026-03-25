import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  const ids = body.ids.filter((i: any) => typeof i === 'string')

  await prisma.$transaction(
    ids.map((id: string, idx: number) =>
      prisma.fieldDefinition.update({ where: { id }, data: { sortOrder: idx + 1 } })
    )
  )

  return NextResponse.json({ success: true })
}
