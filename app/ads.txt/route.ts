import { adsTxtLine, getAdsenseClient } from '@/lib/ads'

export const dynamic = 'force-dynamic'

/** /ads.txt: autorizeaza Google AdSense sa vanda inventarul site-ului. */
export async function GET() {
  const client = getAdsenseClient()
  if (!client) return new Response('Not found', { status: 404 })
  return new Response(`${adsTxtLine(client)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
