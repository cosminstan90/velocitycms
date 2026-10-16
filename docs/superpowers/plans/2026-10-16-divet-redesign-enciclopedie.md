# DiVet — redesign + enciclopedie · Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformăm divet.ro dintr-un shell cu trei articole într-o enciclopedie animală cu sistem de design propriu, fișe structurate și navigație generată din date, care scalează la zeci de specii.

**Architecture:** Rescriem template-ul `divet` pe un strat de tokeni Tailwind v4 prefixat `dv-`, lăsând `fauna` intact ca plasă de siguranță. Navigația se construiește din `Category` prin `parentId`, cu cache, astfel încât o categorie nouă apare fără deploy. Datele fișei vin din `FieldDefinition`/`FieldValue`, care există în schema dar au zero rânduri. Trecerea `site.template` de la `fauna` la `divet` e ultimul pas.

**Tech Stack:** Next.js (App Router), Prisma 7 + PostgreSQL, Tailwind CSS v4, `next/font`, Vitest (nou).

**Spec:** `docs/superpowers/specs/2026-10-16-divet-redesign-enciclopedie-design.md`
**Mockup aprobat:** artboard-urile `Cabinet2` și `Navigatie` din canvas-ul „DiVet — direcții vizuale"

---

## Convenții ale acestui plan

**Două convenții, declarate ca să nu fie citite ca lacune:**

1. **Testăm logica pură, nu prezentarea.** Proiectul nu are infrastructură de testare. Task 2 adaugă Vitest cu mediu `node`, pentru `lib/**/*.test.ts`. Primesc teste: construirea arborelui de navigație, maparea scalei de rating, generarea de schema. Componentele React de prezentare se verifică prin `tsc --noEmit`, `eslint` și inspecție în browser — testele de componente pentru un redesign vizual costă mult și prind puțin.

2. **Pentru componentele vizuale, specificația e mockup-ul.** Task-urile de componente dau contractul complet — props cu tipuri, structura DOM, tokenii folosiți, criteriile de acceptanță — și trimit la artboard pentru pixeli. Codul JSX complet nu se copiază în plan; ar însemna rescrierea a 2700 de linii aici.

**Comenzi rulate din `D:\Projects\Velocity\velocitycms`.**

---

## Faza 0 — Fundație

### Task 1: Pune munca necommitată în siguranță

**Files:** niciunul creat sau modificat — doar git.

Template-ul `divet/` e untracked pe `main`, împreună cu modificări în dispatcher, registry și trei rute. Rescrierea îl va înlocui aproape complet. Îl commitem ca punct de întoarcere, pe un branch separat.

- [ ] **Step 1: Verifică ce e necommitat**

```bash
git status --short
```

Expected: `M` pe `app/(frontend)/[slug]/[subSlug]/[articleSlug]/page.tsx`, `app/(frontend)/[slug]/[subSlug]/page.tsx`, `app/(frontend)/blog/[slug]/page.tsx`, `app/api/publisher/receive/route.ts`, `components/frontend/TemplateDispatcher.tsx`, `lib/templates/registry.ts`; `??` pe `AI_CONTENT_GUIDE.md` și `components/frontend/templates/divet/`.

- [ ] **Step 2: Creează branch-ul de lucru**

```bash
git checkout -b feat/divet-enciclopedie
```

- [ ] **Step 3: Commit munca existentă ca punct de plecare**

```bash
git add -A
git commit -m "chore: snapshot template divet si ghid de continut inainte de rescriere

Punct de intoarcere inainte de redesign. Template-ul divet si modificarile
asociate erau necommitate pe main.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Confirmă arborele curat**

```bash
git status --short
```

Expected: fără rezultat.

---

### Task 2: Instalează Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/navigation.test.ts`
- Modify: `package.json` (secțiunea `scripts`)

- [ ] **Step 1: Instalează dependența**

```bash
npm install -D vitest@3.2.4
```

- [ ] **Step 2: Scrie configul**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
})
```

- [ ] **Step 3: Adaugă scriptul în `package.json`**

În obiectul `scripts`, după linia `"lint": "eslint",`, adaugă:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: Scrie un test de verificare a instalării**

Create `lib/navigation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('setup', () => {
  it('ruleaza', () => {
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 5: Rulează**

```bash
npm test
```

Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts lib/navigation.test.ts package.json package-lock.json
git commit -m "chore: adauga Vitest pentru logica pura din lib/

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 1 — Fundație vizuală

### Task 3: Repară tokenii și adaugă paleta `dv-`

**Files:**
- Modify: `app/globals.css:12-14` (auto-referința) și `@theme` nou

- [ ] **Step 1: Repară auto-referința**

În `app/globals.css`, în blocul `@theme inline`, înlocuiește:

```css
  --font-sans: var(--font-sans);
```

cu:

```css
  --font-sans: var(--font-geist-sans);
```

Și înlocuiește:

```css
  --font-heading: var(--font-sans);
```

cu:

```css
  --font-heading: var(--font-geist-sans);
```

Motiv: `--font-sans: var(--font-sans)` e o auto-referință care nu rezolvă niciodată. `--font-geist-sans` e ce setează efectiv `app/layout.tsx`. Acești tokeni servesc adminul.

- [ ] **Step 2: Adaugă paleta de frontend**

La finalul `app/globals.css`, adaugă un bloc nou:

```css
/* ─── DiVet — tokeni de frontend ─────────────────────────────────────── */
/* Servesc exclusiv app/(frontend). Adminul foloseste tokenii shadcn de mai sus. */
@theme {
  --color-dv-bg: #FBFCFD;
  --color-dv-surface: #FFFFFF;
  --color-dv-sunken: #EDF2F3;
  --color-dv-border: #DCE4E8;
  --color-dv-ink: #10212B;
  --color-dv-ink-muted: #5B6E78;
  --color-dv-ink-subtle: #7E919B;
  --color-dv-accent: #0C5C5C;
  --color-dv-accent-hover: #073E3E;
  --color-dv-accent-soft: #E7F0EF;
  --color-dv-accent-on: #FFFFFF;

  --font-dv-display: var(--font-dv-display-src), ui-sans-serif, system-ui, sans-serif;
  --font-dv-body: var(--font-dv-body-src), ui-sans-serif, system-ui, sans-serif;

  --text-dv-display-xl: 52px;
  --text-dv-display-xl--line-height: 1.04;
  --text-dv-display-xl--letter-spacing: -0.035em;
  --text-dv-display-l: 32px;
  --text-dv-display-l--line-height: 1.1;
  --text-dv-display-l--letter-spacing: -0.03em;
  --text-dv-heading-m: 26px;
  --text-dv-heading-m--line-height: 1.15;
  --text-dv-heading-m--letter-spacing: -0.025em;
  --text-dv-title: 16px;
  --text-dv-title--line-height: 1.25;
  --text-dv-title--letter-spacing: -0.015em;
  --text-dv-body: 16px;
  --text-dv-body--line-height: 1.72;
  --text-dv-meta: 13px;
  --text-dv-label: 11px;
  --text-dv-label--line-height: 1.4;
  --text-dv-label--letter-spacing: 0.1em;

  --shadow-dv-mega: 0 10px 24px rgba(16, 33, 43, 0.07);
}
```

Scara tipografică din §4.2 a specului devine astfel `text-dv-display-xl`, `text-dv-heading-m`, `text-dv-label` și așa mai departe, cu înălțimea de rând și tracking-ul incluse. Componentele folosesc aceste clase, nu valori arbitrare.

Tailwind v4 generează din astea `bg-dv-surface`, `text-dv-ink`, `border-dv-border`, `font-dv-display`, `shadow-dv-mega`. Variabilele `--font-dv-*-src` se definesc în Task 4.

- [ ] **Step 3: Verifică build-ul CSS**

```bash
npx tsc --noEmit
```

Expected: fără erori.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: tokeni de design dv- pentru frontend, repara auto-referinta font-sans

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Fonturi prin `next/font`

**Files:**
- Modify: `app/(frontend)/layout.tsx` (azi un fragment gol)
- Modify: `components/frontend/templates/divet/DivetLayout.tsx:55-63` (elimină injectarea)

- [ ] **Step 1: Scrie layout-ul de frontend**

Înlocuiește tot conținutul `app/(frontend)/layout.tsx`:

```tsx
import { Archivo, Public_Sans } from 'next/font/google'

const display = Archivo({
  subsets: ['latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-dv-display-src',
  display: 'swap',
})

const body = Public_Sans({
  subsets: ['latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-dv-body-src',
  display: 'swap',
})

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} font-dv-body bg-dv-bg text-dv-ink`}>
      {children}
    </div>
  )
}
```

`latin-ext` e obligatoriu: subsetul `latin` nu acoperă complet ă, î, â, ș, ț.

- [ ] **Step 2: Elimină injectarea de la runtime**

În `components/frontend/templates/divet/DivetLayout.tsx`, șterge întregul `useEffect` care creează elementul `<link>` către `fonts.googleapis.com` (în jurul liniilor 55–63, blocul care începe cu `if (document.getElementById('divet-fonts')) return`).

- [ ] **Step 3: Verifică eliminarea**

```bash
grep -rn "fonts.googleapis" components/
```

Expected: fără rezultat.

- [ ] **Step 4: Pornește dev și confirmă diacriticele**

```bash
npm run dev
```

Deschide `http://localhost:3002/`, verifică în DevTools că fontul randat e Archivo/Public Sans și că „Înălțime la greabăn" afișează corect ă, î, ș, ț fără glife lipsă.

- [ ] **Step 5: Commit**

```bash
git add "app/(frontend)/layout.tsx" components/frontend/templates/divet/DivetLayout.tsx
git commit -m "feat: fonturi prin next/font cu subset latin-ext, elimina injectarea la runtime

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Curăță rămășițele de generator

**Files:**
- Modify: `app/layout.tsx:17-20, 27`

- [ ] **Step 1: Repară limba și metadatele**

În `app/layout.tsx`, înlocuiește blocul `metadata`:

```tsx
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
```

cu:

```tsx
export const metadata: Metadata = {
  title: { default: "DiVet", template: "%s | DiVet" },
  description: "Enciclopedia animalelor din România",
};
```

Și pe elementul `<html>`, schimbă `lang="en"` în `lang="ro"`.

- [ ] **Step 2: Verifică**

```bash
grep -n 'lang=\|Create Next App' app/layout.tsx
```

Expected: `lang="ro"`, fără „Create Next App".

- [ ] **Step 3: Repară placeholder-ul din baza de date**

Titlul „Ttitle Meta" vine din `SeoSettings`, nu din cod. Pe server:

```bash
ssh root@2.59.132.127 'cd /home/divet.ro/htdocs/app && U=$(grep -E "^DATABASE_URL" .env | sed "s/^DATABASE_URL=//; s/\"//g") && psql "$U" -c "select \"siteName\", \"defaultMetaTitle\", \"defaultMetaDesc\" from \"SeoSettings\";"'
```

Apoi corectează valorile din admin, la `/admin/seo`. Nu le schimba prin SQL direct — adminul validează lungimile.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "fix: lang=ro si metadate reale in locul celor din create-next-app

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 2 — Date

### Task 6: Migrare `Category` — ordine și vizibilitate în meniu

**Files:**
- Modify: `prisma/schema.prisma` (modelul `Category`, liniile 113–130)
- Create: `prisma/migrations/<timestamp>_category_nav/migration.sql` (generat)

- [ ] **Step 1: Adaugă câmpurile în schema**

În `model Category`, după linia `parentId String?`, adaugă:

```prisma
  sortOrder   Int        @default(0)
  showInNav   Boolean    @default(true)
```

Motiv: ordinea alfabetică nu e ordinea potrivită într-un meniu — „Rase" trebuie prima, nu „Alimentație". `showInNav` permite categorii de organizare care nu merită loc în bară.

- [ ] **Step 2: Generează migrarea**

```bash
npx prisma migrate dev --name category_nav
```

Expected: migrare creată și aplicată, client regenerat.

- [ ] **Step 3: Verifică în bază**

```bash
npx prisma studio
```

Deschide tabelul `Category`, confirmă coloanele `sortOrder` și `showInNav`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: Category primeste sortOrder si showInNav pentru navigatie

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Normalizează scala de rating în ghidul de conținut

**Files:**
- Modify: `AI_CONTENT_GUIDE.md` (secțiunea „Câmpuri pentru CÂINI și PISICI")

Ghidul are acum scale inconsistente: `nivel_energie` cu patru trepte, `ingrijire_blana` cu trei. Nu pot fi randate pe aceeași componentă fără ca lungimea barelor să mintă. E momentul ieftin: zero valori de câmp în bază, deci nicio migrare de date.

- [ ] **Step 1: Înlocuiește rândurile de rating din tabelul pentru câini și pisici**

Rândurile `nivel_energie` și `ingrijire_blana` devin:

```markdown
| `nivel_energie` | Scară de 5 trepte (vezi mai jos) | `Ridicat` |
| `ingrijire_blana` | Scară de 5 trepte (vezi mai jos) | `Mediu` |
| `usurinta_dresaj` | Scară de 5 trepte (vezi mai jos) | `Foarte ridicat` |
| `toleranta_singuratate` | Scară de 5 trepte (vezi mai jos) | `Scăzut` |
```

- [ ] **Step 2: Adaugă secțiunea de scară, imediat după tabel**

```markdown
### Scara de rating — valori permise

Toate câmpurile de rating folosesc exact aceste cinci valori, cu diacritice:

`Foarte scăzut` · `Scăzut` · `Mediu` · `Ridicat` · `Foarte ridicat`

Nu folosi alte formulări („mare", „redus", „moderat"). Template-ul mapează
aceste cinci valori pe bare de 20/40/60/80/100%. O valoare necunoscută face
ca bara să nu se afișeze deloc.

`bun_cu_copiii` NU e un rating — rămâne `Da` / `Nu` și se afișează ca insignă.
```

- [ ] **Step 3: Commit**

```bash
git add AI_CONTENT_GUIDE.md
git commit -m "docs: normalizeaza scala de rating la cinci trepte unice

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Seed pentru `FieldDefinition`

**Files:**
- Create: `scripts/seed-field-definitions.ts`

- [ ] **Step 1: Scrie scriptul**

Create `scripts/seed-field-definitions.ts`:

```ts
import { PrismaClient, FieldType } from '@prisma/client'

const prisma = new PrismaClient()

const RATING = ['Foarte scăzut', 'Scăzut', 'Mediu', 'Ridicat', 'Foarte ridicat']

type Def = {
  fieldKey: string
  fieldLabel: string
  fieldType: FieldType
  fieldOptions?: unknown
  sortOrder: number
  showInSchema?: boolean
  schemaProperty?: string
}

// 100-199 specificatii · 200-299 profil comportamental · 300-399 conservare
const DEFS: Def[] = [
  { fieldKey: 'tldr', fieldLabel: 'Pe scurt', fieldType: 'TEXTAREA', sortOrder: 10 },

  { fieldKey: 'origine', fieldLabel: 'Origine', fieldType: 'TEXT', sortOrder: 100 },
  { fieldKey: 'talie', fieldLabel: 'Talie', fieldType: 'SELECT', fieldOptions: ['Mic', 'Mediu', 'Mare', 'Variabil'], sortOrder: 110 },
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

  { fieldKey: 'nivel_energie', fieldLabel: 'Nivel de energie', fieldType: 'SELECT', fieldOptions: RATING, sortOrder: 200 },
  { fieldKey: 'ingrijire_blana', fieldLabel: 'Îngrijirea blănii', fieldType: 'SELECT', fieldOptions: RATING, sortOrder: 210 },
  { fieldKey: 'usurinta_dresaj', fieldLabel: 'Ușurința la dresaj', fieldType: 'SELECT', fieldOptions: RATING, sortOrder: 220 },
  { fieldKey: 'toleranta_singuratate', fieldLabel: 'Tolerează singurătatea', fieldType: 'SELECT', fieldOptions: RATING, sortOrder: 230 },
  { fieldKey: 'bun_cu_copiii', fieldLabel: 'Bun cu copiii', fieldType: 'SELECT', fieldOptions: ['Da', 'Nu'], sortOrder: 240 },

  { fieldKey: 'statut_conservare', fieldLabel: 'Statut de conservare', fieldType: 'SELECT', fieldOptions: ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'], sortOrder: 300 },

  { fieldKey: 'faq', fieldLabel: 'Întrebări frecvente (JSON)', fieldType: 'TEXTAREA', sortOrder: 400 },
]

async function main() {
  const site = await prisma.site.findFirst({ where: { domain: 'divet.ro' } })
  if (!site) throw new Error('Site-ul divet.ro nu exista in baza')

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
      fieldOptions: (d.fieldOptions ?? undefined) as never,
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
```

Scriptul e idempotent: rulat de două ori, a doua oară actualizează în loc să dubleze.

- [ ] **Step 2: Rulează**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-field-definitions.ts
```

Expected: 22 de linii `creat: ...`.

- [ ] **Step 3: Rulează din nou ca să confirmi idempotența**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-field-definitions.ts
```

Expected: 22 de linii `actualizat: ...`, niciun duplicat.

- [ ] **Step 4: Confirmă în admin**

Deschide `/admin/settings/custom-fields`, verifică cele 22 de câmpuri și ordinea lor.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-field-definitions.ts
git commit -m "feat: seed idempotent pentru campurile din AI_CONTENT_GUIDE

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8b: Seed pentru categoriile de navigație

**Files:**
- Create: `scripts/seed-categories.ts`

Fără acest task, bara de navigație se randează goală: baza are o singură categorie, `caini`. Cele șapte grupuri din §5.1 al specului trebuie să existe ca rânduri în `Category` înainte ca Task 9–11 să aibă ce afișa.

- [ ] **Step 1: Scrie scriptul**

Create `scripts/seed-categories.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Group = { name: string; slug: string; sortOrder: number; children: string[][] }

// children: [nume, slug]
const GROUPS: Group[] = [
  { name: 'Câini', slug: 'caini', sortOrder: 10, children: [
    ['Rase de câini', 'rase'], ['Îngrijire', 'ingrijire'], ['Sănătate', 'sanatate'],
    ['Dresaj', 'dresaj'], ['Alimentație', 'alimentatie'],
  ]},
  { name: 'Pisici', slug: 'pisici', sortOrder: 20, children: [
    ['Rase de pisici', 'rase'], ['Îngrijire', 'ingrijire'], ['Sănătate', 'sanatate'],
    ['Comportament', 'comportament'],
  ]},
  { name: 'Animale mici', slug: 'animale-mici', sortOrder: 30, children: [
    ['Rozătoare', 'rozatoare'], ['Iepuri', 'iepuri'], ['Dihori', 'dihori'], ['Arici', 'arici'],
  ]},
  { name: 'Păsări', slug: 'pasari', sortOrder: 40, children: [
    ['Papagali', 'papagali'], ['Canari', 'canari'],
    ['Păsări de curte', 'pasari-de-curte'], ['Păsări sălbatice', 'pasari-salbatice'],
  ]},
  { name: 'Acvariu & terariu', slug: 'acvariu-terariu', sortOrder: 50, children: [
    ['Pești de apă dulce', 'pesti-apa-dulce'], ['Pești marini', 'pesti-marini'],
    ['Reptile', 'reptile'], ['Amfibieni', 'amfibieni'], ['Nevertebrate', 'nevertebrate'],
  ]},
  { name: 'Sălbatice', slug: 'salbatice', sortOrder: 60, children: [
    ['Mamifere', 'mamifere'], ['Răpitoare', 'rapitoare'],
    ['Specii protejate', 'specii-protejate'], ['Fauna României', 'fauna-romaniei'],
  ]},
  { name: 'Sănătate', slug: 'sanatate', sortOrder: 70, children: [
    ['Boli', 'boli'], ['Vaccinare', 'vaccinare'],
    ['Parazitologie', 'parazitologie'], ['Urgențe', 'urgente'],
  ]},
]

async function upsert(
  siteId: string, name: string, slug: string, sortOrder: number, parentId: string | null,
) {
  const existing = await prisma.category.findFirst({ where: { siteId, slug, parentId } })
  if (existing) {
    const updated = await prisma.category.update({
      where: { id: existing.id },
      data: { name, sortOrder, showInNav: true },
    })
    console.log(`actualizat: ${slug}`)
    return updated.id
  }
  const created = await prisma.category.create({
    data: { siteId, name, slug, sortOrder, parentId, showInNav: true },
  })
  console.log(`creat: ${slug}`)
  return created.id
}

async function main() {
  const site = await prisma.site.findFirst({ where: { domain: 'divet.ro' } })
  if (!site) throw new Error('Site-ul divet.ro nu exista in baza')

  for (const g of GROUPS) {
    const parentId = await upsert(site.id, g.name, g.slug, g.sortOrder, null)
    let order = 10
    for (const [childName, childSlug] of g.children) {
      await upsert(site.id, childName, childSlug, order, parentId)
      order += 10
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

> **Blocant cunoscut.** `Category` are azi `@@unique([siteId, slug])` — slug-urile trebuie unice **pe tot site-ul**, nu sub același părinte. Datele de mai sus folosesc `ingrijire` și sub Câini și sub Pisici, `sanatate` și ca grup și ca subcategorie sub Câini. Scriptul **va eșua** cu violare de constrângere unică dacă nu se face întâi Step 2.
>
> Ocolirea prin prefixare (`caini-ingrijire`) produce URL-uri de forma `/caini/caini-ingrijire`. E urât și rămâne așa pentru totdeauna, pentru că URL-urile se indexează. Constrângerea corectă e pe triplet.

- [ ] **Step 2: Schimbă constrângerea pe `(siteId, parentId, slug)`**

În `prisma/schema.prisma`, în `model Category`, înlocuiește:

```prisma
  @@unique([siteId, slug])
```

cu:

```prisma
  @@unique([siteId, parentId, slug])
```

Apoi generează migrarea:

```bash
npx prisma migrate dev --name category_slug_unique_per_parent
```

Expected: migrare aplicată fără conflicte — baza are acum o singură categorie, deci nu există rânduri care să încalce noua constrângere.

> **De verificat după migrare:** orice cod care caută o categorie doar după `{ siteId, slug }` presupunea unicitate globală. Caută-l și adaugă `parentId` unde e nevoie:
> ```bash
> grep -rn "category.findUnique\|siteId_slug" app/ lib/ --include=*.ts --include=*.tsx
> ```
> Rutele de frontend caută deja cu `parentId: null` pentru grupuri (vezi `app/(frontend)/[slug]/page.tsx:26`), deci sunt corecte. Verifică API-urile din `app/api/categories/`.

- [ ] **Step 3: Rulează**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-categories.ts
```

Expected: 7 grupuri + 30 de subcategorii create (`caini` apare ca `actualizat`, fiind deja în bază).

- [ ] **Step 4: Rulează din nou pentru idempotență**

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-categories.ts
```

Expected: toate liniile `actualizat:`, niciun duplicat.

- [ ] **Step 5: Confirmă ierarhia**

```bash
npx prisma studio
```

În `Category`, confirmă 7 rânduri cu `parentId` null și 30 cu părinte setat.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-categories.ts prisma/
git commit -m "feat: seed pentru cele sapte grupuri de navigatie si subcategoriile lor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 3 — Navigație

### Task 9: `lib/navigation.ts` — arborele, cu teste

**Files:**
- Create: `lib/navigation.ts`
- Modify: `lib/navigation.test.ts` (înlocuiește testul de setup)

- [ ] **Step 1: Scrie testele**

Înlocuiește tot conținutul `lib/navigation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildNavTree, type CategoryRow } from './navigation'

const row = (p: Partial<CategoryRow>): CategoryRow => ({
  id: 'x', name: 'X', slug: 'x', parentId: null, sortOrder: 0, showInNav: true, ...p,
})

describe('buildNavTree', () => {
  it('returneaza grupuri radacina sortate dupa sortOrder', () => {
    const tree = buildNavTree([
      row({ id: 'b', name: 'Pisici', slug: 'pisici', sortOrder: 20 }),
      row({ id: 'a', name: 'Câini', slug: 'caini', sortOrder: 10 }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini', 'pisici'])
  })

  it('sorteaza alfabetic la sortOrder egal', () => {
    const tree = buildNavTree([
      row({ id: 'b', name: 'Pisici', slug: 'pisici', sortOrder: 0 }),
      row({ id: 'a', name: 'Câini', slug: 'caini', sortOrder: 0 }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini', 'pisici'])
  })

  it('cuibareste copiii sub parinte si construieste href-ul complet', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini' }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a', sortOrder: 10 }),
    ])
    expect(tree[0].href).toBe('/caini')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].href).toBe('/caini/rase')
  })

  it('exclude grupurile cu showInNav fals', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini' }),
      row({ id: 'b', name: 'Ascuns', slug: 'ascuns', showInNav: false }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini'])
  })

  it('exclude copiii cu showInNav fals', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini' }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a' }),
      row({ id: 'a2', name: 'Ascuns', slug: 'ascuns', parentId: 'a', showInNav: false }),
    ])
    expect(tree[0].children.map((c) => c.slug)).toEqual(['rase'])
  })

  it('ignora copiii al caror parinte lipseste sau e ascuns', () => {
    const tree = buildNavTree([
      row({ id: 'a1', name: 'Orfan', slug: 'orfan', parentId: 'inexistent' }),
      row({ id: 'b', name: 'Ascuns', slug: 'ascuns', showInNav: false }),
      row({ id: 'b1', name: 'Copil', slug: 'copil', parentId: 'b' }),
    ])
    expect(tree).toEqual([])
  })

  it('returneaza lista goala pentru intrare goala', () => {
    expect(buildNavTree([])).toEqual([])
  })
})
```

- [ ] **Step 2: Rulează testele ca să confirmi că pică**

```bash
npm test
```

Expected: FAIL — `Cannot find module './navigation'`.

- [ ] **Step 3: Scrie implementarea**

Create `lib/navigation.ts`:

```ts
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export type CategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  showInNav: boolean
}

export type NavChild = { id: string; name: string; slug: string; href: string }
export type NavGroup = NavChild & { children: NavChild[] }

function byOrderThenName(a: CategoryRow, b: CategoryRow): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.name.localeCompare(b.name, 'ro')
}

export function buildNavTree(rows: CategoryRow[]): NavGroup[] {
  const visible = rows.filter((r) => r.showInNav)
  const roots = visible.filter((r) => r.parentId === null).sort(byOrderThenName)

  return roots.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug,
    href: `/${root.slug}`,
    children: visible
      .filter((r) => r.parentId === root.id)
      .sort(byOrderThenName)
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        href: `/${root.slug}/${child.slug}`,
      })),
  }))
}

export const getNavigation = (siteId: string) =>
  unstable_cache(
    async () => {
      const rows = await prisma.category.findMany({
        where: { siteId },
        select: { id: true, name: true, slug: true, parentId: true, sortOrder: true, showInNav: true },
      })
      return buildNavTree(rows)
    },
    ['divet-nav', siteId],
    { revalidate: 1800, tags: ['navigation'] },
  )()
```

- [ ] **Step 4: Rulează testele**

```bash
npm test
```

Expected: PASS, 7 teste.

- [ ] **Step 5: Commit**

```bash
git add lib/navigation.ts lib/navigation.test.ts
git commit -m "feat: arbore de navigatie construit din categorii, cu cache

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Invalidarea cache-ului la salvarea unei categorii

**Files:**
- Modify: `app/api/categories/route.ts` și `app/api/categories/[id]/route.ts`

- [ ] **Step 1: Găsește handlerele de scriere**

```bash
grep -n "export async function \(POST\|PUT\|PATCH\|DELETE\)" app/api/categories/route.ts "app/api/categories/[id]/route.ts"
```

- [ ] **Step 2: Adaugă invalidarea**

În fiecare handler găsit, după scrierea reușită în bază și înainte de `return`, adaugă:

```ts
revalidateTag('navigation')
```

Cu importul la începutul fișierului:

```ts
import { revalidateTag } from 'next/cache'
```

- [ ] **Step 3: Verifică manual**

Pornește `npm run dev`, adaugă o categorie din `/admin/categories`, confirmă că apare în bara de navigație fără restart.

- [ ] **Step 4: Commit**

```bash
git add app/api/categories
git commit -m "feat: invalideaza cache-ul de navigatie la modificarea categoriilor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Componentele de navigație

**Files:**
- Create: `components/frontend/templates/divet/DivetHeader.tsx`
- Create: `components/frontend/templates/divet/DivetNav.tsx`
- Create: `components/frontend/templates/divet/DivetMegaPanel.tsx`
- Modify: `components/frontend/templates/divet/DivetLayout.tsx` (rescriere)

**Specificația vizuală: artboard-ul `Navigatie` din canvas.**

Contracte:

```tsx
// DivetHeader.tsx — server component
type DivetHeaderProps = { siteName: string }
// Logo (font-dv-display, text-dv-accent) · camp de cautare (form GET catre /cautare,
// name="q", max-w-[520px]) · legatura "Index A–Z" catre /index-a-z.
// Inaltime 62px, bg-dv-surface, border-b border-dv-border.

// DivetNav.tsx — client component ('use client', are stare de hover)
type DivetNavProps = { groups: NavGroup[]; activeSlug?: string | null }
// Bara de 50px cu un <a> per grup. Grupul activ: text-dv-accent + border-b-2.
// Grupurile cu children au chevron si deschid DivetMegaPanel la hover si la focus.
// Inchidere la Escape si la blur in afara. Nu monta handler global de keydown.

// DivetMegaPanel.tsx — server component, primit ca children de DivetNav
type DivetMegaPanelProps = {
  group: NavGroup
  recentPosts: Array<{ title: string; href: string }>
}
// Grid 4 coloane de 1fr + o coloana de 230px.
// Coloana 1: recentPosts (max 6) + legatura catre group.href.
// Coloanele 2-4: group.children impartiti in trei bucati egale.
// Coloana 5: card bg-dv-accent-soft catre /comparatie.
// shadow-dv-mega, bg-dv-surface.
```

- [ ] **Step 1: Scrie cele trei componente conform contractelor de mai sus**

Reguli obligatorii: zero valori hex — doar utilitare `dv-`; fiecare element interactiv e `<a>` sau `<button>` real, niciodată `<div onClick>`; SVG-urile decorative primesc `aria-hidden="true"`; input-ul de căutare are `<label>` asociat, ascuns vizual.

- [ ] **Step 2: Rescrie `DivetLayout.tsx` să le compună**

`DivetLayout` primește `groups: NavGroup[]` ca prop, randează `DivetHeader` + `DivetNav` + `{children}` + footer. Elimină navigația hardcodată existentă și constantele hex de la liniile 8–16.

- [ ] **Step 3: Verifică absența hexurilor**

```bash
grep -rn "#[0-9a-fA-F]\{6\}" components/frontend/templates/divet/
```

Expected: fără rezultat.

- [ ] **Step 4: Verifică tipurile**

```bash
npx tsc --noEmit
```

Expected: fără erori.

- [ ] **Step 5: Commit**

```bash
git add components/frontend/templates/divet/
git commit -m "feat: header, bara de navigatie si mega-meniu pe tokeni dv-

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 4 — Componentele fișei

### Task 12: `lib/fields.ts` — scala de rating, cu teste

**Files:**
- Create: `lib/fields.ts`
- Create: `lib/fields.test.ts`

- [ ] **Step 1: Scrie testele**

Create `lib/fields.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ratingToPercent, RATING_SCALE } from './fields'

describe('ratingToPercent', () => {
  it('mapeaza cele cinci trepte pe 20..100', () => {
    expect(ratingToPercent('Foarte scăzut')).toBe(20)
    expect(ratingToPercent('Scăzut')).toBe(40)
    expect(ratingToPercent('Mediu')).toBe(60)
    expect(ratingToPercent('Ridicat')).toBe(80)
    expect(ratingToPercent('Foarte ridicat')).toBe(100)
  })

  it('tolereaza spatii si majuscule', () => {
    expect(ratingToPercent('  mediu  ')).toBe(60)
    expect(ratingToPercent('RIDICAT')).toBe(80)
  })

  it('tolereaza lipsa diacriticelor', () => {
    expect(ratingToPercent('Scazut')).toBe(40)
    expect(ratingToPercent('Foarte scazut')).toBe(20)
  })

  it('returneaza null pentru valori necunoscute', () => {
    expect(ratingToPercent('mare')).toBeNull()
    expect(ratingToPercent('')).toBeNull()
  })

  it('expune scala in ordine', () => {
    expect(RATING_SCALE).toHaveLength(5)
    expect(RATING_SCALE[0]).toBe('Foarte scăzut')
  })
})
```

- [ ] **Step 2: Rulează ca să confirmi că pică**

```bash
npm test
```

Expected: FAIL — `Cannot find module './fields'`.

- [ ] **Step 3: Scrie implementarea**

Create `lib/fields.ts`:

```ts
export const RATING_SCALE = [
  'Foarte scăzut',
  'Scăzut',
  'Mediu',
  'Ridicat',
  'Foarte ridicat',
] as const

export type Rating = (typeof RATING_SCALE)[number]

/** Normalizeaza pentru comparare: fara diacritice, fara spatii in plus, minuscule. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

const LOOKUP = new Map(RATING_SCALE.map((label, i) => [normalize(label), (i + 1) * 20]))

/**
 * Converteste o valoare de rating in procentul de umplere a barei.
 * Continutul e generat de AI si poate pierde diacriticele, deci comparam normalizat.
 * Returneaza null pentru orice valoare care nu e pe scala — bara nu se afiseaza.
 */
export function ratingToPercent(value: string): number | null {
  return LOOKUP.get(normalize(value)) ?? null
}
```

- [ ] **Step 4: Rulează testele**

```bash
npm test
```

Expected: PASS, 12 teste în total (7 navigație + 5 fields).

- [ ] **Step 5: Commit**

```bash
git add lib/fields.ts lib/fields.test.ts
git commit -m "feat: scala de rating cu normalizare pentru diacritice lipsa

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Componentele de date ale fișei

**Files:**
- Create: `components/frontend/templates/divet/SpecGrid.tsx`
- Create: `components/frontend/templates/divet/BehaviorProfile.tsx`
- Create: `components/frontend/templates/divet/TldrCard.tsx`

**Specificația vizuală: artboard-ul `Cabinet2`, zonele „Caracteristicile rasei", „Profil comportamental" și „Pe scurt".**

```tsx
type FieldItem = { key: string; label: string; value: string }

// SpecGrid.tsx — server component
type SpecGridProps = { items: FieldItem[] }
// Grid de 3 coloane, gap 12px. Fiecare placa: bg-dv-surface, border border-dv-border,
// rounded-lg, p-[14px_17px]. Eticheta: 11px, uppercase, tracking-[0.1em],
// text-dv-ink-muted. Valoarea: font-dv-display, 20px, weight 600.
// Randeaza NIMIC (returneaza null) daca items e gol.

// BehaviorProfile.tsx — server component
type BehaviorProfileProps = { items: FieldItem[] }
// Foloseste ratingToPercent din @/lib/fields. Un item a carui valoare
// da null e SARIT, nu afisat cu bara goala.
// Fiecare rand: eticheta stanga + valoarea text dreapta (text-dv-accent, weight 600),
// sub ele o bara de 6px: pista bg-[#E7ECEE] via token dv-sunken, umplere bg-dv-accent,
// latime = procentul. Bara afiseaza INTOTDEAUNA si eticheta textuala — o bara
// fara text nu e accesibila.
// Returneaza null daca niciun item nu are rating valid.

// TldrCard.tsx — server component
type TldrCardProps = { text: string }
// bg-dv-surface, border, rounded-[10px], p-[20px_22px].
// Eticheta "PE SCURT" (11px, uppercase, text-dv-accent), apoi textul la 16px/1.65.
// Returneaza null daca text e gol dupa trim.
```

- [ ] **Step 1: Scrie cele trei componente**

- [ ] **Step 2: Verifică tipurile și absența hexurilor**

```bash
npx tsc --noEmit && grep -rn "#[0-9a-fA-F]\{6\}" components/frontend/templates/divet/
```

Expected: fără erori de tip, fără hexuri.

- [ ] **Step 3: Commit**

```bash
git add components/frontend/templates/divet/
git commit -m "feat: SpecGrid, BehaviorProfile si TldrCard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: Componentele de listă și stările goale

**Files:**
- Create: `components/frontend/templates/divet/ArticleCard.tsx`
- Create: `components/frontend/templates/divet/RelatedArticles.tsx`
- Create: `components/frontend/templates/divet/Breadcrumbs.tsx`
- Create: `components/frontend/templates/divet/EmptyState.tsx`

**Specificația vizuală: artboard-ul `Cabinet2`, zona „Mai multe din Câini".**

```tsx
// ArticleCard.tsx
type ArticleCardProps = {
  href: string
  title: string
  kicker?: string | null          // categoria, uppercase, text-dv-accent
  meta?: string | null            // "Mare · 25–36 kg · 10–12 ani"
  image?: { url: string; alt: string } | null
}
// Card bg-dv-surface, border, rounded-[9px], overflow-hidden.
// Imaginea prin next/image, h-[108px], object-cover.
// Fara imagine: bloc bg-dv-sunken de aceeasi inaltime — niciodata un gol.

// RelatedArticles.tsx
type RelatedArticlesProps = { categoryName: string; categoryHref: string; posts: ArticleCardProps[] }
// Titlu "Mai multe din {categoryName}" + legatura "Vezi toata categoria".
// Grid de 3 coloane.
// REGULA DE STARE GOALA: daca posts.length < 3, returneaza null. Mai bine
// nicio sectiune decat o sectiune cu un card singur intr-un rand de trei.

// Breadcrumbs.tsx
type Crumb = { name: string; href: string }
type BreadcrumbsProps = { items: Crumb[] }   // ultimul element e pagina curenta
// <nav aria-label="Firimituri">, separator "/" in text-dv-ink-subtle,
// ultimul element fara legatura, in text-dv-ink.

// EmptyState.tsx
type EmptyStateProps = { title: string; description: string; action?: { label: string; href: string } }
// Bloc centrat, bg-dv-sunken, rounded-[10px], py-14.
// Se foloseste pe categorii fara articole si pe cautare fara rezultate.
```

- [ ] **Step 1: Scrie cele patru componente**

- [ ] **Step 2: Verifică**

```bash
npx tsc --noEmit && grep -rn "#[0-9a-fA-F]\{6\}" components/frontend/templates/divet/
```

- [ ] **Step 3: Commit**

```bash
git add components/frontend/templates/divet/
git commit -m "feat: ArticleCard, RelatedArticles, Breadcrumbs si EmptyState

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 5 — Paginile

### Task 15: `ArticleTemplate` — fișa de animal

**Files:**
- Modify: `components/frontend/templates/divet/ArticleTemplate.tsx` (rescriere, azi 662 de linii)

**Specificația vizuală: artboard-ul `Cabinet2`, integral.**

Ordinea pe pagină: `Breadcrumbs` → insigne (categorie, talie, bun cu copiii) → `h1` → `TldrCard` + imaginea featured → `SpecGrid` → `BehaviorProfile` + corpul articolului → `FaqSection` → `RelatedArticles`.

Împărțirea câmpurilor între `SpecGrid` și `BehaviorProfile` se face după `sortOrder`: 100–199 merg în `SpecGrid`, 200–299 în `BehaviorProfile`, `tldr` în `TldrCard`, `faq` în `FaqSection`.

- [ ] **Step 1: Rescrie componenta**

Păstrează semnătura de props existentă, ca `TemplateDispatcher` să nu se schimbe. Verifică-o înainte:

```bash
grep -n "^export default function\|^type.*Props" components/frontend/templates/divet/ArticleTemplate.tsx
```

- [ ] **Step 2: Verifică randarea cu zero câmpuri**

Deschide una dintre cele trei fișe existente (care nu au niciun `FieldValue`). Pagina trebuie să se randeze corect, fără secțiuni goale: `SpecGrid`, `BehaviorProfile`, `TldrCard` și `RelatedArticles` returnează toate `null`.

- [ ] **Step 3: Verifică randarea cu câmpuri complete**

Completează din admin toate câmpurile pe un articol de test și confirmă că barele au lungimi corecte și etichete.

- [ ] **Step 4: Commit**

```bash
git add components/frontend/templates/divet/ArticleTemplate.tsx
git commit -m "feat: rescrie fisa de animal pe noul sistem de design

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 16: `CategoryTemplate`, `HomepageTemplate`, `SearchTemplate`

**Files:**
- Modify: `components/frontend/templates/divet/CategoryTemplate.tsx`
- Modify: `components/frontend/templates/divet/HomepageTemplate.tsx`
- Modify: `components/frontend/templates/divet/SearchTemplate.tsx`

- [ ] **Step 1: Rescrie `CategoryTemplate`**

Breadcrumbs → titlu + descriere → grid de `ArticleCard` pe 3 coloane → paginare. Zero articole: `EmptyState` cu titlul „Încă nu avem articole aici" și acțiune către `/index-a-z`.

- [ ] **Step 2: Rescrie `HomepageTemplate`**

Trebuie să funcționeze cu **o singură categorie populată** — starea reală la lansare. Structură: hero cu căutare, apoi câte o secțiune per grup care are cel puțin un articol. Grupurile goale se omit complet, nu se afișează cu zero.

- [ ] **Step 3: Rescrie `SearchTemplate`**

Listă de `ArticleCard`, `EmptyState` la zero rezultate cu textul interogării în descriere.

- [ ] **Step 4: Verifică toate trei la volum mic**

```bash
npm run dev
```

Deschide `/`, `/caini`, `/cautare?q=labrador` și `/cautare?q=zzz`. Niciuna nu trebuie să arate zone rupte cu trei articole în bază.

- [ ] **Step 5: Commit**

```bash
git add components/frontend/templates/divet/
git commit -m "feat: rescrie homepage, categorie si cautare, cu stari goale corecte

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 17: `AuthorTemplate`, `TagTemplate` și pagina de comparație

**Files:**
- Modify: `components/frontend/templates/divet/AuthorTemplate.tsx`
- Modify: `components/frontend/templates/divet/TagTemplate.tsx`
- Modify: `app/(frontend)/comparatie/page.tsx` și `app/(frontend)/comparatie/[slug]/page.tsx`

- [ ] **Step 1: Restilizează autor și etichetă**

Aceleași componente: `Breadcrumbs`, `ArticleCard`, `EmptyState`. Fără structură nouă.

- [ ] **Step 2: Restilizează comparația**

Tabel cu două coloane de animale, rândurile fiind câmpurile cu `sortOrder` 100–299. Rândurile de rating folosesc `BehaviorProfile` în variantă compactă. Un câmp care lipsește la ambele animale nu produce rând.

- [ ] **Step 3: Verifică**

```bash
npx tsc --noEmit && grep -rn "#[0-9a-fA-F]\{6\}" components/frontend/templates/divet/
```

- [ ] **Step 4: Commit**

```bash
git add components/frontend/templates/divet/ "app/(frontend)/comparatie"
git commit -m "feat: restilizeaza autor, eticheta si comparatie

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 18: Pagina `/index-a-z`

**Files:**
- Create: `app/(frontend)/index-a-z/page.tsx`

Singura rută nouă. E punctul de intrare pentru crawl și pentru utilizatorii care știu ce caută dar nu știu în ce grup e.

- [ ] **Step 1: Scrie pagina**

Server component. Încarcă toate articolele publicate ale site-ului (`title`, `slug`, categoria și părintele ei pentru href), grupează după prima literă a titlului normalizat fără diacritice, randează o ancoră per literă sus și câte o secțiune per literă.

Folosește `normalize` cu aceeași logică din `lib/fields.ts` — „Șoim" trebuie să apară sub S, nu sub Ș într-o secțiune separată.

- [ ] **Step 2: Verifică**

Deschide `http://localhost:3002/index-a-z`. Cele trei articole existente apar sub literele corecte; literele fără articole nu produc secțiuni goale.

- [ ] **Step 3: Commit**

```bash
git add "app/(frontend)/index-a-z"
git commit -m "feat: index alfabetic al tuturor articolelor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 6 — SEO

### Task 19: Schema `FAQPage` și `BreadcrumbList`

**Files:**
- Modify: `lib/seo/schema-generator.ts`
- Create: `lib/seo/schema-generator.test.ts`
- Create: `components/frontend/templates/divet/FaqSection.tsx`

- [ ] **Step 1: Scrie testele**

Create `lib/seo/schema-generator.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateFaqSchema, parseFaq } from './schema-generator'

describe('parseFaq', () => {
  it('parseaza JSON valid', () => {
    const out = parseFaq('[{"q":"Cât trăiește?","a":"10–12 ani."}]')
    expect(out).toEqual([{ q: 'Cât trăiește?', a: '10–12 ani.' }])
  })

  it('returneaza lista goala pentru JSON invalid', () => {
    expect(parseFaq('{nu e json')).toEqual([])
  })

  it('returneaza lista goala pentru string gol', () => {
    expect(parseFaq('')).toEqual([])
  })

  it('ignora intrarile fara q sau a', () => {
    expect(parseFaq('[{"q":"X"},{"q":"Y","a":"Z"}]')).toEqual([{ q: 'Y', a: 'Z' }])
  })
})

describe('generateFaqSchema', () => {
  it('produce FAQPage valid', () => {
    const schema = generateFaqSchema([{ q: 'Cât trăiește?', a: '10–12 ani.' }])
    expect(schema).toEqual({
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Cât trăiește?',
          acceptedAnswer: { '@type': 'Answer', text: '10–12 ani.' },
        },
      ],
    })
  })

  it('returneaza null pentru lista goala', () => {
    expect(generateFaqSchema([])).toBeNull()
  })
})
```

- [ ] **Step 2: Rulează ca să confirmi că pică**

```bash
npm test
```

Expected: FAIL — `generateFaqSchema is not a function`.

- [ ] **Step 3: Adaugă funcțiile în `lib/seo/schema-generator.ts`**

```ts
export type FaqItem = { q: string; a: string }

export function parseFaq(raw: string): FaqItem[] {
  if (!raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is FaqItem =>
        typeof x?.q === 'string' && x.q.length > 0 &&
        typeof x?.a === 'string' && x.a.length > 0,
    )
  } catch {
    return []
  }
}

export function generateFaqSchema(items: FaqItem[]) {
  if (items.length === 0) return null
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}
```

- [ ] **Step 4: Rulează testele**

```bash
npm test
```

Expected: PASS, 18 teste în total.

- [ ] **Step 5: Scrie `FaqSection.tsx`**

```tsx
type FaqSectionProps = { items: FaqItem[] }
// Returneaza null daca items e gol.
// Fiecare intrare: <details> nativ cu <summary> — deschidere fara JavaScript.
// Titlu de sectiune "Întrebări frecvente", h2.
```

- [ ] **Step 6: Leagă schema în fișă**

În `ArticleTemplate`, emite `BreadcrumbList` și, unde `parseFaq` dă rezultate, `FAQPage`, în același `@graph` cu `Article`.

- [ ] **Step 7: Commit**

```bash
git add lib/seo/ components/frontend/templates/divet/FaqSection.tsx components/frontend/templates/divet/ArticleTemplate.tsx
git commit -m "feat: schema FAQPage si BreadcrumbList pe fisa de animal

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 20: Sitemap

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Adaugă ruta nouă**

Include `/index-a-z` în lista de URL-uri statice, cu `changeFrequency: 'daily'`.

- [ ] **Step 2: Verifică**

```bash
curl -s http://localhost:3002/sitemap.xml | grep index-a-z
```

Expected: o linie cu URL-ul.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: include index-a-z in sitemap

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Faza 7 — Lansare

### Task 21: Verifică toate criteriile de acceptanță

**Files:** niciunul — doar verificare.

Criteriile vin din §12 al specului.

- [ ] **Step 1: Verificările mecanice**

```bash
grep -rn "#[0-9a-fA-F]\{6\}" components/frontend/templates/divet/ ; echo "--- asteptat: gol ---"
grep -rn "fonts.googleapis" components/ ; echo "--- asteptat: gol ---"
grep -n -- "--font-sans: var(--font-sans)" app/globals.css ; echo "--- asteptat: gol ---"
grep -n 'lang="ro"' app/layout.tsx ; echo "--- asteptat: o linie ---"
grep -n "Create Next App" app/layout.tsx ; echo "--- asteptat: gol ---"
```

Și garda pe namespace-ul rezervat directorului (§9 din spec) — nicio categorie nu trebuie să ocupe `veterinari` sau `dresori`:

```bash
npx prisma studio
# in tabelul Category, confirma ca niciun slug nu e 'veterinari' sau 'dresori'
```

- [ ] **Step 2: Testele și tipurile**

```bash
npm test && npx tsc --noEmit && npm run lint
```

Expected: toate trec.

- [ ] **Step 3: Build de producție**

```bash
npm run build
```

Expected: build reușit.

- [ ] **Step 4: Verificările manuale**

- O categorie nouă adăugată din admin apare în navigație fără deploy.
- O fișă fără niciun câmp completat se randează fără secțiuni goale.
- Barele de profil afișează eticheta textuală, nu doar lungimea.
- O categorie cu un singur articol și un grup fără articole nu produc zone rupte.
- `<title>` pe homepage nu mai e „Ttitle Meta".
- Rich Results Test validează `Article`, `BreadcrumbList` și `FAQPage` pe o fișă completă.

- [ ] **Step 5: Commit dacă au fost necesare corecții**

---

### Task 22: Treci site-ul pe noul template

**Files:** niciunul — modificare în baza de date de producție.

Ultimul pas, după ce toate criteriile trec. Până acum, producția a rulat neschimbată pe `fauna`.

- [ ] **Step 1: Actualizează descrierea din registry**

În `lib/templates/registry.ts`, intrarea `divet` are încă descrierea veche („verde pădure + crem + auriu, Playfair Display"). Înlocuiește cu:

```ts
    description: 'Enciclopedie animală — sistem de design propriu, navigație generată din categorii, fișe cu date structurate.',
```

- [ ] **Step 2: Commit și deploy**

```bash
git add lib/templates/registry.ts
git commit -m "chore: actualizeaza descrierea template-ului divet

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Apoi rulează scriptul de deploy existent din rădăcina proiectului de pe server (`deploy-pm2.sh`).

- [ ] **Step 3: Rulează seed-ul de câmpuri în producție**

```bash
ssh root@2.59.132.127 'cd /home/divet.ro/htdocs/app && npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/seed-field-definitions.ts'
```

- [ ] **Step 4: Schimbă template-ul din admin**

Din `/admin/sites`, pe site-ul Divet, schimbă template-ul din `Fauna` în `DiVet`. Nu prin SQL — adminul invalidează și cache-urile.

- [ ] **Step 5: Confirmă în producție**

```bash
curl -s -o /dev/null -w "divet.ro -> HTTP %{http_code} in %{time_total}s\n" https://divet.ro/
curl -s https://divet.ro/ | grep -oiP "<title>.*?</title>"
```

Expected: HTTP 200, titlu real, nu „Ttitle Meta".

- [ ] **Step 6: Plasa de siguranță**

Dacă ceva e rupt în producție, întoarcerea e schimbarea template-ului înapoi pe `Fauna` din admin. `fauna` rămâne intact în registry și în cod exact pentru asta.

---

## Rezumat

| Fază | Task-uri | Rezultat |
|---|---|---|
| 0 — Fundație | 1–2 | branch, snapshot, Vitest |
| 1 — Fundație vizuală | 3–5 | tokeni, fonturi, curățenie |
| 2 — Date | 6–8b | migrări, scară normalizată, seed câmpuri și categorii |
| 3 — Navigație | 9–11 | arbore testat, mega-meniu |
| 4 — Componente | 12–14 | scară testată, componente de fișă |
| 5 — Pagini | 15–18 | toate șablonele, index A–Z |
| 6 — SEO | 19–20 | FAQPage, breadcrumbs, sitemap |
| 7 — Lansare | 21–22 | verificare, switch, plasă de siguranță |

**Dependențe adăugate:** `vitest` (dev).
**Migrări:** două, ambele pe `Category` — `sortOrder` + `showInNav` (Task 6), unicitatea slug-ului pe părinte (Task 8b).
**Rute noi:** una, `/index-a-z`.
**Fișiere de cod noi:** 15.
**Fișiere de test:** 3 — `lib/navigation.test.ts`, `lib/fields.test.ts`, `lib/seo/schema-generator.test.ts`, 18 teste în total.
