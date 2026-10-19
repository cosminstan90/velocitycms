/**
 * Baza absoluta pentru URL-urile de metadate relative (imaginile file-based opengraph/twitter-image).
 * Fara ea, Next le construieste pe host-ul si portul procesului (ex. http://localhost:3002 in productie).
 * Intoarce undefined pentru valori lipsa sau invalide, ca sa nu strice randarea.
 */
export function resolveMetadataBase(siteUrl: string | null | undefined): URL | undefined {
  const raw = siteUrl?.trim()
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return new URL(url.origin)
  } catch {
    return undefined
  }
}
