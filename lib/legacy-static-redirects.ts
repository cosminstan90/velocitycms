/**
 * Static (DB-free) redirects for old divet.ro URLs found in Search Console
 * ("Not found" / crawled-not-indexed export, 2026-11-03).
 *
 * Used by next.config.ts redirects(); targets here are known-published pages.
 * Old /{group}/{slug} paths whose target depends on the DB live in
 * lib/legacy-redirects.ts instead.
 */
export interface StaticRedirect {
  source: string
  destination: string
  permanent: true
}

const r = (source: string, destination: string): StaticRedirect => ({
  source,
  destination,
  permanent: true,
})

// Old tag pages crawled with a stray "-1" suffix.
const TAGS_WITH_SUFFIX = [
  'ciobanesc-german',
  'caini-de-lucru',
  'rase-mici',
  'golden-retriever',
  'labrador-retriever',
  'rase-mari',
  'caini-prietenosi',
  'bichon-frise',
  'caini-familie',
]

export const LEGACY_STATIC_REDIRECTS: readonly StaticRedirect[] = [
  // Old home variants (www/non-www both land here after the nginx redirect).
  r('/index.php', '/'),
  r('/index.html', '/'),

  // Old flat breed URLs -> /caini/rase/...
  r('/rase/bichon-frise-rasa-caini-caracteristici', '/caini/rase/bichon-frise-rasa-caini-caracteristici'),
  r('/labrador-rasa-caini-caracteristici', '/caini/rase/labrador-rasa-caini-caracteristici'),
  r('/golden-retriever-caracteristici-temperament', '/caini/rase/golden-retriever-caracteristici-temperament'),

  // Old category roots and numbered duplicates -> the hub that exists today.
  r('/categorie/caini', '/caini'),
  r('/categorie/pisici', '/pisici'),
  r('/caini-1', '/caini'),
  r('/pisici-1', '/pisici'),
  r('/salbatice-1', '/salbatice'),
  r('/caini/rase-2', '/caini/rase'),
  r('/pisici/sanatate-2', '/pisici'),
  r('/pisici/comportament-2', '/pisici'),
  r('/salbatice/rapitoare-2', '/salbatice'),
  r('/salbatice/fauna-romaniei-2', '/salbatice'),

  r('/cautare-1', '/cautare'),
  r('/politica-de-confidentialitate', '/politica-confidentialitate'),

  ...TAGS_WITH_SUFFIX.map((t) => r(`/eticheta/${t}-1`, `/eticheta/${t}`)),
]
