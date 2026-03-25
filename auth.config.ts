/**
 * Edge-compatible auth config — no Node.js APIs (no bcrypt, prisma, ioredis).
 * Used by middleware to verify JWT tokens without running DB queries.
 * The full config with providers and DB callbacks lives in auth.ts.
 */
import type { NextAuthConfig } from 'next-auth'

export default {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    async jwt({ token }) {
      // Middleware only reads existing tokens — no DB needed here.
      // Custom claims (id, role, activeSiteId) are written by auth.ts during sign-in.
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
} satisfies NextAuthConfig
