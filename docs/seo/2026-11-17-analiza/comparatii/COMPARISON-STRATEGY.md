# DiVet — Strategie pentru comparații, „rase asemănătoare" și liste (17.11.2026)

Adaptare a skill-ului `seo-competitor-pages` la un editor de enciclopedie de animale:
„X vs Y" = comparații rasă/specie (`/comparatie/<slug>`), „alternative la X" = „rase asemănătoare cu X",
„best [categorie]" = roundup-uri `/liste/<slug>`. Fără schema Product/SoftwareApplication/AggregateRating
(nu avem și nu inventăm evaluări): folosim Article, BreadcrumbList, FAQPage, ItemList/CollectionPage.

Metodă și limite: sitemap divet.ro (1 cerere), 8 cereri pe paginile live, ~34 de interogări Google Autocomplete,
7 WebSearch + 2 WebFetch. **Nu sunt volume de căutare**; semnalul de cerere este doar „apare în autocomplete".
WebSearch rulează din SUA: SERP-ul românesc a fost doar eșantionat, nu măsurat (vezi §3). Cifrele din GSC
(când există acces) trebuie să înlocuiască ordinea de mai jos.

---

## 1. Inventar: fișe publicate (din sitemap.xml, 17.11.2026)

| Secțiune | Nr. | Fișe (slug) |
|---|---|---|
| `caini/rase` | 29–30 | labrador-rasa-caini-caracteristici, golden-retriever-caracteristici-temperament, bichon-frise-rasa-caini-caracteristici, husky-siberian, ciobanesc-german, rottweiler, beagle, bulldog-francez, boston-terrier, chihuahua, pomeranian, border-collie, american-staffordshire-terrier, ciobanesc-mioritic, ciobanesc-carpatin, ciobanesc-caucazian, ciobanesc-anatolian, ciobanesc-olandez, ciobanesc-cehoslovac, ciobanesc-de-berna, alabai, dog-de-bordeaux, schnauzer-urias, coton-de-tulear, lagotto-romagnolo, vizsla, pointer-englez, setter-irlandez, copoi-ardelenesc |
| `pisici/rase` | 19–20 | british-shorthair, scottish-fold, maine-coon, ragdoll, pisica-norvegiana-de-padure, pisica-siameza, pisica-orientala, pisica-persana, pisica-bengaleza, pisica-sphynx, russian-blue, chartreux, nebelung, pisica-abisiniana, pisica-bombay, pisica-burmeza, pisica-savannah, pisica-ashera, khao-manee |
| `salbatice/mamifere` | 7 | lupul-cenusiu, ursul-brun, ursul-polar, ursul-grizzly, vulpea-rosie, risul-eurasiatic, zimbrul |
| `marine/mamifere-marine` | 5 | orca, delfinul-comun, balena-cu-cocoasa, balena-de-groenlanda, morsa |
| `marine/rechini-si-pesti` | 5 | rechinul-alb, rechinul-taur, rechinul-balena, calul-de-mare, peste-fierastrau |
| `marine/nevertebrate-marine` + `pasari-marine` | 5 | meduza, caracatita-uriasa-din-pacific, arici-de-mare, castravete-de-mare, pinguinul |
| `insecte/gandaci` + `insecte-exotice` | 10 | buburuza, gandacul-goliat, gandacul-cerb, gandacul-lui-hercule, licurici, gandacul-rinocer, calugarita-orhidee, insecta-bat, insecta-frunza |
| `sanatate/*` | ~37 | nu intră în comparații |

Alte pagini live: `/liste` + **3 liste** (rase-de-caini-mari: 17 intrări; cele-mai-inteligente-rase-de-caini: 14;
rase-de-pisici-linistite: 9), `/comparatie` (hub, **0 comparații**, 200 OK), `/instrumente/*`, `/glosar`.
Notă: documentul de context spunea că doar „câini mari" e live; în sitemap sunt acum 3 liste.

**Fișe lipsă cu cerere vizibilă în autocomplete** (de scris înainte de comparațiile care le conțin):
malamut, pug, bulldog englez, malinois / ciobănesc belgian, doberman, cane corso, pitbull (atenție: amstaff ≠ „pitbull"),
pinscher, teckel, pudel, samoyed, kangal, crocodil, capodoglio, coiot/șacal.

---

## 2. Cercetare de intenție: Google Autocomplete (17.11.2026)

Date brute: `autocomplete-raw.txt` (34 de seed-uri, secvențial, pauze 0,7 s; `hl=ro&gl=ro`).
**Avertisment:** autocomplete-ul întoarce adesea sugestii în engleză pentru nume de rase („labrador vs german shepherd"),
deci nu toate sunt cerere românească; marchez separat `RO` = formulare românească.

| Seed | Sugestii relevante (RO) | Sugestii internaționale / alte |
|---|---|---|
| labrador vs | — | golden retriever, poodle, german shepherd, rottweiler, cane corso |
| labrador sau | **labrador sau golden retriever** (RO) | — |
| golden retriever vs | — | labrador, husky, australian shepherd, german shepherd |
| husky vs / husky sau | **husky vs malamut**, **husky sau malamut** (RO) | german shepherd, wolf, kangal, samoyed |
| ciobanesc german vs | **vs ciobanesc belgian, vs malinois, vs câine lup, vs cane corso, vs rottweiler, husky vs ciobanesc german, linie de lucru vs linie de show** (toate RO) | — |
| bulldog francez vs | **vs boston terrier, vs pug, vs englez, vs mops** (RO) | — |
| scottish fold vs | — | british shorthair, ragdoll, russian blue, persian |
| ragdoll vs / maine coon vs | — | british shorthair, maine coon, norwegian forest cat, birman, siamese |
| rechin vs | **rechin vs delfin, vs balena, vs crocodil, vs orca** (RO) | — |
| delfin vs | **delfin vs rechin, vs orca** (RO) + zgomot sportiv (echipe) | — |
| orca vs | **orca vs balena, vs rechin, vs rechin alb, vs delfin** (RO) | polar bear, sperm whale |
| urs brun vs | **urs brun vs grizzly, vs urs polar, vs urs negru** (RO) | — |
| ursul polar vs | **ursul polar vs ursul grizzly, vs ursul brun** (RO) | — |
| lup vs | **lup vs câine, vs șacal, vs kangal, vs urs, vs coiot, vs pitbull, vs om, vs vulpe, vs leu** (RO) | — |
| pisică sau câine | **pisica sau caine**, **pisica sau caine in apartament** (RO) | — |
| rase de câini asemănătoare | **… cu bichon, cu pitbull, cu husky, cu cane corso** (RO) | — |
| rase asemănătoare cu labrador | **nicio sugestie** | — |
| cele mai bune rase de câini pentru | **copii, apartament, curte, pază** (RO) | — |
| cele mai bune rase de pisici pentru | **apartament, copii** (RO) | — |
| rase de câini care nu năpârlesc / pisici care nu năpârlesc | ambele apar, inclusiv „ce rase de câini nu năpârlesc", „rase de pisici care nu năpârlesc" (RO) | — |
| animale periculoase din | **România, lume, Marea Neagră, ocean…** (RO) | — |
| diferența dintre labrador și / pisica persana vs / pisica british shorthair vs | **nimic** | — |

Concluzii:
1. Cerere românească confirmată pentru: **câine vs lup/ciobănesc**, **rechin vs delfin/orcă/balenă**, **urs brun vs grizzly/polar**, **husky vs malamut / ciobănesc german**, **bulldog francez vs boston/pug**, **labrador sau golden**.
2. Comparațiile de pisici apar doar cu nume englezești (scottish fold vs british shorthair etc.): cererea e reală dar probabil mică; SERP-ul românesc e probabil slab.
3. Formularea „X sau Y" în română merită inclusă în H1/FAQ/primul paragraf, nu ca pagină separată (anti-canibalizare, `keyword-map.csv`).
4. Șabloanele „diferența dintre … și …" nu produc sugestii pentru animale: nu le folosim ca titlu.

---

## 3. Ce arată SERP-ul (eșantion, nu măsurătoare)

- „cele mai bune rase de câini pentru apartament" / „rase care nu năpârlesc": portaluri generaliste (jurnalul.ro, adevarul.ro, bugetul.ro, biotur.ro) + site-uri străine în engleză.
- Pagini verificate cu WebFetch: **bugetul.ro** (8 iulie 2026): ~600 cuvinte, 8 rase, 7 H2, **fără tabel, fără FAQ, fără surse citate**, autor + dată, schema Article/Breadcrumb. **biotur.ro**: ~1.000 de cuvinte, 10 rase (H3), **fără tabel, fără FAQ, fără surse, fără autor/dată**.
- Pentru „labrador vs golden", „husky vs malamut", „rechin vs delfin", „british shorthair vs scottish fold" căutarea din SUA a întors doar site-uri străine (hepper, rover, a-z-animals, discoverwildlife, petkeen) și pagini auto-generate de comparație (pages.dev, web.app). **Nu am văzut pagini românești dedicate**, dar rezultatul e limitat de regiune: de verificat manual în Google.ro / GSC.
- Concluzie: standardul de bătut este **un tabel generat din date structurate, verdict explicit, surse linkate, dată/autor, FAQ**. Asta nu are niciunul dintre portalurile verificate; avantajul DiVet.

---

## 4. Prioritate: primele 20 de comparații (ambele fișe PUBLICATE)

Criterii de ordonare: cerere RO în autocomplete > fișe gata > câmpuri structurate probabil completate (rase de câini/pisici) > risc editorial.
Slug-ul paginii = `a-vs-b`, **A = numele care apare primul în autocomplete**; nu se creează varianta inversă.
Titlul din tabel este `metaTitle` (se adaugă automat „ | DiVet"; păstrat ≤ 52 de caractere). H1 = titlul postării.

| # | Slug comparație | Fișe A / B | Cuvânt-cheie țintă | Semnal | Title tag | H1 | Note |
|---|---|---|---|---|---|---|---|
| 1 | labrador-vs-golden-retriever | labrador / golden (publicate) | labrador vs golden retriever (+ „labrador sau golden") | RO + INT | Labrador vs Golden Retriever: diferențe și asemănări | Labrador vs Golden Retriever: diferențe și asemănări | programat 22.11 |
| 2 | ciobanesc-german-vs-rottweiler | ambele | ciobănesc german vs rottweiler | RO | Ciobănesc german vs Rottweiler: diferențe | Ciobănesc german vs Rottweiler: diferențe și asemănări | rase „de forță": ton neutru, fără „agresivitate" nesursată |
| 3 | husky-vs-ciobanesc-german | husky-siberian / ciobanesc-german | husky vs ciobănesc german | RO | Husky vs Ciobănesc german: care se potrivește cui | Husky vs Ciobănesc german: diferențe | |
| 4 | rechinul-alb-vs-delfinul-comun | ambele | rechin vs delfin | RO | Rechin vs delfin: diferențe între pește și mamifer | Rechin vs delfin: diferențe și asemănări | de verificat dacă fișele de faună au câmpuri comparabile |
| 5 | orca-vs-rechinul-alb | ambele | orca vs rechin alb | RO | Orca vs rechinul alb: diferențe, dietă, mărime | Orca vs rechinul alb: diferențe | evită cadrul „cine câștigă într-o luptă" |
| 6 | scottish-fold-vs-british-shorthair | ambele | scottish fold vs british shorthair | INT | Scottish Fold vs British Shorthair: diferențe | Scottish Fold vs British Shorthair: diferențe | secțiune sănătate (urechi pliate) doar cu sursă |
| 7 | bulldog-francez-vs-boston-terrier | ambele | bulldog francez vs boston terrier | RO | Bulldog francez vs Boston Terrier: diferențe | Bulldog francez vs Boston Terrier: diferențe | ambele brahicefale: sănătate respiratorie cu sursă |
| 8 | ursul-brun-vs-ursul-grizzly | ambele | urs brun vs grizzly | RO | Urs brun vs grizzly: sunt aceeași specie? | Urs brun vs grizzly: sunt aceeași specie? | grizzly = subspecie de urs brun; pagina trebuie să spună clar asta |
| 9 | ursul-brun-vs-ursul-polar | ambele | urs brun vs urs polar | RO | Urs brun vs urs polar: diferențe și asemănări | Urs brun vs urs polar: diferențe | |
| 10 | lupul-cenusiu-vs-vulpea-rosie | ambele | lup vs vulpe | RO | Lup vs vulpe: diferențe de mărime și comportament | Lup vs vulpe: diferențe | faună din România: link spre `salbatice` |
| 11 | ragdoll-vs-british-shorthair | ambele | ragdoll vs british shorthair | INT | Ragdoll vs British Shorthair: diferențe | Ragdoll vs British Shorthair: diferențe | |
| 12 | maine-coon-vs-ragdoll | ambele | maine coon vs ragdoll | INT | Maine Coon vs Ragdoll: mărime și temperament | Maine Coon vs Ragdoll: diferențe | |
| 13 | maine-coon-vs-pisica-norvegiana-de-padure | ambele | maine coon vs norvegiană de pădure | INT | Maine Coon vs Pisica Norvegiană de Pădure | Maine Coon vs Pisica Norvegiană de Pădure: diferențe | confuzie frecventă între rase |
| 14 | orca-vs-delfinul-comun | ambele | orca vs delfin | RO | Orca vs delfin: orca este de fapt un delfin? | Orca vs delfin: orca este de fapt un delfin? | orca e delfinid; hook informațional |
| 15 | lupul-cenusiu-vs-ursul-brun | ambele | lup vs urs | RO | Lup vs urs brun: diferențe în sălbăticie | Lup vs urs brun: diferențe | fără „cine câștigă" |
| 16 | labrador-vs-ciobanesc-german | ambele | labrador vs ciobănesc german | INT | Labrador vs Ciobănesc german: diferențe | Labrador vs Ciobănesc german: diferențe | |
| 17 | golden-retriever-vs-husky-siberian | ambele | golden retriever vs husky | INT | Golden Retriever vs Husky: diferențe | Golden Retriever vs Husky Siberian: diferențe | |
| 18 | chihuahua-vs-pomeranian | ambele | chihuahua vs pomeranian | INT | Chihuahua vs Pomeranian: diferențe | Chihuahua vs Pomeranian: diferențe | |
| 19 | ursul-polar-vs-ursul-grizzly | ambele | ursul polar vs ursul grizzly | RO | Urs polar vs grizzly: diferențe | Urs polar vs grizzly: diferențe | leagă de #8 și #9 (cluster „urși") |
| 20 | scottish-fold-vs-ragdoll | ambele | scottish fold vs ragdoll | INT | Scottish Fold vs Ragdoll: diferențe | Scottish Fold vs Ragdoll: diferențe | |

Clustere pentru linkuri încrucișate: **retriever/ciobănesc** (1, 2, 3, 16, 17), **pisici mari/pufoase** (11, 12, 13, 6, 20), **marine** (4, 5, 14), **urși/lup** (8, 9, 15, 19, 10).
Livrare sugerată: ritmul din PLAN-F4 (1 comparație/zi din 21.11); ordinea 1–10 acoperă cele mai clare semnale RO.

### Comparații cu cerere RO dar care cer fișă nouă întâi
| Comparație | Fișă lipsă | Prioritate |
|---|---|---|
| husky vs malamut | malamut de Alaska | **foarte mare** (autocomplete „sau" + „vs"; deja în keyword-map) |
| ciobănesc german vs malinois / vs ciobănesc belgian | malinois (+ belgian) | mare |
| bulldog francez vs pug (mops) / vs bulldog englez | pug, bulldog englez | mare |
| rottweiler vs doberman / vs cane corso | doberman, cane corso | medie |
| chihuahua vs pinscher pitic | pinscher pitic | mică |
| lup vs câine (ciobănesc german / husky) | — (fișe există) | publicabil ca `lupul-cenusiu-vs-ciobanesc-german` dacă se acceptă cadrul „specie vs rasă" |
| pisică vs câine (apartament) | model: nu este pereche de fișe | vezi §7 (bug/gol) |

Verificare înainte de programare: pentru comparațiile de faună (4, 5, 8–10, 14, 15, 19) se deschid cele două fișe și
se confirmă că au **cel puțin 6 rânduri comune** în spec grid (altfel tabelul are multe „—"). Pe pagina de comparație
rândurile se generează din `specs`+`behavior`; câmpurile `nivel_energie`, `naparleste`, `bun_cu_copiii` sunt specifice
raselor domestice.

---

## 5. „Rase asemănătoare cu X" (echivalentul „alternatives to X")

Nu există model pentru ele (vezi §7). Recomandare: tratate ca **liste curate** (`/liste/rase-asemanatoare-cu-<x>`) cu
membri alesi manual (slug-uri) + 1–2 propoziții per rasă (diferența care contează), ItemList + FAQ.

| # | URL țintă | Cuvânt-cheie | Semnal | Fișe disponibile acum | De scris întâi | Title tag | H1 |
|---|---|---|---|---|---|---|---|
| 1 | /liste/rase-asemanatoare-cu-labrador | rase asemănătoare cu labrador | **niciun semnal RO** (INT: „dogs similar to labs") | golden, vizsla, pointer englez, setter irlandez (4) | — (livrabil imediat) | Rase asemănătoare cu Labradorul: 6 alternative | Rase asemănătoare cu Labradorul |
| 2 | /liste/rase-asemanatoare-cu-cane-corso | rase de câini asemănătoare cu cane corso | RO | rottweiler, dog de bordeaux, alabai, ciobănesc caucazian, anatolian | **cane corso** | Rase asemănătoare cu Cane Corso: alternative | Rase de câini asemănătoare cu Cane Corso |
| 3 | /liste/rase-asemanatoare-cu-bichon | rase de câini asemănătoare cu bichon | RO | bichon frise, coton de tulear, lagotto | maltez, havanez, pudel pitic | Rase asemănătoare cu Bichon Frise | Rase de câini asemănătoare cu Bichonul |
| 4 | /liste/rase-asemanatoare-cu-husky | rase de câini asemănătoare cu husky | RO | ciobănesc cehoslovac (parțial) | malamut, samoyed, laika, eschimos | Rase asemănătoare cu Husky: 5 alternative | Rase de câini asemănătoare cu Husky |
| 5 | /liste/rase-asemanatoare-cu-pitbull | rase asemănătoare cu pitbull | RO | amstaff | staffordshire bull terrier etc. | — | **amânat**: subiect cu legislație/risc; doar cu text prudent, surse oficiale |

---

## 6. Liste roundup (6 de deblocat) + câmpurile de completat

Pragul din `lib/lists.ts`: ≥ 8 intrări și ≤ 80% din fișele grupului. Starea de azi: 7 definiții în cod, 3 live
(mari, inteligente, pisici liniștite); mici/medii/apartament sunt blocate de număr; celelalte nu au definiție în cod.

| # | URL | Cuvânt-cheie (semnal) | Title tag | H1 | Definiție în cod? | Câmpuri de completat | Fișe noi necesare |
|---|---|---|---|---|---|---|---|
| 1 | /liste/rase-de-caini-pentru-copii | cele mai bune rase de câini pentru copii (RO) | Rase de câini pentru copii: lista fișelor | Rase de câini potrivite pentru copii | **nu** (de adăugat, `is(f,'bun_cu_copiii','Da')`) | `bun_cu_copiii` (Da/Nu) pe toate cele ~30 de fișe de câini; ≥ 8 „Da", ≤ 24 | nu |
| 2 | /liste/rase-de-caini-pentru-apartament | pentru apartament (RO) | Rase de câini pentru apartament: lista DiVet | Rase de câini pentru apartament | da (există) | `talie` și `nivel_energie` pe toate fișele; (opțional `toleranta_singuratate`) | probabil 3–5 rase mici/medii cu energie scăzută (cavalier, shih tzu, pug, bichon maltez) |
| 3 | /liste/rase-de-caini-care-naparlesc-putin | rase de câini care nu năpârlesc (RO) | Rase de câini care năpârlesc puțin: lista | Rase de câini care năpârlesc puțin | **nu** (slug în keyword-map, absent din `LISTS`) | `naparleste` pe toate fișele (valoare scăzută); evită formularea „nu năpârlesc / hipoalergenic" | pudel, schnauzer pitic, havanez, maltez, yorkshire (acum ar fi ~4: bichon, coton, lagotto, schnauzer uriaș) |
| 4 | /liste/rase-de-pisici-pentru-apartament | cele mai bune rase de pisici pentru apartament (RO) | Rase de pisici pentru apartament: lista DiVet | Rase de pisici pentru apartament | **nu** (grup `pisici` există) | `nivel_energie`, `toleranta_singuratate` pe cele ~19 pisici | nu |
| 5 | /liste/rase-de-pisici-care-naparlesc-putin | pisici care nu năpârlesc (RO) | Rase de pisici care năpârlesc puțin | Rase de pisici care năpârlesc puțin | **nu** | `naparleste` pe pisici (candidați: sphynx, siameză, orientală, abisiniană, burmeză, bombay) | posibil 2–3 (devon rex, cornish rex) pentru ≥ 8 |
| 6 | /liste/rase-de-caini-pentru-paza | cele mai bune rase de câini pentru pază (RO) | Rase de câini de pază: lista fișelor DiVet | Rase de câini pentru pază | **nu**; nu există câmp | câmp nou `utilizare` (sau `rol`) cu valori (companie, pază, vânătoare, ciobănesc) — sau se folosește eticheta existentă `caini-de-paza` | nu (ciobănești, rottweiler, dog de bordeaux, alabai, ciobănesc caucazian etc.) |

Rezervă / mai târziu: rase de câini mici și medii (blocate de număr; `talie`), rase de pisici pentru copii
(`bun_cu_copiii` la pisici), „cele mai mari animale din lume" (`greutate_max_kg`) și „animale periculoase din România"
(`pericol`) — acestea două necesită extinderea modelului de liste dincolo de grupurile `caini`/`pisici` (§7) și mai multe fișe de faună.

Reguli: titlurile de mai sus **nu conțin „DiVet"** (se adaugă automat; vezi §7 bug 6); „cele mai bune" se evită când lista nu e
clasată (folosim „lista fișelor"), ca să nu promitem un clasament.

---

## 7. Goluri și bug-uri care afectează SEO (cu fișiere)

Verificate în cod (`D:\Projects\Velocity\velocitycms`) și pe paginile live.

1. **Titlu dublat cu brandul pe liste (live):** `lib/lists.ts` (câmpul `metaTitle` conține „… DiVet") + `app/(frontend)/liste/[slug]/page.tsx` (titlul = metaTitle + " | " + siteName) → `<title>` live: „Rase de câini mari: lista fișelor DiVet | DiVet". Scoate „DiVet" din cele 7 `metaTitle`.
2. **`speakable` nu se potrivește:** `lib/seo/schema-generator.ts` emite `cssSelector: ['article h1', '[data-speakable="tldr"]']`, dar `components/frontend/templates/divet/ComparisonTemplate.tsx` nu are element `<article>`; doar a doua selecție se potrivește. Înfășoară conținutul în `<article>` sau schimbă selectorul.
3. **Hub `/comparatie` subțire și indexabil (live):** `app/(frontend)/comparatie/page.tsx` — răspunde 200 cu 0 comparații, `generateMetadata` nu setează `alternates.canonical` (live: lipsește canonical), nu setează `robots`; schema live conține doar FAQPage (fără BreadcrumbList/CollectionPage/ItemList). Pune `noindex` până sunt ≥ 6–8 comparații, adaugă canonical + CollectionPage/ItemList (cum face `/liste`).
4. **`generateMetadata` din comparație incomplet:** `app/(frontend)/comparatie/[slug]/page.tsx` — fără `openGraph`/`twitter`, fără `robots` din `post.noIndex` (e trimis doar în schema), `${title} | ${siteName}` poate duplica brandul dacă `metaTitle` îl conține, căutarea postării folosește `slug` fără `siteId` și fără verificarea că postarea e în categoria `comparatie`.
5. **Orice postare cu `postA_slug`/`postB_slug` se servește la `/comparatie/<slug>`** indiferent de categorie (page.tsx nu verifică `category.slug === 'comparatie'`): risc de URL duplicat față de URL-ul real al postării.
6. **Nume lungi ale fișelor în tabel/carduri/ItemList:** `lib/comparison-data.ts` returnează `p.title` (ex. „Alabai - Rasă de câini: caracteristici, îngrijire și sănătate"), folosit în antetele de coloană și în cardurile H2 din `ComparisonTemplate.tsx`, iar în listele live apar tot titlurile lungi în ItemList. Folosește un nume scurt (`nume_scurt`/derivare înainte de „ - " sau „:").
7. **Ordine de conținut slabă pentru GEO:** în `ComparisonTemplate.tsx` ordinea e carduri → tabel → verdict → proză (primul paragraf-răspuns e sub tabel). Mută „Pe scurt"/primul paragraf de 40–55 de cuvinte deasupra tabelului; adaugă `<caption>` la tabel.
8. **Fără autor/dată vizibile** în `ComparisonTemplate.tsx` (în schema există; vizibil nu): slăbește E-E-A-T și prospețimea. Adaugă „Actualizat la <dată>" + autor.
9. **„Alte comparații" nerelevante:** `app/(frontend)/comparatie/[slug]/page.tsx` ia ultimele 6 din categorie; ar trebui prioritizate cele care împart o fișă cu pagina curentă (`getComparisonsFor` face deja căutarea). Lipsesc linkuri din pagina de comparație către listele care conțin cele două rase (`getListsForBreed`) și către articolele de sănătate (`rase_predispuse`).
10. **Perechea nu este canonicalizată:** `lib/comparison-data.ts` nu previne `a-vs-b` și `b-vs-a` (două pagini pe aceeași intenție); nu există redirect 301 pentru ordinea inversă. Adaugă validare la publicare (pereche neordonată unică) sau redirect.
11. **Modelul nu poate găzdui „pisică sau câine":** `getComparisonPair` cere două fișe publicate; `/comparatie/pisica-sau-caine` din `docs/seo/keyword-map.csv` ar da 404. Soluție: articol-hub separat (ghid) sau extensie de model.
12. **Liste: model prea îngust.** `lib/lists.ts` are `ListGroup = 'caini' | 'pisici'`, iar `lib/lists-data.ts#loadGroupPosts` încarcă doar categoria `rase`: nu se pot face liste de faună (`pericol`, `greutate_max_kg` — NUMBER, deja în `scripts/seed-field-definitions.ts`) și nici liste curate pentru „asemănătoare cu X" (nu există membri manuali). `bun_cu_copiii` există ca câmp, dar nicio listă nu îl folosește.
13. **`lastmod` fals pentru liste:** `app/sitemap.ts` pune pe toate listele `lastModified = newestPostUpdate` (cea mai recentă modificare din tot site-ul). Calculează maximul `updatedAt` al membrilor fiecărei liste.
14. **„Cele mai inteligente rase" fără clasament:** lista (14 din ~30 de rase) e sortată alfabetic (`orderBy title`) dar intitulată „cele mai…"; ItemList nu declară `itemListOrder`. Declară `ItemListUnordered` sau schimbă titlul în „Rase de câini ușor de dresat".
15. **Metadate liste:** `openGraph` fără imagine, fără `twitter` (`liste/[slug]/page.tsx`).
16. **Date lipsă care blochează liste:** `naparleste`, `greutate_max_kg`, `pericol` (și `bun_cu_copiii`, `toleranta_singuratate` pe unele fișe) — fără ele nu se pot publica listele 1, 3, 4, 5 din §6.

---

## 8. Ordinea recomandată de lucru

1. Corecturi rapide de cod (1, 2, 3, 6, 7, 8, 13, 14) — mici și fără risc.
2. Completat `naparleste`, `bun_cu_copiii`, `nivel_energie`, `toleranta_singuratate` pe toate fișele de câini/pisici (cheia pentru liste 1–5).
3. Comparațiile 1–10 (§4), apoi 11–20; în paralel fișele: malamut, malinois, pug, bulldog englez, cane corso.
4. Definițiile noi de liste în `lib/lists.ts` (copii, năpârlire puțină ×2, pisici apartament, pază) cu intro + FAQ scrise de om.
5. După 2–3 săptămâni, GSC: înlocuiește ordinea din acest document cu impresii reale.
