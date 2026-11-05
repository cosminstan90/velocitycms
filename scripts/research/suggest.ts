/**
 * Recolta Google Autocomplete (ro/RO) pentru cercetarea de cuvinte-cheie. Nu necesita baza de date sau chei.
 * Autocomplete arata formularile reale, NU volumele: volumele vin din Search Console (vezi docs/seo/README-research.md).
 *
 *   node node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/research/suggest.ts \
 *     [--seeds "labrador,beagle"] [--mods ",cat traieste,pret"] [--alphabet] [--out docs/seo/research/keywords-AAAA-LL-ZZ.csv]
 *
 * Fara --seeds foloseste interogarile implicite din lib/research.ts. --alphabet adauga a-z dupa fiecare samanta
 * (mult mai multe cereri; ~350 ms intre ele). Iesire: CSV cu keyword, seed, intent, drop_reason.
 */
import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { alphabetExpansion, buildKeywordRows, defaultQueries, toCsv } from '../../lib/research'

const DELAY_MS = 350
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function suggest(query: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ro&gl=ro&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'DiVetResearch/1.0 (+https://divet.ro)' }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as [string, string[]]
  return json[1] ?? []
}

async function main() {
  const seedsArg = arg('seeds')
  const modsArg = arg('mods')
  let queries: string[]
  if (seedsArg) {
    const seeds = seedsArg.split(',').map((s) => s.trim()).filter(Boolean)
    const mods = modsArg !== undefined ? modsArg.split(',').map((m) => (m ? ` ${m.trim()}` : '')) : ['']
    queries = seeds.flatMap((s) => mods.map((m) => `${s}${m}`))
  } else {
    queries = defaultQueries()
  }
  if (process.argv.includes('--alphabet')) queries = queries.flatMap((q) => [q, ...alphabetExpansion(q)])

  const today = new Date().toISOString().slice(0, 10)
  const out = arg('out') ?? `docs/seo/research/keywords-${today}.csv`

  const collected: Array<{ seed: string; suggestions: string[] }> = []
  let errors = 0
  for (const q of queries) {
    try {
      collected.push({ seed: q, suggestions: await suggest(q) })
    } catch (e) {
      errors++
      console.error(`eroare la "${q}": ${e instanceof Error ? e.message : e}`)
    }
    await sleep(DELAY_MS)
  }

  const rows = buildKeywordRows(collected)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, toCsv(['keyword', 'seed', 'intent', 'drop_reason'], rows.map((r) => [r.keyword, r.seed, r.intent, r.dropReason])))

  const kept = rows.filter((r) => !r.dropReason)
  const byIntent = new Map<string, number>()
  for (const r of kept) byIntent.set(r.intent, (byIntent.get(r.intent) ?? 0) + 1)
  console.error(`interogari=${queries.length} erori=${errors} cuvinte-unice=${rows.length} in-backlog=${kept.length} ` + [...byIntent].map(([k, n]) => `${k}:${n}`).join(' '))
  console.error(`scris: ${out}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
