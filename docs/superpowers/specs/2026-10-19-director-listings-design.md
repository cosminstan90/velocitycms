# Director de fișe (faza 2, sub-proiectul 1): design

Stare: implementat pe branch-ul feat/director-fise; neaplicat pe producție

## Context și scop

Faza 1 a făcut din divet.ro o enciclopedie. Faza 2 adaugă un director de cabinete veterinare, dresori și saloane de toaletaj, cu extindere ulterioară spre planuri plătite și afiliere. Fiecare parte are propriul ciclu spec → plan → implementare:

1. **Fișe publice (acest spec).** Model de date, administrare, pagini publice, SEO.
2. Înscriere publică, revendicare și moderare (nespecificat).
3. Planuri plătite: evidențiere, facturare, expirare (nespecificat).
4. Afiliere: linkuri și blocuri de produse în articole (nespecificat).

Decizii: fișele le introduce proprietarul din admin (fără import și fără formular public); tipuri în prima versiune: cabinete veterinare, dresori / școli de dresaj, saloane de toaletaj; model de date dedicat `Listing`, nu `Post` cu câmpuri.

## Model de date

Toate tabelele sunt scoped pe `siteId`, cu `onDelete: Cascade` de la `Site`, ca restul schemei. O singură migrare aditivă, generată cu `prisma migrate diff` și aplicată cu `migrate deploy` (nu `migrate dev`; `0_init` nu se editează).

- `enum ListingType { VET TRAINER GROOMER }`, `enum ListingStatus { DRAFT PUBLISHED }`.
- `Listing`: `id`, `siteId`, `type`, `name`, `slug`, `description` (text, opțional), `county`, `city`, `citySlug`, `address` (opțional), `lat`/`lng` (Float, opționale, nefolosite în v1), `phone`, `email`, `website` (opționale, vezi validări), `openingHours` (Json, opțional), `status` (implicit `DRAFT`), `featured` (Boolean, implicit `false`), `plan` (String, implicit `"free"`), `publishedAt`, `createdAt`, `updatedAt`.
  - `featured` și `plan` sunt rezervate pentru sub-proiectul 3 și nu au efect în v1; nu se afișează și nu se editează.
  - Unic: `(siteId, type, citySlug, slug)`. Index pe `(siteId, type, status, citySlug)`.
- `ListingService`: `id`, `siteId`, `type`, `name`, `slug`; unic `(siteId, type, slug)`.
- `ListingServiceLink` (legătură n–n): `listingId`, `serviceId`, cheie compusă.

`name`, `county` și `city` sunt obligatorii și pentru `DRAFT`; la publicare se cere în plus telefon sau e-mail.

Orașul se stochează ca text (`city`) plus `citySlug` calculat cu `slugify`. Grafiile de oraș și județ se normalizează la scriere, per site: prima grafie stocată câștigă. Nu există tabel de orașe în v1; listele de orașe se obțin cu `groupBy`.

## Rute publice

Toate au `export const dynamic = 'force-dynamic'` (regula din runbook: `not-found.tsx` folosește `headers()`, deci niciun `revalidate`). Paginarea folosește `parsePageParam`.

| Rută | Conținut |
|---|---|
| `/director` | cele 3 tipuri, orașele cu cele mai multe fișe publicate (caseta de căutare e amânată, nu există în v1) |
| `/director/<tip>` | lista tipului; filtre `?judet=` și `?serviciu=`; paginare |
| `/director/<tip>/<oras>` | lista unui oraș |
| `/director/<tip>/<oras>/<slug>` | fișa |

Un oraș fără fișe publicate dă 404; `/director` și `/director/<tip>` goale dau 200 cu `noindex`. Un `?page=N` în afara intervalului dă 404.

Segmentele `<tip>` sunt `veterinari`, `dresori`, `toaletaj` (mapate la enum). O valoare necunoscută dă 404, la fel și o fișă `DRAFT`.

- `director` devine slug rezervat: API-ul de categorii și seed-urile îl resping ca slug de categorie rădăcină. Directorul static `app/(frontend)/director/` are oricum prioritate în fața `[slug]`.
- Fișa conține: nume, tip, adresă, telefon, e-mail, site, program, servicii și **articole din categoria potrivită** (veterinari → `sanatate`, dresori și toaletaj → `caini`), prin `RelatedArticles`.
- JSON-LD: `VeterinaryCare` pentru `VET`, `LocalBusiness` pentru ceilalți (cu `address`, `telephone`, `openingHoursSpecification`), plus `BreadcrumbList`. Construit în `lib/seo/listing-schema.ts` (nu în `schema-generator.ts`), cu teste. Fără `aggregateRating` (nu există recenzii).
- Metadata cu titlu și descriere pe pagină, `canonical` și `robots: index` doar pentru pagini cu conținut. Listele goale se servesc cu 200 și `noindex`.
- Sitemap: doar fișele `PUBLISHED`, plus `/director`, paginile de tip și paginile de oraș care au cel puțin o fișă. Meniul principal primește linkul „Director" numai când există fișe publicate; până atunci nu apare.
- Template: componente noi în `components/frontend/templates/divet/` (`DirectoryTemplate`, `ListingCard`, `ListingTemplate`), fără hex, doar tokenii `dv-`. Alte template-uri nu implementează directorul; rutele funcționează doar cu `divet`, iar pe celelalte dau 404.

## Administrare

- `/admin/director`: listă cu filtre tip / oraș / status și căutare; formular de creare și editare; pagină simplă pentru servicii. Intrare nouă în `AdminSidebar`.
- API: `app/api/listings` (+ `[id]`) și `app/api/listing-services` (+ `[id]`), cu autentificare ca la categorii. Garda de duplicat pe cheile unice, 409 la conflict, teste pe handlere. Paginile publice nu au cache (`force-dynamic`), deci scrierile din API nu apelează `revalidateTag`.
- Slug-ul se generează cu `slugify` (acum păstrează ş/ţ) din nume, cu sufix numeric la coliziune.
- Seed de servicii uzuale pe tip, idempotent (`scripts/seed-listing-services.ts`, adăugat și în pasul de seed din `deploy-pm2.sh`), de exemplu: VET – vaccinări, chirurgie, urgențe 24/7, stomatologie; TRAINER – dresaj de bază, comportament, agility; GROOMER – tuns, baie, deparazitare.
- Seed local de probă cu câteva fișe, doar pe baza locală (aceeași gardă ca `dev-seed-sample-content.ts`).

## Validări (`lib/listings.ts`, funcții pure, cu teste)

- Telefon: se normalizează la `+40…` (acceptă `07…`, `+40…`, spații, puncte, paranteze); fix mobil și fix românesc; se afișează formatat.
- `website`: doar `https://` sau `http://`; se adaugă `https://` când lipsește schema. E-mail: sintaxă simplă.
- `openingHours`: JSON `{ mon..sun: [] | [{ from: "HH:MM", to: "HH:MM" }] }`; începutul înainte de sfârșit; interval gol = închis.
- Publicare permisă doar cu nume, județ, oraș și cel puțin un telefon sau un e-mail.
- Orice text introdus de admin se afișează escapat (React); descrierea nu acceptă HTML în v1.

## Testare și lansare

- Vitest: validările, construirea URL-urilor și a slugurilor, JSON-LD, handlerele API, `parsePageParam` pe liste.
- `scripts/smoke.sh` verifică automat `/director` și fișele publicate, pentru că apar în sitemap; 404-ul pentru o fișă `DRAFT` se verifică local.
- Lansare după runbook-ul `docs/deploy-divet.ro.md`: backup, `migrate deploy` (o migrare), seed, build, reload, test de fum. Repetiție mai întâi pe o bază locală care imită producția.
- Pe producție nu se adaugă fișe false: directorul rămâne gol (fără link în meniu și fără intrări în sitemap) până introduci fișele reale.

## Neinclus

Înscriere publică, revendicare, moderare, planuri plătite, recenzii, hărți și geocodare, import în masă, orașe ca entitate, afiliere, imagini pe fișă (se adaugă cu sub-proiectul 2 sau separat), căutare fără diacritice în director (se reutilizează `lib/search.ts` când e nevoie).

## Riscuri

- Calitatea datelor (telefoane, adrese) depinde de cine introduce fișele: validările reduc erorile, nu le elimină.
- `groupBy` pe oraș în pagina `/director` e o interogare per cerere; suficient pentru sute de fișe, de revăzut peste câteva mii.
- Sufixele numerice de slug pot produce URL-uri nestabile dacă o fișă veche e ștearsă și recreată; fișa nu se redenumește automat după nume.
