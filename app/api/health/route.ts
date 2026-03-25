import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      version: '1.0.0',
      timestamp: new Date(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        version: '1.0.0',
        timestamp: new Date(),
      },
      { status: 503 }
    )
  }
}
