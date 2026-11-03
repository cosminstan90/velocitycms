# divet.ro vs ghidulvet.ro — analiză și plan de execuție SEO/GEO

Data: 2026-11-03. Rapoarte brute (sursă de adevăr pentru cifre și URL-uri) în același folder:
- `ghidulvet-analysis.md` — teardown competitor (sitemap, 13 pagini analizate, topicuri)
- `divet-audit.md` — audit divet.ro live + inventar cod (cu căi de fișiere)
- `serp-geo.md` — eșantion SERP, semnale AI/GEO, redirecturi legacy

> SERP-ul din `serp-geo.md` e slab (WebSearch e US-only). Pozițiile reale se iau din Google Search Console.

---

## 1. Rezumat comparativ

| | ghidulvet.ro | divet.ro |
|---|---|---|
| Vârstă/brand | Domeniu nou (Top Guide SRL, 2026), firmă care face site-uri director în serie | Domeniu din 2007 (backlinkuri vechi), relansat 10.2026 |
| URL-uri în sitemap | 13.178, ~90% programatic local (8.978 veterinari, 2.145 farmacii, 1.511 procedură×oraș) | 63 (37 articole), ~3 articole/zi în coadă până la 20.11 |
| Conținut editorial | ~300 pagini: 55 rase, 50 ghiduri, 27 boli, 21 toxice, 11 simptome, 135 calculatoare (119 „ce poate mânca” subțiri) | 37 articole enciclopedice: rase câini/pisici + faună marină, insecte, sălbatice |
| Sănătate / veterinar | Nucleul lor: boli, simptome, toxice, urgențe, schema medicală | Aproape zero (un paragraf de ~80 de cuvinte per rasă) |
| Calculatoare | 15 (vârstă, hrană, gestație, greutate, dozare…) | 0 |
| Faună marină/insecte/sălbatice | 0 | Da, iar SERP-urile RO sunt practic goale |
| E-E-A-T | Anonim, fără medic, Organization ca autor, fără sameAs | „Redacția DiVet” (Person + ProfilePage), AI declarat, fără medic |
| Schema | Bogată: MedicalCondition/SignOrSymptom/Guideline, FAQPage, Speakable, SoftwareApplication, VeterinaryCare | Article + speakable, FAQPage, Breadcrumb, Person; are buguri (vezi F0) |
| llms.txt | 404 | Da (200); llms-full.txt 404 |
| Viteză | TTFB eratic, până la 29 s | 0,3–0,7 s cald, 4–19 s rece/în rafală, `no-store` peste tot |
| Monetizare | Afiliere eMag chiar și pe paginile medicale | AdSense |
| Puncte slabe | Pagini subțiri, erori (rase de pisici în top câini), fără date pe /boli, fără surse linkate | Legacy 404, conținut doar enciclopedic, categorii cu 1–3 articole |

### Ce au ei și nouă ne lipsește
1. **Clusterul de sănătate**: boli, simptome, toxice, „câinele a mâncat X”, vaccinare/deparazitare, urgențe. Au cele mai mari intenții de căutare.
2. **Calculatoare**: link-bait natural, pagini de unealtă citate de AI.
3. **Schema medicală** pe fiecare pagină de sănătate.
4. **Animale mici de companie**: iepure, hamster, cobai, papagal, reptile, acvariu.
5. Directorul local: **nu îl urmărim**. E jocul lor de volum și un risc de index bloat; directorul nostru rămâne `noindex`.

### Ce avem noi și ei nu au
1. Teritoriu enciclopedic fără concurență în română (marine, insecte, sălbatice, rase rare).
2. Domeniu vechi cu backlinkuri, dar le pierdem prin URL-urile legacy care dau 404.
3. Template structurat (spec grid, TL;DR, tabel comparativ, 6 FAQ, surse externe, imagini CC cu credit).
4. llms.txt, RSS, sitemap de imagini, autor Person + ProfilePage, transparență AI.
5. Un CMS propriu, deci putem adăuga orice schema sau tip de pagină.

### Strategia, într-o frază
Nu ne batem pe directorul local. Ținem monopolul enciclopedic (200+ rase, faună). Construim un cluster de sănătate **mai credibil** decât al lor (medic veterinar recenzent, surse linkate, date, `reviewedBy`). Adăugăm calculatoare mai bune și legăm rasa de bolile ei, astfel încât fiecare pagină de rasă alimentează clusterul de sănătate și invers.

---

## 2. Reguli pentru agenții Sonnet (citește înainte de orice task)

- Repo: `D:\Projects\Velocity\velocitycms`. Citește `AGENTS.md`: versiunea de Next are breaking changes, deci verifică `node_modules/next/dist/docs/` înainte de API-uri Next.
- Câte un **branch per fază** din `main` (ex. `feat/seo-f0-fixes`) și câte un PR per fază. Nu face push direct pe main. **Nu face deploy**: deploy-ul îl aprobă userul (runbook `docs/deploy-divet.ro.md`).
- Fiecare task are teste Vitest unde există logică (`npm test`), `npx tsc --noEmit` cu 0 erori și `npm run build` care trece. `typescript.ignoreBuildErrors` e `true`, deci **nu te baza pe build** pentru tipuri.
- Gotcha-uri cunoscute:
  - Rutele (frontend) sunt `force-dynamic`. `revalidate` + `generateStaticParams`/`searchParams` dă 500 **doar în producție**. Nu reintroduce ISR fără un test cu `next start`.
  - Migrații: doar `prisma migrate diff` + `migrate deploy`, niciodată `migrate dev`. Nu edita `0_init`.
  - `proxy.ts`: hostul/originea vin din `X-Forwarded-*`. Testează cu `-H 'X-Forwarded-Proto: https' -H 'X-Forwarded-Host: divet.ro'`.
  - Paginile publice nu setează cookie-uri proprii (consimțământ AdSense).
  - URL-urile postărilor se construiesc **doar** cu `buildPostPath` (care ține cont de `category.parent`).
- Smoke: `scripts/smoke.sh` împotriva `next start` înainte de PR.
- Conținut de sănătate (YMYL): nu inventa doze, statistici sau prevalențe. Fiecare afirmație medicală are o sursă linkată (Merck Vet Manual, WSAVA, AAHA, ASPCA, ANSVSA, cornell/vca). Vezi gate-ul F1.

---

## 3. Plan pe faze

Estimările sunt pentru o sesiune Sonnet per task. ⛔ = are nevoie de decizia sau acțiunea userului.

### F0 — Reparații tehnice rapide (săptămâna 1, prioritate maximă)

| # | Task | Fișiere / indicii | Criteriu de acceptare |
|---|---|---|---|
| F0.1 | **Redirecturi 301 legacy.** Construiește lista URL-urilor vechi din: Wayback CDX (`web.archive.org/cdx/search/cdx?url=divet.ro/*&output=json&fl=original&collapse=urlkey&filter=statuscode:200`), raportul de 404 din GSC ⛔ (export de la user) și exportul Ahrefs ⛔ dacă există. Mapează fiecare URL la cel mai apropiat articol sau hub nou; dacă nu există echivalent, trece-l în backlogul de conținut (nu redirecționa spre homepage). | mecanismul de legacy redirects existent (PR #14; caută `legacy` în `lib/` / `proxy.ts` / `next.config.ts`) | `/caini/labrador`, `/caini/boston-terrier` și `/articole/boala-addison-la-caine` nu mai dau 404 (301 spre o țintă relevantă sau articol nou din backlog); un test cu tabelul de mapare; CSV cu maparea în acest folder |
| F0.2 | **ItemList pe homepage**: URL-urile sunt greșite (`/rase/pisica-orientala`, `/gandaci/...` dau 404) | `app/(frontend)/page.tsx` ~L100 `postUrl()` → `buildPostPath` cu `category.parent` | Toate URL-urile din JSON-LD-ul homepage-ului dau 200; un test |
| F0.3 | **Schema Article**: `image.url` absolut, `publisher.logo` (ImageObject absolut), `author` cu `@id` spre Person-ul din ProfilePage, `dateModified` = `updatedAt` real | `lib/seo/schema-generator.ts` | Rich Results Test fără avertismente pe 3 articole; teste unitare |
| F0.4 | **„Actualizat”** gol pe unele pagini (ex. pisica-abisiniana) | `ArticleTemplate` divet | Data se afișează mereu (fallback la `publishedAt`) |
| F0.5 | **Texte învechite**: descrierile din homepage, /blog și RSS menționează „animale mici, păsări”, „de companie” | `app/(frontend)/page.tsx`, `/blog`, `app/feed.xml` | Descrieri aliniate cu „enciclopedia animalelor” (+ sănătate, după F2) |
| F0.6 | **Heading-uri pe tip de entitate**: „Caracteristicile rasei” apare pe caracatiță | template-ul / generatorul de H2 | Pentru grupurile non-rasă: „Caracteristici”, „Habitat”, „Comportament”; test pe grupuri |
| F0.7 | **/blog**: orfan indexabil fără canonical | ruta /blog | Fie canonical + legat din nav, fie `noindex,follow`; recomandat: noindex sau redirect spre `/index-a-z` |
| F0.8 | `<link rel="alternate" type="application/rss+xml">` în head | layout frontend | Prezent pe toate paginile |
| F0.9 | **Pagini de tag**: titluri cu diacritice („Câini de familie”), intro de 80–150 de cuvinte, CollectionPage + ItemList JSON-LD | rutele de tag, `lib/category-content.ts` ca model | Teste; tagurile sub 3 postări rămân noindex |
| F0.10 | **/index-a-z**: JSON-LD CollectionPage + ItemList (sau DefinedTermSet) | ruta index-a-z | Validează în Rich Results / validator.schema.org |
| F0.11 | **Header-e de securitate duplicate** (X-Frame-Options DENY vs SAMEORIGIN) din nginx + Next | `next.config.ts`; nginx e pe server ⛔ | Un singur set, emis din Next; nota pentru nginx o aplică userul |
| F0.12 | **Cache.** `no-store` pe tot HTML-ul, iar TTFB rece/în rafală ajunge la 4–19 s. Recomandare: microcache în nginx (`proxy_cache` 60 s, bypass pentru /admin, /api, cookie de sesiune), **nu** ISR (vezi gotcha) | Propunere de config nginx în `docs/` + `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` din proxy/headers pentru rutele publice ⛔ deploy nginx | Rafală de 20 de cereri concurente: p95 TTFB < 800 ms; nicio pagină admin cache-uită |
| F0.13 | **`/llms-full.txt`** (conținut text complet al articolelor publicate, generat dinamic) + **IndexNow** (cheie în `/public/{key}.txt` și ping la publicare din scheduler/publisher) | ruta llms existentă; scheduler `/api/scheduler/run` | 200 + text; ping logat la publicare |
| F0.14 | **Slug-uri umplute cu cuvinte-cheie** (ex. `bichon-frise-rasa-caini-caracteristici`): redenumire în `/caini/rase/bichon-frise` cu 301 | DB ⛔ (scriptul rulează pe server cu aprobare) | Doar pentru slug-urile > 4 cuvinte; 301 + backlinks.cjs actualizat |
| F0.15 | `images.remotePatterns` restrâns la hosturile reale (upload.wikimedia.org, images.unsplash.com, divet.ro) | `next.config.ts` | Build OK, imaginile existente se încarcă |

### F1 — Fundația E-E-A-T pentru sănătate (săptămânile 1–2)

| # | Task | Detalii |
|---|---|---|
| F1.1 ⛔ | **Medic veterinar recenzent** (decizia userului: colaborare plătită cu un DMV din România, nume, CMV/parafă, poză, bio). Fără el, clusterul de sănătate nu bate ghidulvet la încredere, doar la volum. | Userul recrutează; agentul pregătește brief-ul și pagina |
| F1.2 | Model de date: `reviewedBy` (relație spre `Author` cu `role=VET`, `credentials`, `licenseNumber`, `sameAs`) + `reviewedAt` pe Post | Migrație prin `diff` + `deploy`; admin UI pentru câmpuri |
| F1.3 | Schema: pentru postările din clusterul sănătate, `MedicalWebPage` cu `reviewedBy`, `lastReviewed`, `about` (MedicalCondition / MedicalSignOrSymptom), `audience`; Person pentru vet cu `hasCredential` | `lib/seo/schema-generator.ts` + teste |
| F1.4 | Componente: caseta „Revizuit medical de Dr. X, data” deasupra conținutului, `MedicalDisclaimer` vizibil, bloc „Când mergi urgent la veterinar” (triaj, cum are ghidulvet, dar cu surse) | template divet |
| F1.5 | Pagini statice: `/politica-editoriala` (proces, AI-asistat + recenzie umană, surse, corecturi), `/echipa` (redacție + recenzent), extinderea `/despre-noi`; `Organization` cu `sameAs`, logo, `publishingPrinciples` | pagini DB + schema |
| F1.6 | **Gate de publicare** ⛔ (decizia userului): articolele de sănătate se publică doar cu `reviewedBy` setat? Recomandare: da. Altfel se publică cu eticheta „în curs de revizuire” și fără `MedicalWebPage`. | logica publisher/scheduler |

### F2 — Clusterul de sănătate (săptămânile 2–8, cea mai mare pârghie de trafic)

Ierarhia nouă (grup rădăcină `sanatate`, sau `/caini/sanatate/...` și `/pisici/sanatate/...`; ⛔ userul alege URL-ul, recomandarea fiind sub specie: `/caini/boli/parvoviroza`, `/pisici/simptome/nu-mananca`, pentru că se potrivește cu silozul existent și cu `buildPostPath`).

Tipuri de pagină (template-uri noi sau variante ale ArticleTemplate):
1. **Boală**: definiție de 40 de cuvinte, cauze, simptome, rase predispuse (linkuri spre rase), diagnostic, tratament (fără doze), prevenție, prognostic, FAQ, surse. Schema `MedicalCondition`.
2. **Simptom**: caseta „Cât de urgent este?” cu nivel (verde/galben/roșu), cauze posibile, ce faci acum, când mergi la veterinar, linkuri spre boli. Schema `MedicalSignOrSymptom`.
3. **Toxic / „câinele a mâncat X”**: doza toxică doar dacă există sursă, simptome, timp de debut, acțiune imediată, numere de urgență. Schema `MedicalGuideline` sau `HowTo` pentru primul ajutor.
4. **Ghid de îngrijire**: vaccinare, deparazitare, sterilizare, microcipare (legislația RO 2026), prima vizită, hrănire pe vârste.

Backlog inițial (ordinea = valoare): pornește de la lista din `ghidulvet-analysis.md` §6, plus golurile lor.
- Lotul 1 (20): parvoviroză, jigodie (ciumă), babesioză, leishmanioză, dirofilarioză, leptospiroză, panleucopenie, FIV, FeLV, coriza pisicii; simptome: câinele vomită, diaree, nu mănâncă, șchiopătează, pisica nu mănâncă / vomită; toxic: ciocolată, struguri, xilitol, crini la pisici.
- Lotul 2 (20): vaccinare cățel + pisoi (scheme), deparazitare internă/externă, căpușe, sterilizare câine/pisică, microcipare 2026, displazie de șold, otită, dermatită atopică, torsiune gastrică, boală renală pisică, hipertiroidism, diabet, epilepsie, convulsii, respiră greu, ibuprofen/paracetamol.
- Lotul 3: animale mici (iepure, hamster, cobai, papagal peruș, țestoasă, gecko, pește auriu/acvariu), câine bătrân, caniculă, călătorie/pașaport.

Pași tehnici:
- F2.1 Categorii + `category-content.ts` + `silo.ts` pentru noile hub-uri; nav (ascunsă până există conținut publicat, mecanism existent).
- F2.2 Câmpuri structurate noi (field definitions seed): `urgency` (enum), `predisposedBreeds` (relații), `contagious`, `zoonotic`, `species`.
- F2.3 **Legătura rasă ↔ boală**: secțiunea „Probleme de sănătate” din fiecare rasă linkează spre paginile de boală; pagina de boală listează rasele predispuse. Automat din `predisposedBreeds`.
- F2.4 Extinde `AI_CONTENT_GUIDE.md` cu regulile YMYL (surse obligatorii, fără doze, triaj, disclaimer) și geo-scorer-ul (`lib/seo/geo-scorer.ts`) cu factori pentru `reviewedBy` și surse linkate.
- F2.5 Repară limita publisher-ului: HTML `<table>` → `comparisonBlock` în `serverHtmlToTiptapJson`, ca tabelele să ia punctele GEO fără scriptul manual pe DB.
- F2.6 Producție de conținut ⛔: pe pipeline-ul existent (coadă + scheduler + `.backlinks.cjs`), separat de coada enciclopedică (care merge până la 20.11). Ritm propus: 1 articol de sănătate pe zi, după gate-ul F1.6.

### F3 — Calculatoare și unelte (săptămânile 3–6)

Hub `/instrumente` (schema `CollectionPage`). Fiecare unealtă e o pagină cu calculator client-side, plus 400–700 de cuvinte de explicație, FAQ, surse, schema `SoftwareApplication` (sau `WebApplication`) + FAQPage. Fără cookie-uri.
1. Vârsta câinelui în ani umani (pe talie; formula AVMA / UCSD epigenetică, citată)
2. Vârsta pisicii în ani umani
3. Porția zilnică de hrană (RER/MER, kcal; cu disclaimer)
4. Greutate ideală / body condition score (vizual)
5. Calendar vaccinare + deparazitare (generează date din data nașterii; export .ics fără server)
6. Gestație câine/pisică (data estimată a fătării)
7. Costul anual al unui câine/pisici în România (prețuri medii cu sursă și dată)
8. **„Ce poate mânca câinele/pisica?”** — o singură pagină de căutare cu tabel (aliment → da/nu/moderat, motiv, sursă), plus pagini separate **doar** pentru ~25 de alimente cu volum real. Nu 119 pagini subțiri ca la ei.
9. **Quiz „Ce rasă de câine ți se potrivește?”** bazat pe spec grid-ul existent (date din field definitions). Unealtă unică, cu link spre rase.

Tehnic: componentă reutilizabilă `ToolLayout`, logica de calcul în `lib/tools/*.ts` cu teste Vitest exhaustive (formulele sunt YMYL).

### F4 — Monopolul enciclopedic (continuu)

- F4.1 Rase: de la 26 la 200+ (câini 120, pisici 60, plus cai, iepuri, păsări de companie). Prioritizează după GSC ⛔ și după rasele din backlog (`divet-content-schedule`).
- F4.2 **Comparații `/comparatie/{a}-vs-{b}`**: modelul de date (postA, postB, rânduri, verdict; root category `comparatie`) și template-ul generat din spec grid-urile existente, plus 300–500 de cuvinte unice. Începe cu 20 de perechi naturale (labrador vs golden, husky vs malamut, maine coon vs norvegiană…).
- F4.3 Blocuri-răspuns pentru AI: „Cât trăiește X?”, „Cât costă X în România?”, „Cât cântărește X?”. Primul paragraf al secțiunii e un răspuns de 1–2 fraze cu cifră și sursă; schema `speakable` pe ele.
- F4.4 Echilibrarea grupurilor subțiri: marine, insecte și sălbatice au 1–3 articole. Obiectiv: ≥10 per subcategorie înainte de a o arăta în nav (SERP-urile RO sunt goale aici, deci câștiguri rapide).
- F4.5 Glosar `/glosar` (`DefinedTermSet`): termeni veterinari și zoologici, legați din articole.

### F5 — Off-site, GEO și măsurare (în paralel, continuu)

- F5.1 ⛔ Google Search Console + Bing Webmaster: verificare, sitemap trimis, export lunar de 404/queries în `docs/seo/`. **Prima acțiune a userului**, de care depind F0.1 și F4.1.
- F5.2 ⛔ Profiluri sociale (Facebook, Instagram, Pinterest, YouTube pentru faună) și `Organization.sameAs`.
- F5.3 Outreach: grupuri FB de rase, asociații chinologice/feline, adăposturi (ghiduri de adopție ca resursă), profesori de biologie (fișe de faună), cluburi de rasă. Infografice/fișe „ce nu are voie câinele să mănânce” ca link-bait.
- F5.4 Monitorizare GEO: set fix de 30 de întrebări în română testate lunar în ChatGPT, Perplexity, Gemini și AI Overviews; log în `docs/seo/geo-tracking.md` (cine e citat).
- F5.5 Politică explicită pentru roboții AI în robots.txt (permite GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended) și o linie spre llms.txt.
- F5.6 Wikipedia (ro): **doar** acolo unde divet are o sursă reală utilă. Nu face spam.

---

## 4. Ordinea de execuție recomandată pentru Sonnet

1. **F0** într-un singur branch, task cu task, ~2–3 zile de agent. F0.1, F0.11, F0.12 și F0.14 au părți ⛔ (date sau server).
2. **F1.2–F1.5** (cod) în paralel cu recrutarea vet-ului de către user (F1.1).
3. **F2.1–F2.5** (cod), apoi F2.6 (conținut) după gate.
4. **F3** poate rula în paralel cu F2 (alte fișiere: `lib/tools/`, `app/(frontend)/instrumente/`).
5. **F4** și **F5** sunt continue.

Sesiuni paralele sigure (fișiere disjuncte): {F0} → apoi {F1+F2 cod} ∥ {F3 unelte} ∥ {F4.2 comparații}.

## 5. KPI-uri (verificate lunar din GSC)

- 0 URL-uri legacy cu 404 în GSC la 30 de zile după F0.1
- Pagini indexate: de la ~60 la 250+ (până la 31.01.2027)
- Clusterul de sănătate: 40 de pagini publicate și revizuite până la 31.12.2026
- Top 10 pe ≥50% din interogările faunei marine și insectelor țintite
- Citări AI: ≥5 din cele 30 de întrebări citează divet.ro până în februarie 2027
- p95 TTFB < 800 ms

## 6. Decizii deschise pentru user ⛔

1. Medic veterinar recenzent: da/nu, buget (F1.1). **Cea mai importantă decizie.**
2. Gate-ul de publicare pentru sănătate (F1.6).
3. Structura URL-urilor pentru sănătate: `/caini/boli/x` (recomandat) vs `/sanatate/x` (F2).
4. Acces la exportul de 404 din GSC și la exportul Ahrefs (F0.1, F4.1).
5. Microcache în nginx (F0.12) și curățarea header-elor din nginx: aplicate de user pe server.
