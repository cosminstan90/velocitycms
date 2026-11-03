/**
 * IndexNow: anunta Bing/Yandex etc. ca un URL s-a publicat sau schimbat. Activ doar in productie si doar daca
 * INDEXNOW_KEY e setat; fisierul-cheie este servit la /{cheie}.txt (rewrite in next.config.ts).
 */
export function isValidIndexNowKey(key: string | undefined): key is string {
  return !!key && /^[a-zA-Z0-9-]{8,128}$/.test(key)
}

export async function pingIndexNow(siteUrl: string, paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY
  if (process.env.NODE_ENV !== 'production' || !isValidIndexNowKey(key) || paths.length === 0) return
  const base = siteUrl.replace(/\/+$/, '')
  try {
    await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(base).host,
        key,
        keyLocation: `${base}/${key}.txt`,
        urlList: paths.map((p) => `${base}${p}`),
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.warn('[indexnow] ping esuat:', err instanceof Error ? err.message : err)
  }
}
