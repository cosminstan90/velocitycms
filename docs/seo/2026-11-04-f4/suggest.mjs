// Colecteaza sugestii Google Autocomplete (ro/RO) pentru seminte + modificatori. Fara volume: arata DOAR formularile reale.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const BREEDS = ['labrador', 'ciobanesc german', 'beagle', 'husky', 'bulldog francez', 'golden retriever', 'maine coon', 'british shorthair', 'pisica persana', 'chihuahua']
const BREED_MODS = ['', ' cat traieste', ' pret', ' caracteristici', ' temperament', ' vs', ' sau', ' boli', ' hrana', ' cat cantareste']
const ANIMALS = ['balena', 'rechin', 'caracatita', 'urs polar', 'licurici', 'insecta', 'pinguin', 'delfin']
const ANIMAL_MODS = ['', ' cat traieste', ' ce mananca', ' unde traieste', ' specii']
const GENERIC = ['rase de caini', 'rase de pisici', 'rase de caini mici', 'rase de caini pentru apartament', 'caini de paza', 'pisica sau caine', 'cel mai inteligent caine', 'animale periculoase', 'animale marine', 'cele mai mari animale', 'cel mai mare', 'animale exotice de companie']

const queries = [
  ...BREEDS.flatMap((b) => BREED_MODS.map((m) => `${b}${m}`)),
  ...ANIMALS.flatMap((a) => ANIMAL_MODS.map((m) => `${a}${m}`)),
  ...GENERIC,
]

const out = {}
for (const q of queries) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ro&gl=ro&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/130' }, signal: AbortSignal.timeout(15000) })
    const json = await res.json()
    out[q] = json[1] ?? []
  } catch (e) {
    out[q] = ['ERR ' + e.message]
  }
  await sleep(350)
}
fs.writeFileSync(path.join(dir, 'suggestions.json'), JSON.stringify(out, null, 1))
const total = Object.values(out).reduce((n, a) => n + a.length, 0)
console.log(`queries=${queries.length} suggestions=${total} errors=${Object.values(out).filter((a) => a[0]?.startsWith?.('ERR')).length}`)
