// Imaginea og:image implicita (app/opengraph-image.tsx). Paginile care seteaza
// propriul `openGraph` inlocuiesc complet imaginea din fisierul conventie, deci
// o includem explicit cand nu exista o imagine proprie sau una setata in SEO.
export function ogImages(siteUrl: string, url?: string | null): { url: string }[] {
  if (url) return [{ url }]
  return [{ url: `${siteUrl.replace(/\/$/, '')}/opengraph-image` }]
}
