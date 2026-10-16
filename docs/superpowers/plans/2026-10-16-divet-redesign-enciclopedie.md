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

/* Fonturile merg in `@theme inline`, NU in `@theme` simplu.
   --font-dv-*-src sunt setate de next/font pe un <div> wrapper (Task 4), nu pe :root.
   Intr-un @theme simplu, Tailwind emite variabila pe :root, unde var(--font-dv-*-src)
   nu exista -> valoare invalida, iar fontul nu se aplica deloc, fara nicio eroare.
   `inline` face ca var() sa se rezolve la locul de utilizare. */
@theme inline {
  --font-dv-display: var(--font-dv-display-src), ui-sans-serif, system-ui, sans-serif;
  --font-dv-body: var(--font-dv-body-src), ui-sans-serif, system-ui, sans-serif;
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
    <div className={`${display.variable} ${body.variable}`}>
      {children}
    </div>
  )
}
```

`latin-ext` e obligatoriu: subsetul `latin` nu acoperă complet ă, î, â, ș, ț.

> **Layout-ul încarcă doar fonturile; nu aplică stil.** Acest layout învelește TOATE rutele de frontend, inclusiv pe cele randate cu template-ul `fauna` (cel live acum și plasa de siguranță la rollback). Dacă wrapper-ul ar purta `bg-dv-bg text-dv-ink font-dv-body`, noul stil s-ar scurge peste `fauna`. De aceea wrapper-ul definește doar variabilele CSS; clasele vizuale (`font-dv-body bg-dv-bg text-dv-ink`) le pune `DivetLayout` pe propriul element rădăcină (Task 11).

- [ ] **Step 2: Elimină injectarea de la runtime**

În `components/frontend/templates/divet/DivetLayout.tsx`, șterge întregul `useEffect` care creează elementul `<link>` către `fonts.googleapis.com` (în jurul liniilor 55–63, blocul care începe cu `if (document.getElementById('divet-fonts')) return`).

- [ ] **Step 3: Verifică eliminarea**

```bash
grep -rn "fonts.googleapis" components/
```

Expected: fără rezultat.

- [ ] **Step 4: Verifică că fonturile sunt încărcate cu subsetul corect**

Clasele vizuale nu sunt încă aplicate (vin în Task 11), deci aici verificăm încărcarea, nu randarea:

```bash
npm run dev
```

Pe `http://localhost:3000/` (portul implicit `next dev`; `3002` e doar `next start`), în sursa HTML trebuie să existe un `<div>` cu clase care conțin ambele variabile (`__variable_...`), iar CSS-ul generat trebuie să conțină `@font-face` pentru Archivo și Public Sans cu `unicode-range` care acoperă `U+0102-0103` (ă), `U+0218-0219` (Ș, ș) și `U+021A-021B` (Ț, ț) — adică subsetul `latin-ext` e prezent. Verificarea vizuală a diacriticelor se face la Task 11, când `DivetLayout` aplică fontul.

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
  title: "DiVet",
  description: "Enciclopedia animalelor din România",
};
```

> **Fără `title.template`.** Zece pagini de frontend își adaugă deja `| ${siteName}` la un titlu de tip string (`[slug]`, `[subSlug]`, `[articleSlug]`, `blog`, `comparatie`). Un `template: "%s | DiVet"` pe layout-ul rădăcină s-ar aplica peste ele și ar produce „Labrador | Divet | DiVet". `title: "DiVet"` e doar valoarea implicită pentru paginile fără titlu propriu.

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

- [ ] **Step 2: Generează migrarea cu `migrate diff`, nu cu `migrate dev`**

> **De ce nu `migrate dev`.** `prisma/migrations/0_init/migration.sql` conține zgomot de CLI în fișier (antetul „Loaded Prisma config…" la liniile 1–2 și caseta „Update available" la 479–485), rămas de la crearea baseline-ului cu `migrate diff --script > migration.sql`. Postgres nu poate executa fișierul, iar `migrate dev` îl rulează pe o bază „umbră" și ar pica. Fișierul **nu se editează**: producția îl are înregistrat ca aplicat (via `resolve`, cu checksum-ul unui șir gol, `e3b0c442…`, deci nepotrivit oricum), iar editarea lui ar adăuga risc fără beneficiu. Migrările noi se generează cu `migrate diff` și se aplică cu `migrate deploy`, exact cum le va aplica și producția la Task 22.

```bash
mkdir -p prisma/migrations/20261016120000_category_nav
git show HEAD:prisma/schema.prisma > /tmp/schema.before.prisma
npx prisma migrate diff --from-schema /tmp/schema.before.prisma --to-schema prisma/schema.prisma --script \
  | grep -v "^Loaded Prisma config" > prisma/migrations/20261016120000_category_nav/migration.sql
```

Fișierul rezultat trebuie să conțină **doar** SQL: nicio linie „Loaded Prisma config", nicio casetă `┌─│└`. Verifică: `grep -nE "^(Loaded|┌|│|└)" prisma/migrations/*_category_nav/migration.sql` nu returnează nimic. Conținutul așteptat: două `ALTER TABLE "Category" ADD COLUMN`.

Apoi aplică-l local și regenerează clientul:

```bash
npx prisma migrate deploy
npx prisma generate
```

Expected: „1 migration found … applied", client regenerat.

- [ ] **Step 3: Verifică în bază**

```bash
"/c/Program Files/PostgreSQL/17/bin/psql.exe" -h 127.0.0.1 -p 5433 -U cms_user -d velocitycms -c '\d "Category"'
```

Confirmă coloanele `sortOrder` și `showInNav`.

> **Precondiție locală:** baza de pe `127.0.0.1:5433` are `0_init` marcat aplicat (`migrate resolve --applied 0_init`) și zero drift față de `schema.prisma`. Dacă o recreezi, pornește de la liniile 3–478 din `0_init/migration.sql`, nu de la tot fișierul.

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

- [ ] **Step 3: Actualizează regula 3 și payload-ul pentru noua taxonomie**

Regula 3 din „Reguli obligatorii" listează categorii plate (`caini`, `pisici`, `pasari`, `pesti`, `reptile`, `rozatoare`, `iepuri`, `cai`). Înlocuiește-o cu:

```markdown
3. **`categorySlug` e grupul, `subCategorySlug` e subcategoria.** Folosește sluguri existente.
   Grupuri: `caini`, `pisici`, `animale-mici`, `pasari`, `acvariu-terariu`, `salbatice`, `sanatate`.
   `subCategorySlug` e opțional și trebuie să aparțină grupului ales (ex. `caini` + `rase`).
   Fișele de rasă/specie merg într-o subcategorie (ex. `caini` + `rase` → URL `/caini/rase/labrador-retriever`).
   Nu trimite `subCategorySlug` fără `categorySlug` (eroare 400).
   Un slug care nu există se creează automat, dar **nu apare în meniul de navigație** până nu e
   publicat din admin — deci o greșeală de tastare nu strică meniul, dar creează o categorie de curățat.
```

În exemplul de payload adaugă, după `"categorySlug": "caini",`:

```json
  "subCategorySlug": "rase",
```

și actualizează `"url"` din „Răspuns de succes" la `https://divet.ro/caini/rase/labrador-retriever`. În checklist, înlocuiește linia `categorySlug` dintr-o categorie existentă cu: `categorySlug` și `subCategorySlug` din taxonomia de mai sus.

Tabelul de subcategorii valide (pentru referință în ghid):

| Grup | `subCategorySlug` |
|---|---|
| `caini` | `rase`, `ingrijire`, `sanatate`, `dresaj`, `alimentatie` |
| `pisici` | `rase`, `ingrijire`, `sanatate`, `comportament` |
| `animale-mici` | `rozatoare`, `iepuri`, `dihori`, `arici` |
| `pasari` | `papagali`, `canari`, `pasari-de-curte`, `pasari-salbatice` |
| `acvariu-terariu` | `pesti-apa-dulce`, `pesti-marini`, `reptile`, `amfibieni`, `nevertebrate` |
| `salbatice` | `mamifere`, `rapitoare`, `specii-protejate`, `fauna-romaniei` |
| `sanatate` | `boli`, `vaccinare`, `parazitologie`, `urgente` |

**Nu schimba** secțiunea FAQ: `faqItems` rămâne cheie separată în payload (publisher-ul îl transformă în nod `faqBlock`).

- [ ] **Step 4: Actualizează secțiunea „Câmpuri custom — configurare inițială în admin"**

Secțiunea spune acum să definești câmpurile manual din admin. Înlocuiește paragraful cu: câmpurile se creează automat de `scripts/seed-field-definitions.ts` (Task 8); `sortOrder` e în blocuri de 100 (specificații 100–199, profil comportamental 200–299, conservare 300–399); câmpurile 100–199 apar în placa de specificații, 200–299 în profilul comportamental; `tldr` apare în caseta „Pe scurt". Elimină mențiunea despre „strip-ul verde" și „grid 2 coloane" (design vechi).

- [ ] **Step 5: Commit**

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
]
// FAQ-ul NU e un camp: publisher-ul primeste `faqItems` si il adauga ca nod `faqBlock`
// in continutul TipTap; schema FAQPage e generata de lib/seo/schema-generator.ts.
//
// NOTA (verificata la executie, commit ffc9f94): `fieldOptions` pentru SELECT NU e un array
// simplu de string-uri. Adminul si editorul folosesc un SIR JSON de obiecte {value,label}:
// CustomFieldsPanel.tsx:124 face JSON.parse(def.fieldOptions as string), iar API-ul scrie
// JSON.stringify(...) (field-definitions/route.ts:92). Scriptul commitat are un helper
// `toOptions()` care produce acest format; blocul de cod de aici arata forma initiala, gresita.

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
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-field-definitions.ts
```

Expected: 19 linii `creat: ...`.

- [ ] **Step 3: Rulează din nou ca să confirmi idempotența**

```bash
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-field-definitions.ts
```

Expected: 19 linii `actualizat: ...`, niciun duplicat.

- [ ] **Step 4: Confirmă în admin**

Deschide `/admin/settings/custom-fields`, verifică cele 19 câmpuri și ordinea lor.

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
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 cere un adapter; la fel construiesc clientul lib/prisma.ts si prisma/seed.ts.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

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
  const domain = process.env.SEED_SITE_DOMAIN ?? 'divet.ro'
  const site = await prisma.site.findFirst({ where: { domain } })
  if (!site) throw new Error(`Site-ul ${domain} nu exista in baza`)

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

Apoi generează migrarea cu aceeași metodă ca la Task 6 (`migrate diff` + `migrate deploy`, **nu** `migrate dev` — vezi nota de la Task 6 Step 2). Schema „înainte" e cea de la commit-ul curent:

```bash
mkdir -p prisma/migrations/20261016130000_category_slug_unique_per_parent
git show HEAD:prisma/schema.prisma > /tmp/schema.before.prisma
npx prisma migrate diff --from-schema /tmp/schema.before.prisma --to-schema prisma/schema.prisma --script \
  | grep -v "^Loaded Prisma config" > prisma/migrations/20261016130000_category_slug_unique_per_parent/migration.sql
npx prisma migrate deploy
npx prisma generate
```

Expected: SQL-ul conține un `DROP INDEX` pe `(siteId, slug)` și un `CREATE UNIQUE INDEX` pe `(siteId, parentId, slug)`. Fișierul nu conține linii de CLI. Aplicarea trece fără conflicte — în producție există o singură categorie, deci niciun rând nu încalcă noua constrângere.

> **Atenție la `NULL` în PostgreSQL.** Într-un index unic, două rânduri cu `parentId` `NULL` **nu** sunt considerate egale. Pe categoriile rădăcină (`parentId` = `NULL`), `@@unique([siteId, parentId, slug])` nu mai împiedică în bază două grupuri cu același slug. **Nu adăugăm index parțial**: Prisma nu modelează indexuri parțiale, deci ar apărea la fiecare verificare de drift (`migrate diff`) ca o diferență permanentă. Garanția pe rădăcini rămâne la nivel de aplicație, în gărzile din Step 2b, iar seed-ul e idempotent prin `findFirst`.

- [ ] **Step 2b: Aliniază gărzile de duplicat din API la `(siteId, parentId, slug)`**

API-ul de categorii verifică deja duplicatele la nivel de aplicație, dar **la nivel de site** — ceea ce ar bloca din admin exact taxonomia aprobată (nu s-ar putea crea „rase" sub Pisici dacă există sub Câini). Două locuri:

- `app/api/categories/route.ts` (POST, ~l.55-56): `prisma.category.findFirst({ where: { siteId, slug } })` → adaugă `parentId: parentId ?? null` în `where` (folosește variabila de părinte din corpul cererii; verifică cum se numește în fișier). Mesajul 409 devine `'Slug already exists in this category level'`.
- `app/api/categories/[id]/route.ts` (PUT, ~l.26-29): conflictul se caută în același nivel de părinte, **excluzând categoria curentă** (`id: { not: id }`), folosind `parentId`-ul rezultat după actualizare (cel din corpul cererii dacă e trimis, altfel cel existent), cu `null` pentru rădăcină. Același mesaj 409.

Nu schimba nimic altceva în aceste fișiere (invalidarea cache-ului de navigație vine la Task 10). Verifică manual, cu baza locală: creează prin API (sau direct cu un script scurt) două categorii cu același slug sub părinți diferiți (trebuie să reușească) și două cu același slug în același părinte (a doua trebuie să dea 409).

> **De verificat după migrare:** orice cod care caută o categorie doar după `{ siteId, slug }` presupunea unicitate globală. Caută-l și adaugă `parentId` unde e nevoie:
> ```bash
> grep -rn "category.findUnique\|siteId_slug" app/ lib/ --include=*.ts --include=*.tsx
> ```
> Rutele de frontend caută deja cu `parentId: null` pentru grupuri (vezi `app/(frontend)/[slug]/page.tsx:26`), deci sunt corecte. Verifică API-urile din `app/api/categories/`.

- [ ] **Step 3: Rulează**

```bash
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-categories.ts
```

Expected: 7 grupuri + 30 de subcategorii create (`caini` apare ca `actualizat`, fiind deja în bază).

- [ ] **Step 4: Rulează din nou pentru idempotență**

```bash
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-categories.ts
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

### Task 8c: Publisher — subcategorii și categorii create automat fără să intre în meniu

**Files:**
- Create: `lib/publisher-paths.ts`
- Create: `lib/publisher-paths.test.ts`
- Modify: `app/api/publisher/receive/route.ts` (tipul payload-ului ~l.50-52, destructurarea ~l.102-105, rezolvarea categoriei l.122-133, `schema` ~l.231, revalidare și URL l.384-397)

Descoperit la execuție, absent din spec: publisher-ul știe doar categorii rădăcină. La `route.ts:125` caută `findFirst({ siteId, slug: categorySlug })` și, dacă nu găsește, **creează singur o categorie rădăcină**, iar URL-ul public e `/${categorySlug}/${post.slug}`. Pentru ierarhia din §5.1 (articole în subcategorii, URL pe trei niveluri, care există deja ca rută) sunt trei lacune:

1. nu poate plasa o fișă într-o subcategorie, deci URL-ul `/caini/rase/labrador-retriever` nu poate fi produs;
2. după Task 8b slug-urile copil se repetă (`rase` sub Câini și sub Pisici), deci căutarea doar după slug devine ambiguă;
3. o categorie creată automat dintr-o greșeală de tastare ar apărea **în navigație**, fiindcă `showInNav` are default `true`.

**Contract.** Payload-ul primește `subCategorySlug?: string | null`, opțional, retrocompatibil: fără el, comportamentul pentru un apel existent rămâne identic (categorie rădăcină, URL pe două niveluri).

- [ ] **Step 1: Scrie testele**

Create `lib/publisher-paths.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildPublicPath, humanizeSlug } from './publisher-paths'

describe('buildPublicPath', () => {
  it('fara categorie merge in /blog', () => {
    expect(buildPublicPath({ postSlug: 'labrador' })).toBe('/blog/labrador')
  })

  it('doar categorie radacina: doua niveluri', () => {
    expect(buildPublicPath({ categorySlug: 'caini', postSlug: 'labrador' })).toBe('/caini/labrador')
  })

  it('categorie si subcategorie: trei niveluri', () => {
    expect(
      buildPublicPath({ categorySlug: 'caini', subCategorySlug: 'rase', postSlug: 'labrador' }),
    ).toBe('/caini/rase/labrador')
  })

  it('ignora subcategoria cand lipseste categoria', () => {
    expect(buildPublicPath({ subCategorySlug: 'rase', postSlug: 'labrador' })).toBe('/blog/labrador')
  })

  it('trateaza null ca lipsa', () => {
    expect(
      buildPublicPath({ categorySlug: 'caini', subCategorySlug: null, postSlug: 'labrador' }),
    ).toBe('/caini/labrador')
  })
})

describe('humanizeSlug', () => {
  it('transforma slug-ul in nume cu majuscule', () => {
    expect(humanizeSlug('caini-de-talie-mare')).toBe('Caini De Talie Mare')
  })

  it('un singur cuvant', () => {
    expect(humanizeSlug('rase')).toBe('Rase')
  })

  it('sir gol', () => {
    expect(humanizeSlug('')).toBe('')
  })
})
```

- [ ] **Step 2: Rulează ca să confirmi că pică**

```bash
npm test
```

Expected: FAIL — `Cannot find module './publisher-paths'`.

- [ ] **Step 3: Scrie implementarea**

Create `lib/publisher-paths.ts`:

```ts
export type PublicPathInput = {
  categorySlug?: string | null
  subCategorySlug?: string | null
  postSlug: string
}

/**
 * Calea publica a unui articol. Reflecta rutele din app/(frontend):
 *   /blog/[slug]                      fara categorie
 *   /[slug]/[subSlug]                 categorie radacina
 *   /[slug]/[subSlug]/[articleSlug]   categorie radacina + subcategorie
 */
export function buildPublicPath({ categorySlug, subCategorySlug, postSlug }: PublicPathInput): string {
  if (!categorySlug) return `/blog/${postSlug}`
  if (!subCategorySlug) return `/${categorySlug}/${postSlug}`
  return `/${categorySlug}/${subCategorySlug}/${postSlug}`
}

/** Numele afisat al unei categorii create automat dintr-un slug. */
export function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
```

- [ ] **Step 4: Rulează testele**

```bash
npm test
```

Expected: PASS, 9 teste în total (1 de setup + 8 noi).

- [ ] **Step 5: Leagă în `receive/route.ts`**

Importă `buildPublicPath` și `humanizeSlug`. Apoi:

1. Tipul payload-ului: lângă `categorySlug?: string | null` adaugă `subCategorySlug?: string | null`, și include-l în destructurarea de la ~l.102-105.
2. Validare, imediat după verificarea `title/slug/contentHtml`: dacă `subCategorySlug` e setat dar `categorySlug` nu, răspunde `400` cu `{ error: 'subCategorySlug requires categorySlug' }`.
3. Înlocuiește blocul „Find or create category" cu rezolvare pe ierarhie:

```ts
  // ── Find or create category (rădăcină + subcategorie opțională) ──────────
  // Categoriile create automat primesc showInNav: false — altfel o greșeală de
  // tastare în payload ar apărea în bara de navigație. Se publică în meniu din admin.
  let categoryId: string | null = null
  let leafCategory: { name: string; slug: string } | null = null
  if (categorySlug) {
    let root = await prisma.category.findFirst({
      where: { siteId, slug: categorySlug, parentId: null },
    })
    if (!root) {
      root = await prisma.category.create({
        data: { siteId, slug: categorySlug, name: humanizeSlug(categorySlug), showInNav: false },
      })
    }
    let leaf = root
    if (subCategorySlug) {
      let child = await prisma.category.findFirst({
        where: { siteId, slug: subCategorySlug, parentId: root.id },
      })
      if (!child) {
        child = await prisma.category.create({
          data: {
            siteId,
            slug: subCategorySlug,
            name: humanizeSlug(subCategorySlug),
            parentId: root.id,
            showInNav: false,
          },
        })
      }
      leaf = child
    }
    categoryId = leaf.id
    leafCategory = { name: leaf.name, slug: leaf.slug }
  }
```

4. La obiectul `category:` din `schema` (~l.231), înlocuiește `categorySlug ? { name: categorySlug, slug: categorySlug } : null` cu `leafCategory`.
5. Revalidarea și `publicUrl` (~l.384-397) folosesc `buildPublicPath`:

```ts
  const publicPath = buildPublicPath({ categorySlug, subCategorySlug, postSlug: post.slug })
  try {
    revalidatePath(publicPath)
    revalidatePath('/sitemap.xml')
  } catch {
    // Non-fatal in development
  }

  const publicUrl = `${siteData.siteUrl}${publicPath}`
```

(păstrează blocul `try/catch` și comentariul existent; elimină ramura `else` care revalida `/blog/...`, fiindcă `buildPublicPath` o acoperă).

> **Notă pentru subagent:** există și alte apeluri `revalidatePath` / construcții de URL în același fișier sau în rute apropiate (de exemplu `app/api/posts/[id]/route.ts`). Caută cu `grep -n "revalidatePath\|categorySlug" app/api/publisher/receive/route.ts`. Modifică doar `receive/route.ts`; dacă găsești același tipar în altă rută, **raportează-l**, nu îl repara.

- [ ] **Step 6: Verifică**

```bash
npx tsc --noEmit | grep -c "error TS"
npm test
```

Expected: 0 erori de tip, 9 teste trec. Verificarea de integrare (publicarea efectivă a unei fișe cu `subCategorySlug`) se face la Task 21, cu bază de date și token de publisher.

- [ ] **Step 7: Commit**

```bash
git add lib/publisher-paths.ts lib/publisher-paths.test.ts app/api/publisher/receive/route.ts
git commit -m "feat: publisher accepta subCategorySlug, categoriile create automat nu intra in meniu

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Faza 3 — Navigație

### Task 9: `lib/navigation.ts` — arborele, cu teste

> **Executat ca două fișiere (commit `5a5435d`), nu unul.** Logica pură (`CategoryRow`, `NavGroup`, `buildNavTree`) e în `lib/navigation-tree.ts`, cu testele în `lib/navigation-tree.test.ts` (7 teste); `lib/navigation.ts` conține doar accesul la date și cache-ul (`getNavigation`, `NAVIGATION_TAG`) și re-exportă tipurile. Motiv: un test pentru o funcție de sortare nu trebuie să importe `@/lib/prisma` și `next/cache`. Componentele importă tipurile din `@/lib/navigation`. Blocurile de cod de mai jos arată forma inițială; **sursa de adevăr sunt fișierele commitate.** `unstable_cache` e confirmat în docs-urile locale ca încă suportat în această versiune (le recomandă pe `use cache`, care cere flag-ul Cache Components, neactivat aici).

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
revalidateTag(NAVIGATION_TAG, { expire: 0 })
```

Cu importurile la începutul fișierului:

```ts
import { revalidateTag } from 'next/cache'
import { NAVIGATION_TAG } from '@/lib/navigation'
```

> **Semnătura din această versiune de Next** (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`): `revalidateTag(tag: string, profile: string | { expire?: number })`. Forma cu un singur argument e depreciată și merge doar cu erorile TypeScript suprimate. `'max'` (recomandat în general) are semantică stale-while-revalidate: următoarea vizită primește meniul vechi. Pentru modificări din admin, rare, unde vrei să vezi imediat rezultatul, se folosește `{ expire: 0 }`. Valoarea tag-ului vine din constanta `NAVIGATION_TAG` exportată de `lib/navigation.ts`, ca invalidarea și cache-ul să nu poată diverge. Caută și alte apeluri existente `revalidateTag(` cu un singur argument în repo și **raportează-le**, fără să le repari.

- [ ] **Step 2b: Repară garda de conflict din `PUT` (lăsată deschisă de Task 8b)**

În `app/api/categories/[id]/route.ts`, garda de duplicat rulează doar în `if (slug !== category.slug)`. Cât timp unicitatea era pe tot site-ul, asta era corect; acum nu mai e: o cerere care **mută** o categorie sub alt părinte, păstrându-i slug-ul, ocolește verificarea. Dacă părintele-țintă e o rădăcină, nici indexul din bază nu o prinde (`NULL` nu e egal cu `NULL`); dacă e un părinte real, apare ca eroare 500 din încălcarea indexului unic.

Calculează părintele-țintă o singură dată și rulează garda când se schimbă **slug-ul sau părintele**:

```ts
  const targetParentId = (parentId !== undefined ? parentId : category.parentId) || null
  const parentChanged = targetParentId !== (category.parentId ?? null)

  if (slug !== category.slug || parentChanged) {
    const conflict = await prisma.category.findFirst({
      where: { siteId: category.siteId, slug, parentId: targetParentId, id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already exists in this category level' }, { status: 409 })
  }
```

Tot aici, `data` de la `prisma.category.update` folosește `parentId ?? null`: un șir gol `""` ar ajunge în bază și ar încălca cheia străină. Normalizează la fel ca garda: `...(parentId !== undefined && { parentId: parentId || null })`. La fel în `route.ts` (POST), unde `create` folosește `parentId ?? null` în timp ce garda folosește `parentId || null`.

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

Elementul rădăcină al `DivetLayout` poartă `min-h-screen font-dv-body bg-dv-bg text-dv-ink` — aici, nu în `app/(frontend)/layout.tsx` (vezi nota de la Task 4), ca stilul nou să nu se scurgă peste `fauna`. Tot aici se verifică vizual diacriticele: „Înălțime la greabăn", „Ștefan", „Țară" trebuie randate cu Archivo/Public Sans, fără glife lipsă sau fallback.

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

### Task 12b: `buildPostPath` — calea unui articol, cu părinte

**Files:**
- Modify: `lib/seo/canonical-builder.ts`
- Create: `lib/seo/canonical-builder.test.ts`

Descoperit la execuție: backend-ul (revalidare în scheduler și publish/unpublish, sitemap, canonical) tratează deja `category.parent`, dar **template-urile de frontend compun linkul unui articol ca `/${post.category.slug}/${post.slug}`**, fără părinte. Pentru o fișă din subcategorie asta dă `/rase/labrador` (404) în loc de `/caini/rase/labrador`. În plus, interogările aduc `category: { name, slug }` fără `parent`, deci template-ul nici n-ar avea din ce să-l construiască. `buildCanonicalUrl` face deja logica corectă, dar întoarce URL absolut; template-urile au nevoie de cale relativă.

- [ ] **Step 1: Scrie testele**

Create `lib/seo/canonical-builder.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildPostPath, buildCanonicalUrl } from './canonical-builder'

describe('buildPostPath', () => {
  it('fara categorie: /blog/{slug}', () => {
    expect(buildPostPath({ slug: 'labrador' })).toBe('/blog/labrador')
  })

  it('categorie radacina: /{cat}/{slug}', () => {
    expect(buildPostPath({ slug: 'labrador' }, { slug: 'caini' })).toBe('/caini/labrador')
  })

  it('subcategorie: /{parinte}/{cat}/{slug}', () => {
    expect(buildPostPath({ slug: 'labrador' }, { slug: 'rase', parent: { slug: 'caini' } })).toBe(
      '/caini/rase/labrador',
    )
  })

  it('parent null inseamna radacina', () => {
    expect(buildPostPath({ slug: 'labrador' }, { slug: 'caini', parent: null })).toBe('/caini/labrador')
  })
})

describe('buildCanonicalUrl (regresie dupa refactor)', () => {
  it('foloseste canonicalUrl cand exista', () => {
    expect(
      buildCanonicalUrl({ slug: 'x', canonicalUrl: 'https://alt.ro/x' }, { siteUrl: 'https://divet.ro' }),
    ).toBe('https://alt.ro/x')
  })

  it('URL absolut pe trei niveluri si taie slash-ul final din siteUrl', () => {
    expect(
      buildCanonicalUrl(
        { slug: 'labrador' },
        { siteUrl: 'https://divet.ro/' },
        { slug: 'rase', parent: { slug: 'caini' } },
      ),
    ).toBe('https://divet.ro/caini/rase/labrador')
  })
})
```

- [ ] **Step 2: Rulează ca să confirmi că pică**

```bash
npm test
```

Expected: FAIL — `buildPostPath is not a function` (importul lipsește).

- [ ] **Step 3: Implementează**

În `lib/seo/canonical-builder.ts` adaugă, înainte de `buildCanonicalUrl`:

```ts
/**
 * Calea relativa a unui articol (fara domeniu).
 * - fara categorie:       /blog/[postSlug]
 * - categorie radacina:   /[categorySlug]/[postSlug]
 * - subcategorie:         /[parentSlug]/[categorySlug]/[postSlug]
 */
export function buildPostPath(
  post: Pick<CanonicalPost, 'slug'>,
  category?: CanonicalCategory | null
): string {
  if (!category) return `/blog/${post.slug}`
  if (category.parent) return `/${category.parent.slug}/${category.slug}/${post.slug}`
  return `/${category.slug}/${post.slug}`
}
```

Și în `buildCanonicalUrl` înlocuiește cele trei linii finale (`if (!category) … return …`) cu:

```ts
  return `${base}${buildPostPath(post, category)}`
```

- [ ] **Step 4: Rulează testele**

```bash
npm test
```

Expected: PASS — 6 teste noi, fără regresii.

- [ ] **Step 5: Commit**

```bash
git add lib/seo/canonical-builder.ts lib/seo/canonical-builder.test.ts
git commit -m "feat: buildPostPath - calea relativa a unui articol, cu parinte

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

> **Consecință pentru Tasks 14–17.** Orice pagină care alimentează un template `divet` cu articole trebuie (a) să selecteze `category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } }` și (b) să calculeze `href` cu `buildPostPath`, nu prin concatenare. `ArticleCard` primește deja `href` gata calculat. Template-urile `fauna`, `default` și `minimal` **nu se modifică** (legacy); riscul la rollback pe `fauna` e descris la Task 22.

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
