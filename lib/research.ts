/**
 * Cercetare de cuvinte-cheie: logica pura folosita de scripts/research/suggest.ts.
 * Autocomplete arata formularile reale, NU volumele; clasificarea de aici este euristica si se verifica manual.
 * Fara importuri cu alias (@/) ca scriptul sa ruleze sub ts-node.
 */

export type Intent = 'list' | 'comparison' | 'short-answer' | 'health' | 'informational' | 'commercial' | 'noise'

const COMMERCIAL = /\b(de vanzare|pret|preturi|cumpar\w*|olx|magazin|oferta|oferte|ieftin\w*|comanda)\b/
const NOISE = /\b(wikipedia|pdf|film|filme|imagini|poze|colorat|desene|reteta|retete|pescobar|auchan|carrefour|kaufland|srl|impex|land|download|lyrics|moon)\b/
const COMPARISON = /\b(vs|versus)\b/
const COMPARISON_OR = /\bsau\b/
const LIST = /^(rase|cele mai|cei mai|cea mai|top|animale|specii)\b|\bpentru apartament\b|\bcare nu\b|\bde la a la z\b/
const SHORT_ANSWER = /\b(cat (traieste|cantareste|creste|mananca|alearga)|ce mananca|unde traieste|cate \w+ (are|traiesc)|cum se numeste)\b/
const HEALTH = /\b(boli|boala|simptome|simptom|vomita|diaree|tratament|vaccin\w*|deparazit\w*|capusa|capuse|toxic\w*|otrav\w*|sterilizare|castrare)\b/

/** Fara diacritice, minuscule, spatii normalizate: cheia de comparatie a unui cuvant-cheie. */
export function normalizeKeyword(k: string): string {
  return k
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Intentia probabila a unei interogari. Ordinea conteaza: zgomotul si comercialul se exclud primele. */
export function classifyKeyword(keyword: string): Intent {
  const k = normalizeKeyword(keyword)
  if (NOISE.test(k)) return 'noise'
  if (COMMERCIAL.test(k)) return 'commercial'
  if (COMPARISON.test(k) || COMPARISON_OR.test(k)) return 'comparison'
  if (HEALTH.test(k)) return 'health'
  if (SHORT_ANSWER.test(k)) return 'short-answer'
  if (LIST.test(k)) return 'list'
  return 'informational'
}

/** Intentiile pe care le servim; restul se exclud din backlog (dar raman in fisierul brut, cu motivul). */
export const SERVED_INTENTS: ReadonlySet<Intent> = new Set(['list', 'comparison', 'short-answer', 'health', 'informational'])

export type KeywordRow = {
  keyword: string
  seed: string
  intent: Intent
  /** Motivul pentru care nu intra in backlog; gol daca intra. */
  dropReason: string
}

/**
 * Deduplica (dupa cheia normalizata) si clasifica sugestiile. Sugestiile identice cu samanta, mai scurte de 4
 * caractere sau care nu contin litere sunt omise; „sau” fara doua entitati ramane `comparison` dar se marcheaza
 * pentru verificare manuala.
 */
export function buildKeywordRows(suggestions: Array<{ seed: string; suggestions: string[] }>): KeywordRow[] {
  const seen = new Set<string>()
  const rows: KeywordRow[] = []
  for (const { seed, suggestions: list } of suggestions) {
    for (const keyword of list) {
      const key = normalizeKeyword(keyword)
      if (key.length < 4 || !/[a-z]/.test(key) || key === normalizeKeyword(seed) || seen.has(key)) continue
      seen.add(key)
      const intent = classifyKeyword(keyword)
      let dropReason = ''
      if (!SERVED_INTENTS.has(intent)) dropReason = intent
      else if (intent === 'comparison' && COMPARISON_OR.test(key) && !COMPARISON.test(key)) dropReason = 'verifica manual ("sau")'
      rows.push({ keyword, seed, intent, dropReason })
    }
  }
  return rows
}

/** Camp CSV cu ghilimele daca e nevoie (virgula, ghilimea, rand nou). */
export function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.map(csvField).join(',')).join('\n') + '\n'
}

// Semintele implicite (aceleasi ca in recolta din 2026-11-04)
export const DEFAULT_BREEDS = ['labrador', 'ciobanesc german', 'beagle', 'husky', 'bulldog francez', 'golden retriever', 'maine coon', 'british shorthair', 'pisica persana', 'chihuahua']
export const BREED_MODIFIERS = ['', ' cat traieste', ' pret', ' caracteristici', ' temperament', ' vs', ' sau', ' boli', ' hrana', ' cat cantareste']
export const DEFAULT_ANIMALS = ['balena', 'rechin', 'caracatita', 'urs polar', 'licurici', 'insecta', 'pinguin', 'delfin']
export const ANIMAL_MODIFIERS = ['', ' cat traieste', ' ce mananca', ' unde traieste', ' specii']
export const DEFAULT_GENERIC = [
  'rase de caini', 'rase de pisici', 'rase de caini mici', 'rase de caini pentru apartament', 'caini de paza', 'pisica sau caine',
  'cel mai inteligent caine', 'animale periculoase', 'animale marine', 'cele mai mari animale', 'cel mai mare', 'animale exotice de companie',
]

/** Interogarile implicite: fiecare rasa/animal cu modificatorii lui, plus interogarile generice. */
export function defaultQueries(): string[] {
  return [
    ...DEFAULT_BREEDS.flatMap((b) => BREED_MODIFIERS.map((m) => `${b}${m}`)),
    ...DEFAULT_ANIMALS.flatMap((a) => ANIMAL_MODIFIERS.map((m) => `${a}${m}`)),
    ...DEFAULT_GENERIC,
  ]
}

/** Adauga a-z dupa o samanta ("labrador a", "labrador b"...) pentru o recolta mai larga. */
export function alphabetExpansion(seed: string): string[] {
  return 'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => `${seed} ${l}`)
}
