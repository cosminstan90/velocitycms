import { isValidIndexNowKey } from '@/lib/indexnow'

export const dynamic = 'force-dynamic'

/** Servit la /{INDEXNOW_KEY}.txt prin rewrite din next.config.ts: continutul fisierului-cheie este cheia insasi. */
export async function GET() {
  const key = process.env.INDEXNOW_KEY
  if (!isValidIndexNowKey(key)) return new Response('Not found', { status: 404 })
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
