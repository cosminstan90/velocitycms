# F4 — Monopolul enciclopedic: plan de execuție

Data: 2026-11-04. Continuă `docs/seo/2026-11-03-ghidulvet/PLAN-executie-sonnet.md` (F0–F3 sunt făcute: reparații tehnice, model de sănătate, 25 de articole de sănătate programate, instrumente).

Date brute folosite aici: `suggestions.json` din același folder (738 de sugestii Google Autocomplete în română, 152 de interogări-sămânță; scriptul `suggest.mjs` le reproduce). **Autocomplete arată formulările reale, nu volumele.** Volumele vin din Search Console (vezi §5).

---

## 0. Punct de plecare

| | Acum | După coada actuală (20.11) |
|---|---|---|
| Articole publicate | 38 | ~114 (51 enciclopedice + 25 sănătate programate) |
| Pagini de categorie cu text editorial | 17 din ~35 de rute posibile | — |
| Comparații | 0 (`/comparatie` e 404) | — |
| Liste „cele mai…” | 0 | — |
| Glosar | 0 | — |
| Distribuție | câini 16, pisici 10, marine 7, insecte 4, sălbatice 1 (+ sănătate din 5.11) | |

Concluzii de lucru:
1. Avantajul nostru este **volumul enciclopedic structurat** (fișe cu aceleași câmpuri, deci comparabile automat). F4 transformă asta în pagini pe care ghidulvet.ro nu le are: comparații, liste filtrate, glosar, faună.
2. Căutările reale din autocomplete arată patru tipare mari, nu doar „rasa X”:
   - **liste și filtre**: „rase de câini mici / mari / medii / pentru apartament / care nu lasă păr / mici și pufoase”, „cele mai mari animale din lume / marine / terestre”, „animale periculoase în România”, „cel mai inteligent câine”;
   - **comparații**: „labrador vs golden retriever”, „husky vs malamut / lup”, „golden retriever vs labrador”;
   - **răspunsuri scurte**: „cât trăiește (balena, labradorul, ursul polar)”, „ce mănâncă”, „unde trăiește”;
   - **comercial** („preț”, „de vânzare”, „pui”): intenția nu poate fi servită onest (nu vindem și nu avem prețuri verificabile). Nu intrăm pe ea; răspundem doar cu „ce trebuie să știi înainte să cumperi/adopți” fără cifre inventate.
3. Autocomplete a arătat și zgomot (ex. „husky sau” → „husky sausage dog”, „licurici” → firme). Nu tratăm sugestiile ca sarcini; le filtrăm manual.

---

## 1. Piloni de conținut

### 1.1 Rase (fișe) — de la 26 la 120+ în 8 săptămâni
- **Sursa listei**: (a) interogările din GSC (după ce avem acces), (b) exportul Ahrefs vechi al site-ului (userul are doar capturi), (c) autocomplete pe ~150 de rase, (d) lista rasei FCI + rase populare în România.
- **Prioritate**: rase cu căutare mare și competiție slabă în română: rase rare/străine (alabai, savannah, ashera, nebelung… deja programate) și rase „populare dar slab acoperite” (cane corso, rottweiler, jack russell, pomeranian, chihuahua, bichon maltez, ragdoll, siameza, persană, bengaleză). Rasele-cap (labrador, ciobănesc german) există deja.
- **Format**: șablonul actual (TL;DR, spec grid, profil comportamental, FAQ 6, tabel comparativ) + **două blocuri noi obligatorii**: „Probleme de sănătate frecvente” (legat automat la articolele de sănătate prin `rase_predispuse`, doar cu sursă) și „Compară cu…” (link spre pagina de comparație relevantă).
- **Țintă**: 10 fișe/săptămână după 20.11. Fără pagini sub 600 de cuvinte.

### 1.2 Comparații `/comparatie/{a}-vs-{b}`
- **Model de date** (deja amânat din redesign): categorie rădăcină `comparatie` + câmpuri `postA_slug`, `postB_slug`, `compare_rows`, `verdict`. Template nou care generează tabelul din spec grid-urile celor două fișe (un singur adevăr, fără date duplicate) și adaugă 300–500 de cuvinte unice: „Cine se potrivește cui”, 3 diferențe care contează, FAQ.
- **Reguli anti-canibalizare**: pagina de comparație **nu** repetă fișele; trimite spre ele; fișele trimit spre comparație. Un titlu = o intenție („labrador vs golden retriever”, nu „diferențe labrador golden”).
- **Primele 20 de perechi** (din autocomplete și logică de produs): labrador–golden retriever, husky–malamut, husky–lup (doar dacă există articol despre lup), ciobănesc german–ciobănesc belgian, beagle–basset, bichon frisé–bichon maltez, golden retriever–labrador, maine coon–norvegiană de pădure, british shorthair–scottish fold, persană–exotic shorthair, siameză–orientală, bengaleză–savannah, ragdoll–maine coon, chihuahua–pomeranian, bulldog francez–bulldog englez, rottweiler–dobermann, border collie–ciobănesc australian, pisică–câine (hub special „pisică sau câine”), plus 2 din faună (urs brun–urs grizzly, rechin taur–rechin alb).
- **Condiție de pornire**: ambele fișe publicate. Generarea se face din date, deci costul pe pagină este mic.

### 1.3 Liste filtrate „cele mai…” (hub-uri programatice cu intro unic)
Pagini generate din câmpurile existente, **fiecare cu intro scris de mână (150–250 de cuvinte) și cu minim 8 intrări**; sub 8, pagina nu se publică (altfel este index bloat).

| Listă | Filtru | Interogări vizate |
|---|---|---|
| Rase de câini mici / medii / mari | `talie` | rase de câini mici/medii/mari |
| Rase de câini pentru apartament | `nivel_energie` ≤ Mediu + `talie` ≠ Mare | rase de câini pentru apartament |
| Rase de câini care năpârlesc puțin | **câmp nou** `naparleste` | care nu lasă păr |
| Rase de câini cu copii | `bun_cu_copiii` = Da | rase pentru familii |
| Cele mai inteligente rase | `usurinta_dresaj` ≥ Ridicat | cel mai inteligent câine |
| Rase de pisici de apartament / cu blană lungă / liniștite | câmpuri existente + `blana` | ghid pisici |
| Cele mai mari animale (terestre / marine / din lume) | **câmp numeric nou** `greutate_max_kg` | cele mai mari animale din lume/ocean |
| Animale periculoase din România | `fauna-romaniei` + `pericol` | animale periculoase în România |

Necesită **două câmpuri noi** (`naparleste`, `greutate_max_kg`, plus `pericol` pentru faună) și valori completate pe fișele existente prin script verificat, nu inventat.

### 1.4 Faună, specii marine, insecte — golul fără concurență
SERP-urile românești pentru balena cu cocoașă, rechin taur, insecta-băț sunt goale. Țintă: **minim 10 articole pe fiecare subcategorie** înainte s-o arătăm în meniu (acum: mamifere marine 2, rechini și pești 2, nevertebrate 3, gândaci 1, insecte exotice 2, mamifere sălbatice 1).
Șabloane de răspuns scurt în fiecare fișă: „Cât trăiește”, „Ce mănâncă”, „Unde trăiește”, „Cât cântărește” — fiecare ca prim paragraf al propriei secțiuni, cu cifră și sursă (IUCN, Wikipedia RO ca verificare încrucișată, enciclopedii).

### 1.5 Glosar `/glosar`
`DefinedTermSet`. ~150 de termeni (veterinar și zoologic: dispepsie, zoonoză, ectoparaziți, vaccin core, torsiune gastrică, bioluminescență, endemism…). Fiecare termen: definiție de 30–60 de cuvinte + sursă + linkuri spre articolele care îl folosesc. Linkarea automată din articole spre glosar: **doar prima apariție**, doar pentru termenii marcați (nu pentru toate cuvintele).

### 1.6 Sănătate și instrumente (continuare)
- Loturi 3–5 de sănătate (aceleași reguli YMYL): vaccinare/deparazitare pisici, sterilizare, boli frecvente cu surse (leptospiroză, leishmanioză, dirofilarioză, otită, dermatită, boală renală la pisici), animale mici (iepure, hamster, cobai).
- Instrumente noi doar cu sursă primară deschisă: porția de hrană (RER/MER cu avertismente), calendar de vaccinare doar după aprobarea recenzentului, cost de adopție doar cu date citate.

---

## 2. Conținut pe paginile de categorie

### 2.1 Inventar și lacune
Au text editorial (17): `caini`, `caini/rase`, `pisici`, `pisici/rase`, `marine` + 4 subcategorii, `insecte` + 2, `salbatice`, `salbatice/mamifere`, `sanatate` + `boli`, `simptome`, `substante-toxice`.
**Fără text editorial (de scris)**: `sanatate/{vaccinare, parazitologie, urgente}`, `insecte/insecte-comune`, `salbatice/{rapitoare, specii-protejate, fauna-romaniei}`, `/instrumente` (are descriere scurtă), `/comparatie`, `/glosar`, plus hub-urile din §1.3.
**Decizie de structură**: în seed există și `caini/sanatate`, `pisici/sanatate`, `caini/{ingrijire, dresaj, alimentatie}`, `pisici/{ingrijire, comportament}`. Sănătatea trăiește acum în grupul `sanatate`; `caini/sanatate` și `pisici/sanatate` ar canibaliza. Recomandare: **nu le populăm**; rămân ascunse (fără articole nu apar în meniu și sunt `noindex` sub 3 articole). `ingrijire`, `dresaj`, `alimentatie`, `comportament` se activează doar când au ≥6 articole.

### 2.2 Șablon de pagină de categorie (grup și subcategorie)
Elemente, în ordine:
1. **H1 + intro** (3 paragrafe, ~200 de cuvinte): ce acoperă secțiunea, cum alegi, ce nu acoperă, avertismentul YMYL unde e cazul.
2. **Navigare rapidă**: subcategorii cu număr de articole (doar nevide) + „Alte secțiuni” (silo, deja implementat în `lib/silo.ts`).
3. **Listă de articole** cu card (imagine, titlu, linia `talie · greutate · speranță de viață`), paginare, canonical corect.
4. **Bloc „Ghid rapid”** (nou): 4–6 linkuri spre listele filtrate relevante (ex. pe `caini/rase`: rase mici, mari, pentru apartament, care năpârlesc puțin, pentru copii) și spre comparațiile populare.
5. **FAQ** (min. 3, vizibil + FAQPage), răspunsuri scurte, fără cifre nesusținute.
6. **Date structurate**: CollectionPage + ItemList (există), BreadcrumbList.

Reguli: `metaTitle` ≤ 52 de caractere, `metaDesc` 130–155; categoria apare în meniu și sitemap doar cu **≥ 6 articole**; între 1 și 5 articole rămâne accesibilă, dar `noindex, follow`.

### 2.3 Texte de scris (prima rundă, 10 pagini)
`sanatate/vaccinare`, `sanatate/parazitologie`, `sanatate/urgente`, `insecte/insecte-comune`, `salbatice/rapitoare`, `salbatice/specii-protejate`, `salbatice/fauna-romaniei`, `/comparatie`, `/glosar`, `/instrumente` (extins). Fiecare urmează `lib/category-content.ts` (test existent: 3 paragrafe, ≥3 FAQ, ≥1 link spre alt grup).

---

## 3. Internal linking — sistem, nu improvizație

### 3.1 Tipuri de linkuri și cote per articol
| Tip | Regulă | Implementare |
|---|---|---|
| **Sus** (spre hub) | 1 link contextual spre categoria/subcategoria articolului | breadcrumb (există) + o frază în text |
| **Lateral** (aceeași rază) | 2–3 articole înrudite (aceeași subcategorie sau aceleași etichete/câmpuri) | bloc „Citește și” generat la randare |
| **În jos** (spre detaliu) | rasă → boli frecvente, comparații, liste care o conțin | `rase_predispuse` (există), comparații, hub-uri |
| **Cross-silo** | 1 link spre alt grup, doar dacă e relevant (rasă → articol de sănătate, faună → rude) | `related` din `category-content` |
| **Glosar** | prima apariție a termenilor marcați | transformare la randare |

Minim 4 linkuri interne reale per articol; maxim ~12. Textul de ancoră descriptiv („boala Addison la câini”), nu „click aici”. Niciun link către pagini nepublicate (verificat la randare, ca la instrumente).

### 3.2 De ce este nevoie de cod
Acum linkurile între articole vin din (a) text scris de agenți și (b) `.backlinks.cjs`, un script de pe server care **scrie în baza de date** liste „Citește și” hardcodate. Nu scalează la 200+ de articole și se rupe la redenumiri.
Propunere: **`lib/related.ts`**, calculat la randare, fără scriere în DB:
- scor = etichete comune (pondere 3) + aceeași subcategorie (2) + câmpuri comune (talie, specie, habitat: 1) + recență mică; exclude articolele nepublicate și pe cel curent; returnează 3–5;
- legătură **bidirecțională** garantată prin simetria scorului;
- rase ↔ sănătate ↔ comparații prin relații explicite (au prioritate față de scor).
După lansare, `.backlinks.cjs` se oprește.

### 3.3 Audit și întreținere
- Script `scripts/link-audit.ts` (rulează local pe baza de producție, doar citire): articole **orfane** (0 linkuri interne primite), articole cu < 4 linkuri trimise, linkuri către 404/redirect, ancore duplicate spre aceeași țintă, adâncime de click din homepage. Rulează lunar; rezultatul intră în `docs/seo/`.
- KPI: 0 orfane; ≥ 4 linkuri primite per articol până la 31.12.2026; adâncime maximă 3 clicuri.

### 3.4 Hub-uri ca „motoare” de linkuri
Listele filtrate (§1.3) și comparațiile (§1.2) sunt, structural, pagini care primesc și dau linkuri multe, curate: fiecare listă trimite spre toate fișele membre, fiecare fișă trimite înapoi spre listele din care face parte (bloc „Apare în”). Asta crește automat densitatea de linkuri fără text în plus.

---

## 4. Cercetare de cuvinte-cheie — metodă repetabilă

### 4.1 Surse (în ordinea valorii)
1. **Google Search Console** ⛔ — singura sursă cu impresii și poziții reale. Fără ea, prioritizarea este orb. Acțiune user: verificare domeniu, export interogări la 28 de zile (apoi lunar).
2. **Autocomplete** — făcut (`suggest.mjs`). Se extinde cu `a–z` după sămânță și cu modificatorii: „cât trăiește”, „cât cântărește”, „ce mănâncă”, „vs”, „sau”, „pentru apartament”, „care nu”. Rulat o dată pe lună; diferențele arată interogările noi.
3. **Exportul Ahrefs vechi** ⛔ (capturile din ianuarie–aprilie 2025): cuvintele pentru care site-ul vechi avea trafic = cerere dovedită; sursa lotului din noiembrie.
4. **Bing Webmaster Tools** ⛔ — gratuit, același tip de date pentru Bing/Copilot/DuckDuckGo.
5. **Acoperire față de competitori**: sitemap-ul ghidulvet.ro (făcut) + liste Wikipedia RO per categorie (rase FCI, specii) ca să nu ratăm subiecte evidente.
6. **Google Trends (RO)** — doar pentru sezonalitate (căpușe în martie–octombrie, toxice de sărbători), nu pentru volum.
7. DataForSEO sau alt furnizor plătit — opțional, dacă bugetul permite; nu e necesar pentru prima rundă.

### 4.2 Proces
1. **Extragere** brută din sursele de mai sus într-un CSV (`keywords-raw.csv`).
2. **Curățare**: scoatem comercial („de vânzare”, „preț pui”), navigațional (firme, mărci), neînrudit (omonime) și duplicatele de diacritice.
3. **Grupare pe intenție** (un grup = o pagină): informațional-fișă, comparație, listă, răspuns scurt, sănătate, instrument, glosar.
4. **Maparea** fiecărui grup la un tip de pagină existent sau planificat și la o țintă unică (anti-canibalizare: un singur URL țintă per grup; `docs/seo/keyword-map.csv`).
5. **Scorare** 1–5 pe patru criterii: cerere (impresii GSC / prezența în autocomplete), slăbiciunea SERP (câte din primele 10 sunt portaluri de știri sau pagini subțiri), potrivire cu datele noastre, risc (YMYL → penalizare).
6. **Backlog ordonat** → intră în coada de publicare (lot de 12–15, ca la sănătate).

### 4.3 Primul backlog (din autocomplete; de validat cu GSC)
- **Comparații**: labrador vs golden retriever, husky vs malamut, husky vs lup, golden retriever vs labrador (consolidat în aceeași pagină ca prima).
- **Liste**: rase de câini mici / mari / medii / pentru apartament / care nu lasă păr / mici și pufoase / periculoase / de pază (talie medie, mare, mică); cele mai mari animale din lume / terestre / marine; animale periculoase din România; animale marine (denumiri).
- **Răspunsuri scurte** (în fișe, nu pagini separate): cât trăiește labradorul, balena albastră, urșii polari, pinguinii; unde trăiește ursul polar.
- **Evităm**: „labrador pret / de vânzare / pui” (comercial), „licurici” ca nume (firme; păstrăm doar insecta).

---

## 5. Cercetare de prompturi (GEO / AI search)

### 5.1 Scop
Aflăm **ce întreabă oamenii asistenții AI** și **cine este citat**, ca să scriem pagini pe care le preiau. Rezultatul este un set fix de prompturi, urmărit lunar.

### 5.2 Setul de prompturi (60–100, în română)
Construit din intenții, nu din cuvinte-cheie. Exemple pe bucket:
- **Rase** (15): „Ce rasă de câine se potrivește într-un apartament de 2 camere?”, „Cât trăiește un labrador?”, „Care este diferența dintre labrador și golden retriever?”, „Ce pisică nu năpârlește mult?”
- **Sănătate/siguranță** (20): „Câinele meu a mâncat ciocolată, ce fac?”, „De ce vomită pisica?”, „Sunt toxici strugurii pentru câini?”, „Când se vaccinează un cățel?”, „Cum scot o căpușă de pe câine?”
- **Faună** (15): „Cât trăiește balena albastră?”, „Care este cel mai mare animal terestru?”, „Ce mănâncă rechinul taur?”, „Ce animale periculoase trăiesc în România?”
- **Comparații** (10): „Husky sau malamut pentru familie?”, „Pisică sau câine într-un apartament?”
- **Local/practic** (10): „Ce acte trebuie pentru un câine în România?”, „Este obligatorie vaccinarea antirabică?”
- **Brand** (5): „Ce este DiVet?”, „Este DiVet de încredere?”
Fiecare prompt are: intenție, bucket, pagina-țintă de la noi, răspuns-așteptat (pentru a evalua corectitudinea citării).

### 5.3 Măsurare lunară
Pe platformele: ChatGPT (cu căutare), Perplexity, Gemini, Google AI Overviews (căutare normală), Bing Copilot. Pentru fiecare prompt notăm: **dacă divet.ro este citat** (da/nu), **poziția în lista de surse**, **dacă este doar menționat în text**, **domeniile citate în schimb**, **corectitudinea răspunsului**. Rezultat în `docs/seo/geo-tracking.csv`.
Metrici: rata de citare (prompturi cu cel puțin o citare / total), rata pe bucket, top domenii care ne iau locul. Țintă: ≥ 5 din 30 de prompturi de bază cu citare până în februarie 2027 (aceeași cu planul inițial), apoi 20%.
Rulat manual în prima lună (30 de minute/lună pentru 60 de prompturi); automatizabil ulterior cu API-urile platformelor sau cu DataForSEO (AI visibility), dacă se justifică.

### 5.4 Ce facem cu rezultatele
- **Prompt cu citare a altora, nu a noastră** → verificăm pagina-țintă: răspuns în primul paragraf (40–55 de cuvinte), tabel, FAQ, sursă citată, dată actualizată; apoi eventual o pagină nouă.
- **Prompt fără pagină-țintă** → intră în backlogul de conținut (§4.2.6).
- **Răspuns incorect despre noi** → corectăm pagina și, dacă e cazul, `llms.txt`.
- Pagini-șablon pentru GEO (deja în ghid): primul paragraf-definiție, tabel comparativ, FAQ, `speakable`, autor, dată. În plus: **`llms-full.txt` actualizat automat** (există) și **linkuri spre surse primare** (diferențiator față de ghidulvet.ro).

---

## 6. Calendar și volume (propunere)

| Săptămâna | Conținut | Cod / structură | Cercetare |
|---|---|---|---|
| 1 (4–10.11) | — (coada actuală rulează) | modelul de comparații + câmpurile noi (`naparleste`, `greutate_max_kg`, `pericol`) | acces GSC ⛔; prima rundă de prompturi (30) |
| 2 (11–17.11) | primele 10 texte de categorie | template comparații + hub-uri listă + bloc „Apare în” | keyword map v1 din GSC + autocomplete |
| 3 (18–24.11) | primele 6 liste filtrate + 6 comparații | `lib/related.ts` + oprirea `.backlinks.cjs` | prima măsurare GEO |
| 4–6 | 30 de rase noi, 8 comparații, faună (10/subcategorie) | glosar (model + 50 de termeni) | link audit v1 |
| 7–8 | lot 3 sănătate (12), 50 de termeni glosar | instrumente noi | keyword map v2, GEO lunar |

Ritm: coada actuală se termină pe 20.11 (3/zi enciclopedice + 2/zi sănătate). Din 21.11 propun **4/zi** în total (2 enciclopedice, 1 sănătate, 1 comparație/listă), ca să nu depășim capacitatea de verificare a sursei.

---

## 7. Plan de sarcini pentru Sonnet (fiecare = un PR)

| # | Sarcină | Acceptare |
|---|---|---|
| T1 | Câmpuri noi în seed (`naparleste`, `greutate_max_kg`, `pericol`) + randare în spec grid | seed idempotent, teste fields |
| T2 | Model comparații: categorie `comparatie`, câmpuri, loader (A/B din slug-uri publicate) | test: refuză perechi cu un articol nepublicat |
| T3 | Template `ComparisonTemplate` pentru divet: tabel generat din spec grid, verdict, FAQ, JSON-LD | pagina `/comparatie/a-vs-b` 200, schema validă |
| T4 | Hub `/comparatie` + sitemap + bloc „Compară cu…” pe fișe | link bidirecțional verificat |
| T5 | Liste filtrate: rută `/rase/{filtru}` (sau `/caini/rase/{filtru}`), definiții în `lib/lists.ts`, prag minim 8 intrări, intro din `category-content` | sub 8 → 404/noindex; teste |
| T6 | Bloc „Apare în” pe fișe + „Ghid rapid” pe categorii | teste de selecție |
| T7 | `lib/related.ts` + înlocuirea blocului din template; oprirea `.backlinks.cjs` | test pe scoruri; 0 link spre nepublicat |
| T8 | `scripts/link-audit.ts` | raport orfani, <4 linkuri, 404 |
| T9 | Glosar: model (Page tip glosar sau tabel), `/glosar`, `DefinedTermSet`, autolink prima apariție | teste |
| T10 | Regula „categorie vizibilă la ≥6 articole, noindex sub 3” în nav, sitemap, meta | teste existente extinse |
| T11 | Texte de categorie, runda 1 (10 pagini) în `category-content.ts` | testele de invarianți trec |
| T12 | Scripturi de cercetare în repo: `scripts/research/suggest.ts` (autocomplete), șablon `keyword-map.csv`, `geo-tracking.csv`, lista de prompturi `docs/seo/geo-prompts.csv` | rulează fără chei |
| T13 | Conținut: loturi de rase/faună/comparații/liste cu fluxul testat (brief → agenți → validare → v1/final → relink) | validator + imagini verificate |

Dependențe user ⛔: acces GSC și Bing Webmaster; exportul Ahrefs complet (dacă există); aprobări de merge/deploy; Radu Popescu pentru recenzia articolelor de sănătate; decizia despre `caini/sanatate` și `pisici/sanatate` (recomandare: ignorate).

---

## 8. Riscuri și măsuri

| Risc | Măsură |
|---|---|
| Pagini programatice subțiri (liste, comparații) | prag minim de intrări, intro unic, 300+ de cuvinte originale pe comparație, `noindex` sub prag |
| Canibalizare fișă ↔ comparație ↔ listă | un URL țintă per grup de cuvinte-cheie (`keyword-map.csv`), titluri cu intenții distincte |
| Calitatea conținutului AI la volum | validator + agenți cu surse deschise, lecțiile din loturile 1–2 în brief, verificare manuală prin eșantion (25%) |
| YMYL (sănătate) | regulile din ghid; fără doze/diagnostice; mențiunea „revizuit de” doar real |
| Index bloat | sitemap doar cu pagini care trec pragurile; audit lunar în GSC |
| Viteză | microcache nginx activ; verificăm p95 după fiecare creștere de pagini |
| Dependență de o sursă (Wikimedia pentru imagini) | atribuire corectă; rezervă Unsplash |

## 9. KPI-uri la 31.12.2026

- ≥ 200 de pagini indexate (acum 38 + coada)
- 0 pagini orfane; ≥ 4 linkuri interne primite / articol
- 20 de comparații și 10 liste filtrate publicate
- fiecare subcategorie vizibilă cu ≥ 6 articole
- rata de citare AI ≥ 20% pe setul de 60 de prompturi
- primele 10 poziții pentru ≥ 50% din interogările de faună/insecte țintite
