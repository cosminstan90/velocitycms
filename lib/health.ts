/**
 * Logica pura pentru articolele de sanatate (grupul `sanatate`): nivelul de urgenta, rasele predispuse si
 * legaturile rasa <-> boala. Fara acces la baza de date: lib/health-data.ts aduce datele, aici doar le potrivim.
 */

export const HEALTH_GROUP = 'sanatate'

/** Blocul de sortOrder 400-499 din definitiile de campuri. */
export const HEALTH_KEYS = {
  urgency: 'urgenta',
  breeds: 'rase_predispuse',
} as const

export type UrgencyLevel = 'low' | 'medium' | 'high'

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Valorile camp `urgenta` din seed: "Monitorizare acasa" / "Consult veterinar in 24-48 h" / "Urgenta imediata". */
export const URGENCY_OPTIONS = ['Monitorizare acasă', 'Consult veterinar în 24–48 h', 'Urgență imediată'] as const

export function urgencyLevel(value: string | null | undefined): UrgencyLevel | null {
  if (!value) return null
  const v = normalize(value)
  if (v.startsWith('urgenta')) return 'high'
  if (v.startsWith('consult')) return 'medium'
  if (v.startsWith('monitorizare')) return 'low'
  return null
}

/** "Labrador, Golden retriever; Beagle" -> ["Labrador", "Golden retriever", "Beagle"]. */
export function parseBreedList(value: string | null | undefined): string[] {
  if (!value) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of value.split(/[,;\n·]+/)) {
    const name = part.trim()
    const key = normalize(name)
    if (name && key && !seen.has(key)) {
      seen.add(key)
      out.push(name)
    }
  }
  return out
}

export type BreedCandidate = { title: string; slug: string; href: string }
export type HealthLink = { title: string; href: string }

/** Titlul scurt al unei rase: "Labrador Retriever: caracteristici..." -> "labrador retriever". */
function breedKeys(c: BreedCandidate): string[] {
  const shortTitle = c.title.split(/\s[-–—:]\s|:\s/)[0] ?? c.title
  return [normalize(c.slug), normalize(shortTitle), normalize(c.title)].filter(Boolean)
}

/**
 * Potriveste numele de rase scrise in articol cu articolele-rasa publicate. Potrivire exacta (dupa
 * normalizare) cu slug-ul sau titlul scurt, sau cu slug-ul care incepe cu numele ("labrador" ->
 * "labrador-rasa-caini-caracteristici"). Un nume care nu se potriveste nu produce link.
 */
export function matchBreeds(names: string[], candidates: BreedCandidate[]): HealthLink[] {
  const out: HealthLink[] = []
  const used = new Set<string>()
  for (const name of names) {
    const key = normalize(name)
    if (!key) continue
    const hit = candidates.find((c) => {
      const keys = breedKeys(c)
      return keys.includes(key) || normalize(c.slug).startsWith(`${key} `)
    })
    if (hit && !used.has(hit.href)) {
      used.add(hit.href)
      out.push({ title: hit.title.split(/\s[-–—:]\s|:\s/)[0] ?? hit.title, href: hit.href })
    }
  }
  return out
}

export type HealthArticle = { title: string; href: string; breeds: string[] }

/** Articolele de sanatate care mentioneaza rasa data printre cele predispuse (relatia inversa). */
export function healthArticlesForBreed(breed: BreedCandidate, articles: HealthArticle[]): HealthLink[] {
  return articles
    .filter((a) => matchBreeds(a.breeds, [breed]).length > 0)
    .map((a) => ({ title: a.title, href: a.href }))
}
