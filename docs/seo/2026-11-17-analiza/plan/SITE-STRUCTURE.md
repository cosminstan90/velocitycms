# Arhitectura site-ului — divet.ro, 17 noiembrie 2026

Șablon: `publisher.md` (hub-uri de subiect, autori, politică editorială). Adaptat la CMS-ul existent (`buildPostPath`, silozuri, `lib/category-content.ts`). **Principiu: nu rupem URL-urile existente.** Toate schimbările de mai jos sunt aditive sau cu 301.

## 1. Ierarhia URL curentă (din sitemap, 157 de URL-uri)

```
/                                      home (CollectionPage + ItemList + FAQ)
├── /caini                             grup
│   └── /caini/rase                    sub-hub, 29 fișe
├── /pisici
│   └── /pisici/rase                   19 fișe
├── /marine
│   ├── /marine/mamifere-marine (5) | /rechini-si-pesti (5) | /nevertebrate-marine (4)
│   └── /marine/pasari-marine/pinguinul  (1 articol, hub noindex)
├── /insecte
│   ├── /insecte/gandaci (6) | /insecte/insecte-exotice (3)
├── /salbatice
│   └── /salbatice/mamifere (7)
├── /sanatate
│   ├── /boli (5) | /simptome (7) | /substante-toxice (8) | /parazitologie (3)
│   └── /vaccinare (2, noindex,follow — corect)
├── /liste (+ 3 liste: rase-de-caini-mari, cele-mai-inteligente-rase-de-caini, rase-de-pisici-linistite)
├── /comparatie                        hub gol (0 comparații)
├── /instrumente (+ varsta-caine, aliment-periculos)
├── /glosar   /index-a-z
├── /eticheta/<20 etichete>
├── /autor/redactia  /echipa  /politica-editoriala  /despre-noi  /politica-confidentialitate
└── (nesitemap) /cautare, /director (noindex, gol), /feed.xml, /llms.txt, /llms-full.txt
```

URL-urile de articol sunt **`/{grup}/{subcategorie}/{slug}`** (3 niveluri), fără date. Corect pentru enciclopedie (nu pentru știri); păstrăm.

### Probleme de structură constatate
1. `/comparatie` 200, fără canonical, fără noindex, gol.
2. 20 de etichete în sitemap, subțiri, parțial duplicând categoriile.
3. `marine/pasari-marine` are 1 articol (hub noindex, corect). Subcategoria `insecte/gandaci` conține coleoptere (buburuză, licurici, gândac rinocer, cerb) — denumirea „gândaci” e acceptabilă; menținem URL-ul.
4. Subcategoriile din plan nu există încă: `salbatice/rapitoare`, `salbatice/specii-protejate`, `salbatice/fauna-romaniei`, `sanatate/urgente`, `insecte/insecte-comune`.
5. Silo-ul „sănătate” este separat de „caini/pisici”, deci un cititor din `/caini/rase/labrador-...` ajunge la boli doar prin „Rase predispuse”/„Mai multe din Sănătate” — corect (decizie existentă: nu populăm `caini/sanatate`, `pisici/sanatate`).

## 2. Ierarhia țintă (16.02.2027)

```
/
├── /caini  ──  Hub pilon (400–600 cuvinte, ghid de alegere, linkuri la liste)
│   ├── /caini/rase  (65 fișe)
│   ├── /caini/ingrijire, /caini/dresaj, /caini/alimentatie   ← NU în prima fază (rămân neactivate; <3 articole)
│   └── (după feb 2027) /caini/ghiduri
├── /pisici ── /pisici/rase (31 fișe)
├── /animale-mici      ← apare doar când are ≥ 6 articole (iepure, hamster, cobai, papagal peruș, țestoasă, gecko)
├── /marine  → mamifere-marine (10), rechini-si-pesti (9), nevertebrate-marine (9), pasari-marine (3, rămâne noindex)
├── /insecte → gandaci (10), insecte-exotice (7)  (insecte-comune: după 16.02.2027)
├── /salbatice → mamifere (9), rapitoare (8), fauna-romaniei (8), specii-protejate (6)
├── /sanatate → boli (19), simptome (13), substante-toxice (13), parazitologie (6), vaccinare (6), urgente (4, noindex până la 6)
├── /liste  (11 liste, hub cu intro)
├── /comparatie  (12 pagini; hub indexabil abia după a 3-a)
├── /instrumente (6)
├── /glosar (150 termeni)  /index-a-z
├── /echipa  → /echipa/<recenzor>   (NOU)
├── /corecturi   (NOU)
└── /politica-editoriala  /despre-noi
```

Reguli de afișare (existente + ajustate):
- Categoria apare în meniu și sitemap la **≥ 6 articole**, e `noindex,follow` la 1–5 (regula din F4; acum codul folosește 3 pentru etichete — vezi §6). Subcategoria cu 3–5 articole: indexabilă dar fără link în meniu principal (nu în sitemap este mai sigur; recomand includerea doar ≥ 6).
- `/comparatie` → `noindex,follow` până la ≥ 3 comparații publicate; apoi indexabil și în sitemap.
- Hub-urile de listă și comparație primesc intro scris de mână (150–250 de cuvinte).

## 3. Tipuri de pagini și șabloane

| Tip | Șablon | Cuvinte min. | Schema | Condiție de indexare |
|---|---|---|---|---|
| Fișă rasă | `ArticleTemplate` divet + TL;DR + SpecGrid + FAQ 6 + tabel comparativ | 1.000 (ținta 1.200–1.800) | Article, FAQPage, BreadcrumbList, Speakable; `about` → `Thing`/`Taxon`-like (de decis) | ≥ 800 cuvinte |
| Fișă faună | idem, H2 „Caracteristici/Habitat/Comportament” | 900 | idem + `Taxon` opțional | ≥ 800 |
| Boală | `MedicalWebPage` + `MedicalCondition` | 1.000 | MedicalWebPage, MedicalCondition, FAQPage, `reviewedBy` | recenzor (după 31.12) |
| Simptom | cu „Cât de urgent este” | 1.000 | MedicalWebPage, MedicalSignOrSymptom | recenzor |
| Toxic | „Câinele a mâncat X” | 800 | MedicalWebPage (+ `HowTo` pentru primul ajutor) | recenzor |
| Comparație | `ComparisonTemplate` | 700 (300–500 originale + tabel generat) | Article/WebPage, FAQPage, ItemList cu 2 elemente | ambele fișe publicate |
| Listă filtrată | `lib/lists.ts` + intro | 500 | CollectionPage, ItemList, FAQPage | ≥ 8 intrări |
| Instrument | `ToolLayout` | 400–700 | WebApplication, FAQPage | sursă primară în pagină |
| Glosar | pagină unică, ancore per termen | — | DefinedTermSet | — |
| Etichetă | `/eticheta/<slug>` | ≥ 150 + intro unic | CollectionPage, ItemList | **≥ 8 postări + intro**; altfel `noindex`, ieșire din sitemap |
| Autor/recenzor | `/echipa/<slug>` | 250 | ProfilePage + Person | da |

## 4. Linking intern

Starea: ~100–110 linkuri pe pagină (majoritatea din mega-menu); silozurile există (`lib/silo.ts`); blocul „Mai multe din …” și „Rase predispuse” sunt live. Scriptul de pe server `.backlinks.cjs` încă scrie liste „Citește și” în DB (relink pentru lotul de sănătate este „PENDING după 11-11”, conform memoriei de proiect).

### Țintă și reguli
| Tip | Regulă | Cod |
|---|---|---|
| Sus | breadcrumb + 1 frază către hub | există |
| Lateral | 3 articole din aceeași subcategorie | `lib/related.ts` (T7, de făcut) |
| În jos | fișă → boli frecvente → liste → comparații | `rase_predispuse` există; „Apare în” și „Compară cu” (T6/T4) |
| Cross-silo | 1 link la grup vecin (rasă ↔ sănătate, faună ↔ specie înrudită) | `category-content.related` |
| Glosar | prima apariție a termenilor marcați | autolink la randare (T9) |
| Contextual | minim 4, maxim ~12 în corp; ancore descriptive | validare în publisher |

KPI: 0 orfane, ≥ 4 linkuri primite per articol, adâncime ≤ 3 clicuri din home. Audit lunar cu `scripts/link-audit.ts`.

**Mega-menu:** repetă ~85 de linkuri pe fiecare pagină. Recomand: păstrăm meniul, dar reducem la sub-hub-uri (≤ 30 de linkuri) și mutăm cardurile „Cele mai noi” din meniu în pagini de hub; reduce diluarea și dimensiunea HTML (130–150 KB, home 237 KB).

## 5. Sitemap — porți de calitate

Acum: un fișier, 157 URL-uri, `force-dynamic` (56 s la prima cerere).

Țintă:
1. **Sitemap index** (`/sitemap.xml`) → `sitemap-articole.xml`, `sitemap-hub.xml`, `sitemap-instrumente.xml`, `sitemap-images.xml`, (+ `sitemap-news.xml` nu e necesar). Fiecare < 10 MB și < 50.000 de URL-uri; împărțirea este utilă pentru diagnostic în GSC („Acoperire pe sitemap”).
2. **Generat din cache** (TTL 5–10 min, invalidat la publicare) sau la build; nu interogări la fiecare cerere. Obiectiv TTFB < 500 ms.
3. `lastmod` = `updatedAt` real (data ultimei modificări editoriale), nu data deploy-ului. Se elimină `changefreq` și `priority` (ignorate de Google).
4. **Praguri de intrare:**
   - articol: `published`, ≥ 800 cuvinte, canonical = propriul URL, fără `noindex`;
   - hub categorie: ≥ 6 articole (acum ≥ 1 intră; cele cu 3–5 ies);
   - listă: ≥ 8 intrări; comparație: ambele fișe publicate și ≥ 300 de cuvinte originale;
   - etichetă: ≥ 8 postări și intro de ≥ 150 de cuvinte; altfel nu intră;
   - hub `/comparatie`: ≥ 3 comparații.
5. Excluse: `/cautare`, `/director*`, paginile paginate > 1 (canonical → pagina 1 sau self-referencing cu `noindex,follow`; de testat), `/eticheta/*` sub prag.
6. Trimis în GSC și Bing; IndexNow la publicare (cheie existentă, conform memoriei: nginx/IndexNow).
7. `sitemap-images.xml`: păstrat (1 imagine/articol); alt unic pe imagine.

## 6. Schimbări față de starea curentă (lista scurtă)

| # | Schimbare | Prioritate | Efort |
|---|---|---|---|
| 1 | `/comparatie` → `noindex,follow` până la ≥ 3 comparații; canonical | P0 | 0,5 h |
| 2 | Etichete: ieșire din sitemap + `noindex` sub 8 postări; intro unic la cele rămase; eliminare dublurile cu categorii (`gandaci`, `mamifere-marine`, `pesti-marini`) | P1 | 2–3 h cod + 20 de intro-uri sau eliminare |
| 3 | Sitemap index + cache + lastmod real | P0 | 1 zi |
| 4 | Prag hub categorie: sitemap la ≥ 6 articole (acum se iau toate cu ≥ 1; hub-urile noindex ies) | P1 | 1 h |
| 5 | Subcategorii noi: `salbatice/rapitoare`, `salbatice/fauna-romaniei`, `salbatice/specii-protejate`, `sanatate/urgente`, `insecte/insecte-comune` (cu text în `category-content.ts`) | P1 | 1 zi (cod + 5 texte) |
| 6 | `/echipa/<recenzor>` + `/corecturi` | P0/P1 | 0,5 zi (după confirmarea recenzorului) |
| 7 | Slug-uri: 3 slug-uri umplute → `/caini/rase/labrador-retriever`, `.../bichon-frise`, `.../golden-retriever` cu 301 (și actualizarea linkurilor interne). Risc: pierdere temporară dacă au backlink-uri; fă-o doar după ce GSC arată ce impresii au | P2 | 1 h + monitorizare |
| 8 | Titluri: eliminare sufix dublat („| DiVet | DiVet”) la liste/autor | P2 | 1 h |
| 9 | Mega-menu mai subțire | P2 | 0,5 zi |
| 10 | Organization: logo static, `sameAs`, `contactPoint`; Article `publisher.logo` din fișier stabil | P1 | 1 h |
| 11 | `robots.txt`: reguli explicite AI + linie llms.txt | P2 | 15 min |
| 12 | Câmpuri noi de date (`naparleste`, `greutate_max_kg`, `pericol`) → liste „năpârlesc puțin”, „cele mai mari animale”, „periculoase în România” | P1 | 1 zi + completare verificată |

## 7. Modelul de URL pentru tipurile noi

- Comparații: `/comparatie/{a}-vs-{b}`, slug-uri în ordine alfabetică sau după popularitate, cu 301 de la forma inversă (`golden-retriever-vs-labrador` → `labrador-vs-golden-retriever`).
- Liste: `/liste/{slug}` (existent), nu duplicăm în `/rase/*`.
- Unelte: `/instrumente/{slug}`.
- Boli/simptome: păstrăm `/sanatate/{tip}/{slug}`. Nu migrăm la `/caini/boli/...` (decizia anterioară era deschisă; structura actuală funcționează și are 25 de URL-uri deja indexabile).
- Animale mici: `/animale-mici/{specie}/{slug}` abia după 6 articole.
