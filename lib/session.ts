import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return session
}
