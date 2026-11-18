# Foaie de parcurs de implementare — divet.ro, 17 noiembrie 2026

4 faze: Fundație (săpt. 1–4, 18.11–15.12), Extindere (săpt. 5–12, 16.12–09.02/16.02), Scalare (săpt. 13–24, până la ~04.05.2027), Autoritate (luni 7–12, mai–noiembrie 2027). Calendarul de conținut (25.11–16.02) este în `CONTENT-CALENDAR.md`. **Estimările de trafic sunt estimări**, baseline-ul trebuie citit din GSC în prima săptămână.

## 1. Ce e făcut, ce e deschis (din planurile din 03–04.11, verificat live 17.11)

| Element | Stare |
|---|---|
| F0 (reparații tehnice): ItemList home, Article schema (image absolut, logo, `@id`), meta învechite, H2 pe tip de entitate, RSS discoverable, `llms-full.txt`, microcache nginx | **Făcut** |
| F0.1 redirecturi legacy | **Parțial** (unele 308 funcționează; `/articole/boala-addison-la-caine` 404). Lipsește exportul GSC |
| F0.9 etichete | **Deschis** (diacritice OK; subțiri, meta generic) |
| F0.14 slug-uri umplute (3) | **Deschis** |
| F1.1 recenzor | **Deschis — blocant** |
| F1.2–F1.5 model/schema/pagini | **Făcut în cod/pagini** (`MedicalWebPage`, `/echipa`, `/politica-editoriala`), `reviewedBy` nepopulat |
| F1.6 gate de publicare | **Deschis** (decizie) |
| F2 sănătate | 25/≈40 la 31.12 |
| F3 instrumente | 2/9 |
| F4 comparații/liste/glosar | hub comparații gol; 3/8 liste; glosar live |
| F5.1 GSC/Bing | **Deschis — blocant** |
| F5.2 sociale/`sameAs` | **Deschis** |
| F5.4 GEO | prompturi gata, nemăsurat |

## 2. Decizii cerute utilizatorului

| # | Decizie | Termen | Efect dacă lipsește |
|---|---|---|---|
| D1 | Acces GSC (domeniu) + Bing Webmaster | 18.11 | Nu putem prioritiza; baseline lipsă |
| D2 | Recenzor veterinar (nume, CMVRO, contract) | 24.11 | Sănătatea rămâne „în curs de revizuire”; `/echipa` reformulat |
| D3 | Gate sănătate: publicare doar cu `reviewedBy` după 01.01.2027 | 24.11 | Nerecomandat să publicăm nerevizuit |
| D4 | Cache/index sitemap pe nginx și în app | 25.11 | Sitemap lent la prima cerere (56 s observat) |
| D5 | Profiluri sociale + `sameAs` | 30.11 | Fără semnale de brand |
| D6 | Categorie nouă `sanatate/ingrijire` (sterilizare, microcipare, prima vizită) sau extindere `parazitologie`/`vaccinare` | 30.11 | Articole fără locație; risc de canibalizare cu `caini/sanatate` |
| D7 | Cadență: 2/zi (recomandat) vs 4/zi | 24.11 | Cu 4/zi crește rata de erori (est.) |

## 3. Faza 1 — Fundație (18.11 – 15.12, săpt. 1–4)

**Obiectiv:** măsurare, igienă de indexare, recenzor, viteză. Nicio creștere de volum până nu există baseline.

| Săpt. | Sarcină | Livrabil / acceptare | Cine |
|---|---|---|---|
| 1 | GSC + Bing: verificare, trimitere sitemap, export 28 de zile (interogări, pagini, acoperire, 404, linkuri) în `docs/seo/gsc/2026-11-xx/` | Baseline de impresii/clickuri/indexare scris în KPI | utilizator + agent |
| 1 | `/comparatie` → `noindex,follow` până la 3 comparații | Meta robots prezent; ieșire din meniu dacă e cazul | agent |
| 1 | Sitemap: cache 5–10 min, invalidare la publicare; `lastmod` real; fără `priority`/`changefreq` | TTFB `sitemap.xml` < 500 ms rece; test `curl` × 3 | agent (cod) |
| 1 | Etichete: `noindex` + ieșire din sitemap sub 8 postări; eliminare/redirect pentru etichetele duble cu categoriile | Sitemap −15…20 URL | agent |
| 1 | Titluri cu sufix dublat | 0 titluri cu „| DiVet | DiVet” | agent |
| 1–2 | Redirecturi legacy: din exportul 404 GSC + Wayback CDX → `gsc-404-mapping.csv` actualizat; 301 către echivalent sau hub | 0 URL legacy cu trafic în 404; `/articole/boala-addison-la-caine` → articol sau hub | agent + utilizator |
| 1–2 | Prima măsurare GEO (30 de prompturi) | `geo-tracking.csv` completat | agent |
| 2 | Decizie recenzor → pagina `/echipa/<slug>`, `Person`+`ProfilePage`, `reviewedBy` în schema; backlog de recenzie (38 de articole) | Primul lot de 10 articole cu „Revizuit medical” | utilizator + agent |
| 2 | Organization: logo static PNG, `sameAs`, `contactPoint`; `publisher.logo` din fișier stabil | Rich Results Test fără avertismente pe 3 articole | agent |
| 2 | `robots.txt`: reguli explicite pentru boții AI + linie llms.txt | Verificat live | agent |
| 2 | Texte de categorie noi (≥ 5): `salbatice/rapitoare`, `fauna-romaniei`, `specii-protejate`, `sanatate/urgente`, `/comparatie` | `category-content.ts` + teste de invarianți | agent |
| 2–3 | Câmpuri noi (`naparleste`, `greutate_max_kg`, `pericol`) + completare verificată pe fișele existente | Seed idempotent; valori cu sursă | agent |
| 3 | `lib/related.ts` + oprirea `.backlinks.cjs`; `scripts/link-audit.ts` | Test pe scoruri; 0 link spre nepublicat; raport orfani | agent |
| 3 | Core Web Vitals: măsurare PageSpeed/CrUX pe 6 șabloane (fișă, hub, listă, instrument, sănătate, home); CLS din reclame | Tabel CWV în `docs/seo/` | agent |
| 3 | Mega-menu mai subțire; verificarea alt-urilor duplicate pe carduri | HTML home < 150 KB | agent |
| 4 | Profiluri sociale create și legate; prima postare/săptămână | `sameAs` în Organization | utilizator |
| 4 | Pagina `/corecturi` + jurnal | Publicată, linkată în footer și `/politica-editoriala` | agent |
| 4 | Raport de fază: GSC la 4 săptămâni, indexare, 404, CWV | `docs/seo/2026-12-15-faza1.md` | agent |

**Succes Faza 1:** baseline în GSC; sitemap < 500 ms; 0 404 critice; ≥ 10 articole de sănătate revizuite; etichete și `/comparatie` fără risc de bloat.

## 4. Faza 2 — Extindere (16.12 – 16.02, săpt. 5–12)

**Obiectiv:** 166 de pagini noi după calendar, comparații/liste/instrumente, 100% sănătate revizuită.

| Sarcină | Detalii | Termen |
|---|---|---|
| Producție de conținut | Calendarul pe săptămâni (2/zi) | 16.02 |
| Comparații: 12 pagini, `ComparisonTemplate` | Hub indexabil la a 3-a; tabel generat din spec grid | 06.01 |
| Liste: +8 (inclusiv „năpârlesc puțin” cu câmp nou) | Prag ≥ 8; intro 150–250 de cuvinte | 28.01 |
| Instrumente: +4 (vârsta pisicii, porția de hrană, calendar vaccinare, BCS) | Formule testate (Vitest), surse primare, `WebApplication` | 09.02 |
| Glosar: de la ~40 la 150 de termeni | Autolink la prima apariție | 12.02 |
| Recenzie medicală: 100% | 38 de articole vechi + 36 noi; gate activ din 01.01 | 31.01 |
| Subcategorii noi | `fauna-romaniei`, `specii-protejate`, `rapitoare`, `sanatate/ingrijire`, `animale-mici` (la 6 articole) | 15.12 (cod) |
| Linking | 0 orfane, ≥ 4 linkuri primite per articol | 31.12 |
| Slug-uri: 3 redenumiri cu 301 (doar dacă GSC arată impresii mici) | `/caini/rase/labrador-retriever` etc. | 15.01 |
| Măsurare GEO lunară | 20.12, 20.01, 20.02 | lunar |
| Outreach pasiv | Registru de linkuri sperate (cluburi de rasă, adăposturi, asociații) | 31.01 |
| Raport 3 luni | KPI vs țintă, ajustare plan | 16.02 |

**Succes Faza 2:** ~270 de articole; ≥ 85% indexate; 12 comparații, 11 liste, 6 unelte; 0 articole de sănătate fără revizuire; prima citare AI măsurată; CWV „bun” pe ≥ 75% din URL-uri.

## 5. Faza 3 — Scalare (17.02 – ~04.05.2027, săpt. 13–24)

**Obiectiv:** a doua generație de conținut din date reale GSC, linkuri și AI.

- **Conținut:** +~150 de pagini la 2–3/zi: rase (de la 65 la ~100 câini, 31 la ~45 pisici), animale mici (hub `/animale-mici`), faună (`insecte-comune`, păsări marine până la 6), boli de pe lista ghidulvet încă neacoperite, comparații la ~30. Prioritate pe interogări din GSC (impresii > 100, poziție 8–25 → actualizare/extindere, nu pagini noi).
- **Optimizare pe date reale:** pagini cu > 200 de impresii și CTR < 1% → rescriere title/meta; pagini în poziții 5–15 → extindere cu FAQ, imagine proprie, link intern; pagini cu 0 impresii la 90 de zile → consolidare/redirect.
- **Linkuri:** campanii țintite (nu cumpărare): cluburi de rasă și asociații cinofile/feline, adăposturi (ghiduri de adopție ca resursă), școli/profesori de biologie (fișe de faună), medici veterinari parteneri (recenzor ca portavoce), infografice „ce nu are voie câinele să mănânce”, un set de date deschis (`Dataset`: talie/greutate/longevitate pe rase) cu licență. Țintă: +40 de domenii de referință la 6 luni (est.).
- **GEO:** măsurare lunară 75 de prompturi; pagini de răspuns-scurt pentru prompturi necitate; verificarea corectitudinii răspunsurilor AI despre DiVet; mențiuni de brand în comunități (grupuri FB, Reddit RO, forumuri) fără spam.
- **Tehnic:** sitemap index finalizat, `llms-full` pe secțiuni dacă > 2 MB, validare periodică de schema (Rich Results Test), monitorizare TTFB p95, test de stres pe publicarea în rafală.
- **Monetizare:** test de plasamente AdSense (după CWV): nu adăugăm reclame care ridică CLS peste 0,1.
- **Newsletter** (API existent): pagină de înscriere + ghid PDF gratuit „5 alimente periculoase”; scop: trafic direct.

**Succes Faza 3:** ~420 de articole; ≥ 700 de cuvinte-cheie în top 10 (est.); ≥ 8/30 de prompturi cu citare AI; 40 de domenii noi.

## 6. Faza 4 — Autoritate (mai – noiembrie 2027)

- **Seria de autor/recenzor:** interviuri cu medici veterinari, „Ce întreabă proprietarii” (de la întrebările reale din GSC/AnswerThePublic-RO).
- **Conținut original:** sondaje proprii (ex. „anul câinelui în România” — nume, rasă, vârstă; fără date personale), statistici proprii pe fișe (sănătate raportată), imagini proprii; aceasta este singura categorie citată frecvent de AI.
- **PR și presă:** comunicate către presă locală (ex.: lansarea glosarului/fișelor românești), colaborare cu o universitate/școală de medicină veterinară (USAMV) — dacă recenzorul o poate facilita.
- **Schema avansată:** `Taxon`/`about` pe fauna, `Dataset`, `VideoObject` (doar dacă avem video), `ProfilePage` pentru fiecare recenzor, `reviewedBy` peste tot în sănătate.
- **Video/social:** YouTube Shorts pentru faună (reutilizând fișele); Pinterest pentru rase (vertical); sunt canale de brand, nu de trafic principal.
- **Actualizare:** ciclu de revizuire la 6 luni (sănătate), 12 luni (rase), cu `dateModified` real și jurnal public.
- **Diversificare:** animale mici/păsări/exotice dacă SERP-urile arată cerere; evaluarea unui director local doar dacă are date verificate și valoare reală (rămâne `noindex` până atunci).

**Succes Faza 4:** ~700 de articole; 100% sănătate revizuită la zi; ≥ 30% citare AI pe 75 de prompturi; trafic organic 3–4× față de luna 6 (est.).

## 7. Tabel de KPI (baseline = observabil)

| Metric | Baseline 17.11.2026 | 3 luni (28.02.2027) | 6 luni (31.05.2027) | 12 luni (30.11.2027) |
|---|---|---|---|---|
| Sesiuni organice / lună | necunoscut (GSC lipsă; est. < 3.000) | est. 8.000–25.000 | est. 40.000–90.000 | est. 150.000–350.000 |
| Cuvinte-cheie în top 10 | necunoscut | ≥ 150 (est.) | ≥ 700 | ≥ 3.000 |
| URL-uri în sitemap | 157 | ~330 | ~520 | ~900 |
| Pagini indexate | necunoscut | ≥ 85% din sitemap | ≥ 90% | ≥ 90% |
| Articole publicate | ~104 | ~270 | ~420 | ~700 |
| Articole sănătate cu `reviewedBy` | 0/25 | 100% | 100% | 100% |
| Domenii de referință noi | necunoscut | +15 | +40 | +120 |
| Citări AI (prompturi/total) | 0/30 (nemăsurat) | ≥ 3/30 | ≥ 8/30 | ≥ 30% din 75 |
| TTFB `sitemap.xml` | ~56 s la prima cerere | < 500 ms | < 500 ms | < 500 ms |
| TTFB p95 pagini | 0,3–0,9 s cald; până la 25 s rece | < 1 s | < 800 ms | < 600 ms |
| CWV (LCP/INP/CLS, câmp) | nemăsurat | „bun” pe ≥ 75% | ≥ 80% | ≥ 85% |
| Pagini orfane | de măsurat | 0 | 0 | 0 |
| RPM AdSense / sesiuni pe pagină | necunoscut | de înregistrat | +10% vs 3 luni | +25% |

## 8. Resurse

| Resursă | Faza 1 | Faza 2 | Faza 3–4 |
|---|---|---|---|
| Agent de cod (Sonnet), PR-uri mici | ~6–8 zile | ~4–5 zile | ~3 zile/lună |
| Agent de conținut | 14 pagini/săpt. | idem | 14–21/săpt. |
| Recenzor veterinar | contractare; 10 articole | 64 de articole + 14 noi/lună | 8–12 articole/lună |
| Utilizator (decizii, conturi, aprobări deploy) | ~3 h/săpt. | ~2 h/săpt. | ~2 h/săpt. |
| Tool-uri | GSC, Bing (gratuite); opțional tracker rank RO | idem | opțional DataForSEO/Ahrefs |
| Buget plătit | recenzor (negociat); fără alte cheltuieli obligatorii | idem | opțional link-building PR |

## 9. Dependențe și riscuri (rezumat)

- **D1 și D2 blochează** măsurarea și credibilitatea sănătății.
- Aprobarea deploy-ului și a modificărilor nginx rămâne la utilizator (conform runbook-ului existent); agentul nu face deploy.
- Fără exportul GSC, F0.1 (legacy) și prioritizarea rămân parțial în orb.
- Dacă recenzia nu ține ritmul: reducem sănătatea la 2/săpt., nu publicăm nerevizuit.
- Dacă CWV pică din cauza reclamelor: limităm Auto ads pe șabloanele cu CLS > 0,1.
- Dacă indexarea este < 70% la 60 de zile: oprim extinderea, auditam calitatea (praguri) și consolidăm.

## 10. Verificări de rutină (lunar)

1. GSC: impresii, CTR, pagini fără impresii, acoperire, 404, linkuri.
2. `scripts/link-audit.ts`: orfane, < 4 linkuri.
3. `suggest.ts` → diferențe față de luna trecută în `research/`.
4. GEO: 75 de prompturi, `geo-tracking.csv`.
5. Rich Results Test pe 5 șabloane.
6. PageSpeed/CrUX pe 6 șabloane.
7. TTFB: `curl` × 3 pe `/`, hub, articol, `sitemap.xml`.
8. Corecturi: jurnal public actualizat.
