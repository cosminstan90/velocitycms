import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import authConfig from '@/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Rate limit: 5 login attempts per 15 minutes per email address
        const rl = await rateLimit(`login:${String(credentials.email).toLowerCase()}`, 5, 900)
        if (!rl.allowed) throw new Error('Too many login attempts. Try again in a few minutes.')

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role
        // Fetch first site user has access to
        const access = await prisma.userSiteAccess.findFirst({
          where: { userId: user.id as string },
          include: { site: true },
          orderBy: { site: { createdAt: 'asc' } },
        })
        token.activeSiteId = access?.siteId ?? null
        token.activeSiteName = access?.site?.name ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.activeSiteId = token.activeSiteId as string | null
        session.user.activeSiteName = token.activeSiteName as string | null
      }
      return session
    },
  },
})
