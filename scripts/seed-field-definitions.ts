import { PrismaClient, FieldType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 cere un adapter; la fel construiesc clientul lib/prisma.ts si prisma/seed.ts.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const RATING = ['Foarte scăzut', 'Scăzut', 'Mediu', 'Ridicat', 'Foarte ridicat']

type Def = {
  fieldKey: string
  fieldLabel: string
  fieldType: FieldType
  options?: string[]
  sortOrder: number
  showInSchema?: boolean
  schemaProperty?: string
}

// 100-199 specificatii · 200-299 profil comportamental · 300-399 conservare
const DEFS: Def[] = [
  { fieldKey: 'tldr', fieldLabel: 'Pe scurt', fieldType: 'TEXTAREA', sortOrder: 10 },

  { fieldKey: 'origine', fieldLabel: 'Origine', fieldType: 'TEXT', sortOrder: 100 },
  { fieldKey: 'talie', fieldLabel: 'Talie', fieldType: 'SELECT', options: ['Mic', 'Mediu', 'Mare', 'Variabil'], sortOrder: 110 },
  { fieldKey: 'greutate', fieldLabel: 'Greutate', fieldType: 'TEXT', sortOrder: 120 },
  { fieldKey: 'inaltime', fieldLabel: 'Înălțime', fieldType: 'TEXT', sortOrder: 130 },
  { fieldKey: 'speranta_viata', fieldLabel: 'Speranță de viață', fieldType: 'TEXT', sortOrder: 140 },
  { fieldKey: 'temperament', fieldLabel: 'Temperament', fieldType: 'TEXT', sortOrder: 150 },
  { fieldKey: 'anvergura', fieldLabel: 'Anvergura aripilor', fieldType: 'TEXT', sortOrder: 160 },
  { fieldKey: 'habitat', fieldLabel: 'Habitat', fieldType: 'TEXT', sortOrder: 170 },
  { fieldKey: 'dieta', fieldLabel: 'Dietă', fieldType: 'TEXT', sortOrder: 180 },
  { fieldKey: 'lungime_max', fieldLabel: 'Lungime maximă', fieldType: 'TEXT', sortOrder: 190 },
  { fieldKey: 'greutate_max', fieldLabel: 'Greutate maximă', fieldType: 'TEXT', sortOrder: 195 },
  { fieldKey: 'adancime', fieldLabel: 'Adâncime', fieldType: 'TEXT', sortOrder: 198 },

  { fieldKey: 'nivel_energie', fieldLabel: 'Nivel de energie', fieldType: 'SELECT', options: RATING, sortOrder: 200 },
  { fieldKey: 'ingrijire_blana', fieldLabel: 'Îngrijirea blănii', fieldType: 'SELECT', options: RATING, sortOrder: 210 },
  { fieldKey: 'usurinta_dresaj', fieldLabel: 'Ușurința la dresaj', fieldType: 'SELECT', options: RATING, sortOrder: 220 },
  { fieldKey: 'toleranta_singuratate', fieldLabel: 'Tolerează singurătatea', fieldType: 'SELECT', options: RATING, sortOrder: 230 },
  { fieldKey: 'bun_cu_copiii', fieldLabel: 'Bun cu copiii', fieldType: 'SELECT', options: ['Da', 'Nu'], sortOrder: 240 },

  { fieldKey: 'statut_conservare', fieldLabel: 'Statut de conservare', fieldType: 'SELECT', options: ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'], sortOrder: 300 },
]
// FAQ-ul NU e un camp: publisher-ul primeste `faqItems` si il adauga ca nod `faqBlock`
// in continutul TipTap; schema FAQPage e generata de lib/seo/schema-generator.ts.

// Forma reala asteptata de admin/editor: sir JSON de [{value,label}]
// (app/api/field-definitions/route.ts:92 face JSON.stringify; CustomFieldsPanel.tsx:124 face JSON.parse
// si foloseste opt.value/opt.label). Valoarea salvata este afisata ca atare in ArticleTemplate,
// deci value == label == textul romanesc.
function toOptions(options?: string[]): string | undefined {
  return options ? JSON.stringify(options.map((o) => ({ value: o, label: o }))) : undefined
}

async function main() {
  const domain = process.env.SEED_SITE_DOMAIN ?? 'divet.ro'
  const site = await prisma.site.findFirst({ where: { domain } })
  if (!site) throw new Error(`Site-ul ${domain} nu exista in baza`)

  for (const d of DEFS) {
    const existing = await prisma.fieldDefinition.findFirst({
      where: { siteId: site.id, postType: 'POST', fieldKey: d.fieldKey },
    })
    const data = {
      siteId: site.id,
      postType: 'POST' as const,
      fieldKey: d.fieldKey,
      fieldLabel: d.fieldLabel,
      fieldType: d.fieldType,
      fieldOptions: toOptions(d.options) as never,
      sortOrder: d.sortOrder,
      showInSchema: d.showInSchema ?? false,
      schemaProperty: d.schemaProperty ?? null,
      isRequired: false,
    }
    if (existing) {
      await prisma.fieldDefinition.update({ where: { id: existing.id }, data })
      console.log(`actualizat: ${d.fieldKey}`)
    } else {
      await prisma.fieldDefinition.create({ data })
      console.log(`creat: ${d.fieldKey}`)
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
