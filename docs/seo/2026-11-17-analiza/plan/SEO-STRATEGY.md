# Strategie SEO divet.ro — 17 noiembrie 2026

Șablon folosit: `publisher.md` (publisher/media, monetizare AdSense). Plan construit peste `docs/seo/2026-11-03-ghidulvet/*`, `docs/seo/2026-11-04-f4/PLAN-F4.md`, `keyword-map.csv`, `research/keywords-2026-11-05.csv` și `AI_CONTENT_GUIDE.md`.

> **Limite de metodă.** Nu am avut acces la Search Console, Bing Webmaster sau Ahrefs. Tot ce ține de trafic, volume și autoritate este **estimare** (marcată „est."). Observațiile despre site vin din cel mult ~40 de cereri HTTP publice făcute pe 17.11.2026 (sitemap, robots, 20 de pagini eșantion, `llms.txt`, `llms-full.txt`, `feed.xml`, câteva redirecturi). Pozițiile reale nu sunt cunoscute.

---

## 1. Discovery

| | |
|---|---|
| Tip | Publisher / enciclopedie online, monetizat prin AdSense (Auto ads), operator Uppley SRL, brand DiVet |
| Public | Proprietari și viitori proprietari de câini/pisici din România; curioși de faună (marine, insecte, sălbatice); persoane în situații de urgență („câinele a mâncat ciocolată”) |
| Obiectiv de business | Trafic organic recurent (căutări informaționale) → RPM AdSense; secundar: citări în răspunsurile AI (brand) |
| Avantaje | Domeniu din 2007, enciclopedie structurată (aceleași câmpuri pe fiecare fișă → comparații și liste generate), SERP-uri românești goale pe faună, tehnologie proprie (CMS) |
| Dezavantaje | Brand relansat din octombrie 2026, conținut AI-asistat fără recenzor uman, 0 recenzor veterinar, 0 profiluri sociale, 0 backlink-uri măsurabile, fără date de Search Console |
| Constrângeri | Capacitatea de a verifica sursele (calitatea scade peste ~2 articole/zi), YMYL la sănătate, un singur operator tehnic |

## 2. Starea curentă (baseline observat, 17.11.2026)

### 2.1 Cifre

- **Sitemap: 157 URL-uri** (de la 63 pe 03.11), un singur fișier, toate cu `lastmod`/`changefreq`. Compoziție (estimare din structura URL-urilor): ~104 articole, 17 hub-uri de categorie, **20 de pagini de etichetă**, 3 liste filtrate + `/liste`, 3 pagini de instrumente (hub + 2 unelte), `/glosar`, `/index-a-z`, `/echipa`, `/politica-editoriala`, `/politica-confidentialitate`, `/despre-noi`, `/autor/redactia`, home.
- **Articole pe secțiuni** (din URL-uri): rase de câini 29, rase de pisici 19, sănătate 25 (substanțe toxice 8, simptome 7, boli 5, parazitologie 3, vaccinare 2), marine 15 (mamifere 5, rechini și pești 5, nevertebrate 4, păsări marine 1), insecte 9 (gândaci 6, exotice 3), sălbatice/mamifere 7.
- `robots.txt`: `Allow /`, `Disallow /admin/ /api/ /_next/`, 2 sitemap-uri (articole + imagini); fără reguli pentru boții AI (toți permiși).
- `llms.txt` 200 (1,3 KB), **`llms-full.txt` 200 (611 KB)**, `feed.xml` 200 și **`<link rel="alternate" type="application/rss+xml">` prezent** în `<head>`, `sitemap-images.xml` 200, `ads.txt` 200.

### 2.2 Eșantion de pagini (cereri la 17.11.2026)

| Pagină | Title (lung.) | Meta (lung.) | H1 | Cuvinte* | Schema (tipuri) | Linkuri ext. |
|---|---|---|---|---|---|---|
| `/` | „DiVet – Enciclopedia animalelor din România” (43) | 132 | 1 | ~650 | Organization(+logo), WebSite+SearchAction, CollectionPage+ItemList, FAQPage | 0 |
| `/caini/rase` (hub) | 51 | 149 | „Rase de câini” | ~615 | WebSite, BreadcrumbList, CollectionPage, FAQPage | 0 |
| `/caini/rase/labrador-rasa-caini-caracteristici` | 55 | 142 | 1 | **~2.200**, 26 H2 | WebSite, Breadcrumb, Article, FAQPage, Speakable | 3 |
| `/pisici/rase/maine-coon` | 47 | 148 | 1 | ~1.310, 17 H2 | idem | 1 |
| `/marine/mamifere-marine/balena-cu-cocoasa` | 50 | 151 | 1 | ~1.220, 19 H2 | idem | 3 |
| `/insecte/gandaci/buburuza` | 55 | 144 | 1 | ~1.030, 14 H2 | idem | 3 |
| `/sanatate/boli/parvoviroza-la-caini` | 51 | 154 | 1 | ~1.270, 11 H2 | Article + **MedicalWebPage**, MedicalCondition, Audience, FAQPage | 10 |
| `/sanatate/simptome/cainele-vomita` | 46 | 134 | 1 | ~1.270 | Article + MedicalWebPage, MedicalSignOrSymptom, FAQPage | 3 |
| `/liste/rase-de-caini-mari` | 47 (sufix „| DiVet” dublat în „lista fișelor DiVet | DiVet”) | 127 | 1 | ~540 | CollectionPage, ItemList, FAQPage, Breadcrumb | 0 |
| `/instrumente/varsta-caine` | 36 | 126 | 1 | ~420 | WebApplication, FAQPage | 2 |
| `/glosar` | 49 | 147 | 1 | ~960 | DefinedTermSet + DefinedTerm | 9 |
| `/eticheta/gandaci` | „Gândaci | DiVet” (15) | „Articole etichetate cu Gândaci” (30) | 1 | **~83** | CollectionPage + ItemList | 0 |
| `/comparatie` | 39 | 150 | 1 | ~240 | doar FAQPage | 0 |
| `/echipa` | 20 | 107 | 1 | **~106** | WebPage | 0 |

\* Cuvinte numărate din `<main>`, aproximativ; paginile au ~100–110 linkuri interne, dar majoritatea sunt din meniul mare (mega-menu) repetat pe fiecare pagină.

### 2.3 Ce s-a rezolvat de la auditul din 03.11 (verificat live)

| Element din plan | Stare |
|---|---|
| F0.2 ItemList home cu URL-uri corecte | **Făcut** (URL-urile sunt acum `/pisici/rase/russian-blue`, `/marine/...`) |
| F0.3 Article schema: `image.url` absolut, `publisher.logo`, author cu `@id`, `dateModified` real | **Făcut** (parțial: logo = `https://divet.ro/opengraph-image`, o imagine dinamică, nu un fișier logo stabil) |
| F0.4 / F0.5 „Actualizat” și meta învechite | **Făcut** (data se afișează; meta home: „câini, pisici, animale marine, insecte și specii sălbatice”) |
| F0.6 H2 pe tip de entitate | **Făcut pentru faună** („Caracteristici”); rămâne „Caracteristicile rasei” doar la rase (corect) |
| F0.8 RSS discoverable, F0.13 `llms-full.txt` | **Făcut** |
| F0.12 microcache nginx | **Făcut** (`X-Cache-Status: HIT/MISS` vizibil; `Cache-Control` rămâne `no-store` către client, ceea ce e în regulă pentru HTML) |
| Redirecturi legacy (F0.1) | **Parțial**: `/caini/boston-terrier` → 308 `/caini/rase/boston-terrier`; `/caini/labrador-retriever` → 308; dar `/articole/boala-addison-la-caine` încă 404. Fără export GSC nu știm câte sunt |
| F1.3 `MedicalWebPage` pe sănătate | **Făcut**, dar **fără `reviewedBy`/`lastReviewed`** (nu există recenzor) |
| F1.5 `/echipa`, `/politica-editoriala` | **Făcute**; `/echipa` are ~106 cuvinte și descrie un proces de recenzie care nu are încă un om în spate |
| F2 sănătate | 25 de articole live (din ~40 țintă la 31.12) |
| F3 instrumente | 2 din 9 live (`varsta-caine`, `aliment-periculos`) |
| F4 comparații | Hub `/comparatie` live **fără nicio comparație**; prima (labrador vs golden) programată ~22.11 |
| F4 liste | 3 din ~8 (rase mari, cele mai inteligente, pisici liniștite) |
| F4.5 glosar | **Live** (DefinedTermSet, ~960 cuvinte); țintă 150 de termeni, acum probabil ~40 (est.) |
| F0.9 tag-uri | **Diacriticele sunt corecte, dar paginile rămân subțiri** (~83 de cuvinte, meta generic) |
| F0.14 slug-uri umplute | **Deschis**: 3 slug-uri (`labrador-rasa-caini-caracteristici`, `bichon-frise-rasa-caini-caracteristici`, `golden-retriever-caracteristici-temperament`) |
| F5.1 GSC/Bing | **Deschis** (blocant) |
| F5.2 profiluri sociale / `sameAs` | **Deschis** (Organization fără `sameAs`) |
| F5.4 măsurare GEO | Setul de 75 de prompturi există; `geo-tracking.csv` gol |

### 2.4 Probleme noi sau încă deschise (prioritare)

1. **Timp de răspuns la cald/rece.** Prima cerere către `/sitemap.xml` a durat **~56 s**; prima cerere către `/` a durat **~25 s** în total (TTFB 2,5 s, restul transfer lent). Cererile următoare: 0,26–0,9 s. Dacă Googlebot primește un sitemap care răspunde în 56 s, descoperirea de URL-uri este afectată. `sitemap.xml` este `force-dynamic` (interogări pe tot site-ul la fiecare cerere).
2. **Pagini subțiri indexabile.** 20 de etichete (13% din sitemap), cu intro ~80 de cuvinte și meta generic „Articole etichetate cu X”; unele dublează o categorie (`/eticheta/gandaci` ≈ `/insecte/gandaci`; `/eticheta/mamifere-marine` ≈ `/marine/mamifere-marine`; `/eticheta/rase-mici` vs viitoarea listă „rase de câini mici”). Risc de canibalizare și de „pagini cu valoare mică”.
3. **`/comparatie` este 200, fără `canonical` și fără `noindex`**, cu 0 comparații (doar FAQ + meniu). Nu e în sitemap, dar e crawlabilă și linkată din meniu. Trebuie `noindex,follow` până apare a treia comparație.
4. **Autoritate medicală: zero.** 25 de articole de sănătate au `MedicalWebPage` fără `reviewedBy`; pagina `/echipa` promite „articole revizuite de un medic veterinar”. Ghidul Vet are aceeași problemă, dar noi putem fi singurii cu recenzor real.
5. **Amprentă de șablon.** Fișele de rase repetă 17–26 de H2 identice între ele (Pe scurt, Caracteristicile rasei, Profil comportamental, …). Util pentru GEO, dar în volum (50+ fișe) crește riscul „conținut produs la scară”. Variabilitatea trebuie să vină din date și secțiuni specifice rasei (labrador are 26 H2 cu secțiuni proprii, e modelul bun).
6. **Titluri cu sufix dublat** pe unele pagini (`... | DiVet | DiVet`).
7. **Logo-ul Organization** este URL-ul dinamic `/opengraph-image`; `sameAs` lipsește.
8. **Linkuri externe la 0** pe hub-uri și pe `/` (acceptabil), dar 1 singur link extern pe Maine Coon (țintă ≥3 surse primare).

## 3. Viziune și poziționare

> **DiVet = enciclopedia în română a animalelor, cu date comparabile, surse primare linkate și, pe sănătate, recenzie veterinară reală.**

Nu concurăm pe:
- directoare locale (ghidulvet.ro: ~11.800 de URL-uri programatice) — rămâne `noindex`/ascuns;
- știri și lifestyle (stirileprotv, bzi, playtech) — nu avem cadență de știri;
- comerț („preț pui”, „de vânzare”) — intenție pe care nu o putem servi onest.

Concurăm și putem câștiga pe:
1. **Faună (marine, insecte, sălbatice) și rase rare** — SERP-uri românești slabe (ex. pentru balena cu cocoașă, rechin taur, insecta-băț; verificat parțial în 03.11, de revalidat cu GSC).
2. **Comparații și liste generate din date** (X vs Y, „rase pentru apartament”) — nimeni din setul competitiv nu le are structurate.
3. **Sănătate cu recenzor + surse linkate + triaj de urgență** — ghidulvet.ro este anonim, cu Organization ca autor.
4. **Instrumente** cu sursă primară (vârsta câinelui, aliment periculos, apoi porție, calendar) — ghidulvet are 15, noi 2.
5. **Pregătire pentru AI search** (llms.txt, llms-full.txt, FAQ, speakable, tabele, răspuns direct): infrastructura există, lipsește recenzorul și semnalele de brand.

## 4. Principii (reguli de decizie)

1. **Nicio pagină fără sursă și fără valoare unică**: o pagină nouă intră în sitemap doar dacă trece pragurile (fișă ≥ 800 cuvinte, listă ≥ 8 intrări, comparație ≥ 300 cuvinte originale, categorie ≥ 3 articole pentru indexare).
2. **Calitate înaintea cadenței**: 2 pagini/zi în medie (14/săptămână), nu 4/zi. În următoarele 12 săptămâni, verificarea manuală (eșantion 25%) este constrângerea.
3. **Sănătatea (YMYL) se publică doar cu recenzor** după 31.12.2026 (vezi §6.1). Până atunci: eticheta „în curs de revizuire”, fără doze, fără diagnostic.
4. **Un URL țintă per intenție** (`keyword-map.csv`), anti-canibalizare între fișă, listă, comparație, etichetă.
5. **Măsurăm ce contează pentru un publisher AdSense**: sesiuni organice, pagini/sesiune, RPM, CWV (CLS din reclame), citări AI — nu doar poziții.
6. **Fără cifre inventate** (prețuri, doze, prevalențe): rămân `blocked` în `keyword-map.csv`.

## 5. Piloni de conținut (7) și rolul fiecăruia

| # | Pilon | Rol SEO | URL rădăcină | Stare acum | Țintă 16.02.2027 |
|---|---|---|---|---|---|
| 1 | Rase de câini | Volum (head + long tail), linkuri către sănătate | `/caini/rase` | 29 | 65 |
| 2 | Rase de pisici | Volum | `/pisici/rase` | 19 | 31 |
| 3 | Sănătate (boli, simptome, toxice, vaccinare, paraziți, urgențe) | Trafic mare + E-E-A-T | `/sanatate/*` | 25 | ~60 |
| 4 | Faună (marine, insecte, sălbatice) | Monopol în română, long tail | `/marine`, `/insecte`, `/salbatice` | 31 | ~80 |
| 5 | Comparații și liste | Intenție de decizie, linkuri interne | `/comparatie`, `/liste` | 0 + 3 | 12 + 11 |
| 6 | Instrumente | Link-bait, citări AI | `/instrumente` | 2 | 6 |
| 7 | Referință (glosar, index A–Z) | Entități, linkuri contextuale | `/glosar`, `/index-a-z` | glosar ~40 termeni (est.) | 150 termeni |

Animale mici de companie (iepure, hamster, cobai, papagal, țestoasă, gecko) sunt o **extensie a pilonului 1/3** și nu un pilon propriu; intră abia când `/caini` și `/pisici` au fiecare ≥ 3 sub-hub-uri cu conținut (vezi `SITE-STRUCTURE.md`).

## 6. E-E-A-T — planul

### 6.1 Recenzorul veterinar (cea mai mare lacună, prioritate P0)

Starea: `/politica-editoriala` și `/echipa` există; schema `MedicalWebPage` există; câmpul `reviewedBy` există în plan (F1.2) dar nu e populat. Nu există niciun nume uman pe site. Candidatul menționat în planul F4 nu este confirmat.

Acțiuni:
1. **Decizie până pe 24.11.2026**: recenzor numit (DMV cu drept de liberă practică, număr CMVRO) — contract de colaborare cu tarif pe articol sau pe lot (nu fixez sume; de negociat).
2. Brief de lucru (1 pagină): ce verifică (afirmații medicale, avertismente, „când mergi la veterinar”, absența dozelor), SLA (≤ 5 zile lucrătoare/lot de 10), cum se marchează („Revizuit medical de Dr. X, [data]”).
3. Pagina `/echipa/<slug-recenzor>`: nume, poză, CMVRO, specializare, bio, link către profil profesional (`sameAs`), articole revizuite; schema `Person` + `ProfilePage`, `hasCredential`.
4. Schema: `MedicalWebPage.reviewedBy` (Person cu `@id`), `lastReviewed`, vizibil în pagină (aceeași dată).
5. **Backlog de recenzie**: cele 25 de articole existente + 13 programate (lotul 1 sănătate) = ~38 de articole de revizuit în 4–6 săptămâni; prioritate: boli (5), toxice (8), simptome (7), vaccinare/paraziți (5).
6. **Gate de publicare** (decizie F1.6): după 31.12.2026, `status=published` pentru categoria `sanatate` doar cu `reviewedBy`. Până atunci: eticheta „Informații orientative, în curs de revizuire medicală” deasupra articolului și fără `lastReviewed`.
7. **Nu afirmăm recenzie care nu s-a făcut.** Dacă recenzorul nu e confirmat până la 15.12, `/echipa` trebuie reformulată („nu avem încă recenzor”) — mai bine decât o promisiune goală.

### 6.2 Alte semnale

| Semnal | Acum | Acțiune |
|---|---|---|
| Autor | „Redacția DiVet” (Person + ProfilePage, AI declarat) | Păstrăm transparența AI; adăugăm autori umani doar real (recenzor, un editor/biolog dacă există) |
| Organization | logo dinamic, fără `sameAs`, fără contact | Logo static (PNG ≥ 112×112), `sameAs` (Facebook, Instagram, Pinterest, YouTube, LinkedIn Uppley), `contactPoint`, `publishingPrinciples` → `/politica-editoriala` |
| Corecturi | menționate în `/despre-noi` | Pagină `/corecturi` cu jurnal public (data, ce s-a corectat) |
| Surse | 1–10 linkuri externe/articol | Minim 3 surse primare/articol (FCI, IUCN, Merck Vet Manual, WSAVA, AAHA, ASPCA APCC, ANSVSA, articole Cell/PLOS); fără Wikipedia ca singură sursă |
| Experiență directă | 0 | Imagini proprii (min. 1/săptămână: fotografii din adăposturi/colaborări), citate din recenzor în articolele de sănătate |
| Dată | „Actualizat” afișat, `dateModified` real | Revizuire programată la 6 luni pentru sănătate, 12 luni pentru rase |

## 7. Strategia de AI search (GEO)

Infrastructura este peste media pieței (llms.txt + llms-full.txt, FAQ, speakable, tabele, TL;DR). Ce lipsește:
1. **Semnale de brand off-site**: 0 mențiuni verificate, 0 profiluri. Fără ele, citările AI vor merge la Royal Canin RO și la portalurile de știri.
2. **Recenzor** (modelele de AI preferă sursele medicale cu autor identificabil).
3. **Măsurare**: `geo-tracking.csv` este gol. Prima rundă (30 de prompturi de bază) în săptămâna 25.11, apoi lunar. Țintă: ≥ 5/30 citate până în februarie 2027 (în planul existent), ≥ 20% pe 60 de prompturi la 31.12 este ambițios; recomand **10% la 28.02.2027** ca țintă realistă pentru un brand de o lună.
4. **robots.txt**: politică explicită pentru GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended (permis) și linie `# llms.txt`; acum e doar wildcard.
5. **llms-full.txt la 611 KB**: bine, dar de împărțit pe secțiuni (`/llms-full-sanatate.txt` etc.) dacă depășește ~2 MB.

## 8. KPI (baseline = ce se poate observa)

| Metric | Baseline (17.11.2026) | 3 luni (28.02.2027) | 6 luni (31.05.2027) | 12 luni (30.11.2027) |
|---|---|---|---|---|
| Sesiuni organice / lună | **necunoscut** (GSC lipsă; est. foarte mic, < 3.000 — brand de 3 săptămâni) | de măsurat din 25.11; est. 8.000–25.000 | est. 40.000–90.000 | est. 150.000–350.000 |
| Impresii GSC / lună | necunoscut | de înregistrat | de înregistrat | de înregistrat |
| Cuvinte-cheie în top 10 | necunoscut | ≥ 150 (est., din GSC) | ≥ 700 | ≥ 3.000 |
| Pagini în sitemap | 157 | ~330 | ~520 | ~900 (cu praguri) |
| Pagini indexate (GSC „Indexate”) | necunoscut (de citit în GSC) | ≥ 85% din sitemap | ≥ 90% | ≥ 90% |
| Articole publicate | ~104 | ~270 | ~420 | ~700 |
| Articole de sănătate cu `reviewedBy` | 0 / 25 | 100% din cele publicate | 100% | 100% |
| Comparații live | 0 (prima ~22.11) | 12 | 30 | 60 |
| Liste filtrate live | 3 | 11 | 16 | 25 |
| Instrumente | 2 | 6 | 9 | 12 |
| Termeni în glosar | ~40 (est.) | 150 | 250 | 400 |
| Domenii care trimit link (est.) | necunoscut (domeniu din 2007; de citit din GSC/Bing) | +15 noi | +40 | +120 |
| Citări AI (din 30 de prompturi) | 0 măsurat | ≥ 3/30 | ≥ 8/30 | ≥ 30% pe 75 |
| TTFB p95 (rece, URL tipic) | 2,5–25 s observat la prima cerere; 0,3–0,9 s cald | < 1 s | < 800 ms | < 600 ms |
| `sitemap.xml` TTFB | ~56 s la prima cerere | < 1 s | < 500 ms | < 500 ms |
| CWV (LCP/INP/CLS, câmp CrUX) | nemăsurat (necesită GSC/CrUX) | LCP < 2,5 s, INP < 200 ms, CLS < 0,1 pe ≥ 75% din URL-uri | idem | idem |
| Pagini orfane | de măsurat (`scripts/link-audit.ts`) | 0 | 0 | 0 |

Estimările de trafic sunt calibrate prudent pentru un site cu ~100–300 de pagini enciclopedice în nișe cu SERP slab; **se înlocuiesc cu date reale în prima săptămână după accesul la GSC**.

## 9. Riscuri și măsuri

| Risc | Probabilitate | Impact | Măsură |
|---|---|---|---|
| Fără recenzor, sănătatea rămâne neîncrezătoare și riscă o evaluare YMYL slabă | Mare | Mare | §6.1; gate; reformularea `/echipa` dacă nu apare |
| Conținut AI la scară marcat ca „scaled content” | Medie | Mare | Praguri de calitate, variație prin date, 25% verificare manuală, imagini proprii, nu depășim 2/zi |
| Index bloat (etichete, liste, comparații subțiri) | Mare | Medie | Etichete `noindex` sub 8 postări, listele ≥ 8 intrări, comparații cu 300+ de cuvinte originale |
| Sitemap/pagini lente la prima cerere | Mare | Medie | Cache sitemap (60–300 s), preîncălzire după deploy, monitorizare |
| Dependența de AdSense și CLS din reclame | Medie | Medie | Slot-uri cu înălțime rezervată, Auto ads limitat, CWV în KPI |
| Imaginile din Wikimedia Commons (neunice) | Medie | Mică | Atribuire corectă, alt unic, completare cu fotografii proprii |
| Canibalizare fișă ↔ listă ↔ comparație ↔ etichetă | Medie | Medie | `keyword-map.csv`, titluri cu intenții distincte, etichete fără sitemap |

## 10. Dependențe de la utilizator (blocante)

1. **Acces Search Console (proprietate domeniu) + Bing Webmaster** — în prima zi. Export: interogări 28 zile, pagini, acoperire, 404.
2. **Recenzor veterinar** — decizie până pe 24.11.
3. **Profiluri sociale** create și linkate (30 de minute fiecare).
4. **Aprobare** pentru cache sitemap/headere (nginx) și pentru gate-ul de sănătate.
5. Export Ahrefs vechi (dacă există), pentru lista de URL-uri legacy cu trafic.
