import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbStatus = 'ok'
  let redisStatus = 'ok'

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'error'
  }

  try {
    await redis.ping()
  } catch {
    redisStatus = 'error'
  }

  const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded'

  return NextResponse.json(
    { status, db: dbStatus, redis: redisStatus },
    { status: status === 'ok' ? 200 : 503 },
  )
}
