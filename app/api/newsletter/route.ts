import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, message: 'Adresă email invalidă.' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json({ ok: false, message: 'Adresă email invalidă.' }, { status: 400 })
    }

    // Log the subscription — real email delivery can be wired here later
    // e.g. SendGrid, Mailchimp API, or a `Subscriber` Prisma model
    try {
      const seo = await prisma.seoSettings.findFirst()
      // Placeholder: in production, send to seo.notifyEmail or call email provider API
      void seo
    } catch {
      // DB unavailable — still return success so UX isn't broken
    }

    console.info('[newsletter] new subscription:', trimmed)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, message: 'Eroare server. Încearcă din nou.' }, { status: 500 })
  }
}
