import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var _prismaClient: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    // During Next.js build-time static analysis there is no DATABASE_URL.
    // Return a bare client so module evaluation doesn't crash — actual
    // queries will fail at runtime only if DATABASE_URL is truly absent.
    return new PrismaClient()
  }

  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma: PrismaClient =
  globalThis._prismaClient ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis._prismaClient = prisma
}
