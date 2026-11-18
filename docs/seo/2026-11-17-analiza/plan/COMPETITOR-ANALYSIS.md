# Analiză competitori — divet.ro, 17 noiembrie 2026

**Metodă și limite.** Competitorii au fost identificați prin căutări web (WebSearch este limitat la SUA și nu reproduce fidel SERP-ul Google România) pentru „rase de câini caracteristici temperament”, „boli la pisici simptome tratament”, plus rezultatele din `docs/seo/2026-11-03-ghidulvet/serp-geo.md` (20 de interogări, 03.11). Am descărcat 6 pagini de competitori (1 cerere fiecare) și am extras titlu, schema, cuvinte, linkuri. **Autoritatea de domeniu, traficul și numărul de pagini sunt estimări**, nu date Ahrefs/Moz. Ordinea nu este o clasare reală pe poziții.

## 1. Top 5 competitori pentru interogări informaționale despre animale (RO)

| # | Domeniu | Tip | Unde ne bate | Nivel de amenințare (est.) |
|---|---|---|---|---|
| 1 | **royalcanin.com/ro** | Brand de hrană, bibliotecă de rase și sănătate | „Rase de câini” (300+ fișe în „breed library”), boli la pisici (peritonită, FIV, FeLV, rinotraheită, clamidioză), pisoi/cățel | Mare (autoritate de brand, date FCI) |
| 2 | **ghidulvet.ro** | Vertical vet (Top Guide SRL, 2026) | Boli, simptome, toxice, calculatoare, director local, proceduri × oraș | Mare pe sănătate/local; mică pe enciclopedie |
| 3 | **stirileprotv.ro** (secțiunea „divers”) | Portal de știri cu articole de rase | Rase populare: rottweiler, chihuahua, cocker, bull terrier | Mare pe head terms |
| 4 | **bzi.ro** | Portal de știri | Rase românești (ciobănesc de Bucovina, lup cehoslovac), vaccinuri, boli | Medie |
| 5 | **playtech.ro** | Portal tech/lifestyle | Vaccinuri pisici/câini, vârsta câinelui, ce nu au voie să mănânce | Medie (sănătate/lifestyle) |

Alții observați (nu în top 5): **hillspet.ro** (brand hrană, boli), **mayavet.ro** (clinică, sindrom urologic), **spotmedia.ro**, **capital.ro**, **evz.ro**, **hornbach.ro** (bizar, dar apare la rase), **josera.com/ro**, **zooland.ro** (rezultate prin profit.ro). În cele 20 de interogări din 03.11, **nici divet.ro, nici ghidulvet.ro nu apăreau în top 10** (evidență slabă, tool US-only).

## 2. Profil pe competitor

### 2.1 Royal Canin România (`royalcanin.com/ro`)

- **Strategie:** bibliotecă de rase (300+, după datele FCI), secțiuni „Câine / Pisică / Pisoi / Sănătate și bunăstare”, articole de 600–900 de cuvinte, în mare parte traduse din rețeaua globală. Conținut orientat spre produs (diete).
- **Eșantion:** „Peritonita infecțioasă felină”: ~600 de cuvinte, H1 clar, ~13 mențiuni „medic veterinar”, 78 de linkuri interne; JSON-LD nu a fost detectat în HTML-ul servit (de verificat cu un test de rendering).
- **E-E-A-T:** brand mondial, „sfat veterinar” generic; fără autor numit în pagina eșantionată.
- **Slăbiciuni:** traduceri; pagini lungi pentru încărcare (~420 KB HTML); fără comparații X vs Y; fără faună; fișe de rasă uniforme fără întrebări reale.
- **Estimare:** DR foarte mare (≥ 80), trafic organic RO de ordinul sutelor de mii (est.).
- **Cum îl bat:** fișe mai adânci pe rase românești și rare, comparații, liste filtrate, sănătate cu surse primare linkate și recenzor numit. Nu pe head terms de rasă în prima etapă.

### 2.2 ghidulvet.ro

Preluat din `ghidulvet-analysis.md` (03.11). Rezumat:
- **13.178 de URL-uri** în sitemap (~90% programatic: 8.978 veterinari, 2.145 farmacii, 1.511 proceduri × oraș); editorial real: ~300 (55 rase, 50 ghiduri, 27 boli, 21 toxice, 11 simptome, 15 unelte, 119 „ce pot mânca”).
- **Schema**: MedicalCondition, MedicalSignOrSymptom, MedicalGuideline, FAQPage, SoftwareApplication, VeterinaryCare. Autor = Organization; fără persoană, fără recenzor, `sameAs` gol.
- **Slăbiciuni exploatabile:** anonim, fără recenzie; „ce pot mânca” subțire (~340 de cuvinte, 119 pagini); afiliere eMag pe pagini medicale; date neactualizate (lastmod = build); TTFB eratic (până la 29 s); erori de conținut (rase de pisici în „top rase de câini mici”); fără comparații, glosar, faună; fără `llms.txt`.
- **Estimare:** domeniu nou, DR mic (< 20), dar masă mare de URL-uri; risc propriu de index bloat și de actualizare „helpful content”.
- **Cum îl bat:** nu pe local. Pe sănătate: recenzor, surse linkate, triaj de urgență, `MedicalWebPage.reviewedBy`; pe unelte: mai puține, mai bune, cu surse; pe enciclopedie și comparații: monopol.

### 2.3 Știrile ProTV (`stirileprotv.ro/divers/...`)

- **Eșantion:** „Rottweiler, totul despre…”: ~1.860 de cuvinte, 7 H2, **NewsArticle** + `NewsMediaOrganization`, `Person`; ~30 de linkuri interne și ~90 externe (reclame/tracking), `title` de 92 de caractere (trunchiat în SERP), meta 187 (trunchiată), fără canonical vizibil în HTML-ul descărcat.
- **Strategie:** articole „evergreen” în mici serii (cocker, chihuahua, bull terrier, rottweiler), plus „top10” (rase potrivite bărbaților). Fără structură de date comparabilă (nicio fișă tabelară).
- **E-E-A-T:** brand media puternic, dar fără autor medical, fără surse citate la sănătate.
- **Slăbiciuni:** cadență imprevizibilă, pagini grele, fără FAQ structurat, fără update-uri vizibile.
- **Estimare:** DR foarte mare (≥ 75), cu avantaj pe head terms.
- **Cum îl bat:** fișe cu tabel de specificații, comparații, sursă primară; pe long tail unde ei nu au pagină.

### 2.4 BZI.ro

- **Eșantion:** „Ciobănesc Românesc de Bucovina. Iată ce trebuie să știi…”: ~1.530 de cuvinte, 2 H2 (struct. slabă), **NewsArticle**, `title` 85 de caractere, meta 373 de caractere (nu e meta, e un fragment lung), ~128 de linkuri externe.
- **Strategie:** articole tabloid-informative pe rase locale și sănătate (vaccinuri, boli).
- **Slăbiciuni:** structură slabă, meta nepotrivit, dată de modificare lipsă, fără FAQ/tabel; conținut de tip „clickbait”.
- **Cum îl bat:** fișă completă și structurată pentru rase românești (ciobănesc mioritic, carpatin, bucovina, copoi ardelenesc — noi avem trei dintre ele), cu `Dataset`-like tabel și sursă FCI/cinologie românească.

### 2.5 Playtech.ro

- **Eșantion:** „Ce vaccinuri se fac la pisici. Schema completă…” (09.07.2025): ~1.550 de cuvinte, 7 H2, **NewsArticle**, 67 de linkuri externe, `title` 65 de caractere, `dateModified` = `datePublished`.
- **Strategie:** capturare de interogări de sănătate cu intenție mare („cât costă, câte sunt, când se fac”), prezentat ca știre de serviciu; meta acceptabil.
- **E-E-A-T:** fără recenzor medical, o singură mențiune „medic veterinar” în text.
- **Slăbiciuni:** cifre de preț fără sursă, conținut nemodificat de 4 luni, fără tabel de schemă.
- **Cum îl bat:** `/sanatate/vaccinare/vaccinarea-pisoiului` (există) cu tabel de calendar, surse WSAVA/AAFP, recenzor, `reviewedBy`; fără prețuri inventate.

## 3. Comparație sintetică

| Criteriu | divet.ro | Royal Canin RO | ghidulvet.ro | ProTV | BZI | Playtech |
|---|---|---|---|---|---|---|
| Pagini enciclopedice (est.) | ~104 | 300+ rase + ~150 articole | ~300 (+11.800 programatice) | zeci | zeci | zeci |
| Schema | Article, FAQ, Speakable, MedicalWebPage, DefinedTermSet, WebApplication | slabă/neobservată | Medical*, FAQ, SoftwareApp, VeterinaryCare | NewsArticle | NewsArticle | NewsArticle |
| Autor | Redacția DiVet (Person, AI declarat) | brand | Organization | redacție | redacție | redacție |
| Recenzor medical | **nu** | nu numit | **nu** | nu | nu | nu |
| Tabel specificații/FAQ structurat | da | parțial | FAQ da | nu | nu | nu |
| Comparații X vs Y | 0 (prima ~22.11) | nu | nu | nu | nu | nu |
| Liste filtrate | 3 | listă de rase + filtre UI | 13 „top” | top10 ocazional | nu | nu |
| Unelte | 2 | calculator hrană (produs) | 15 | nu | nu | nu |
| Faună (marine/insecte) | **31 de articole** | nu | nu | rare | rare | rare |
| `llms.txt` | **da (+ full)** | nu (neverificat) | nu | nu | nu | nu |
| Viteză (observat) | 0,3–0,9 s cald, 2,5–25 s rece | mediu | 0,4–29 s | mediu | mediu | mediu |

## 4. Goluri de conținut (față de competitori)

**Unde sunt ei și noi nu (sau prea puțin):**
1. Boli (ghidulvet 27; noi 5): leishmanioză, dirofilarioză, leptospiroză, ehrlichioză, hepatită, parainfluenză, calicivirus, coriza, boală renală pisică, hipertiroidism, diabet, epilepsie, otită, dermatită atopică, torsiune gastrică, displazie de șold.
2. Simptome (ghidulvet 11; noi 7): șchiopătează (există), respiră greu, convulsii, letargic, mâncărime, urinare anormală, sângerare.
3. Toxice (21 la ghidulvet; noi 8): xilitol (există), ibuprofen, paracetamol, aspirină, azalee, iederă, lalele, antigel (există), nicotină, ciuperci.
4. Proceduri (sterilizare, microcipare 2026, deparazitare): sterilizare și microcipare lipsesc.
5. Animale mici de companie.

**Unde sunt ei absenți și noi putem domina:**
1. Faună marină/insecte/sălbatice: 31 de articole existente; țintă ≥ 10 pe subcategorie (acum: mamifere marine 5, rechini 5, nevertebrate 4, păsări marine 1, gândaci 6, exotice 3, mamifere sălbatice 7; lipsesc complet răpitoare, specii protejate, fauna României).
2. Rase rare și românești: ciobănesc mioritic, carpatin, copoi ardelenesc (există); de adăugat ciobănesc românesc de Bucovina, kangal, tosa inu; alabai există deja.
3. Comparații (0 la toți): labrador vs golden, husky vs malamut, maine coon vs norvegiană de pădure, pisică vs câine, ciobănesc german vs belgian, bichon frisé vs maltez, alabai vs kangal, savannah vs bengaleză etc.
4. Liste filtrate, inclusiv „care năpârlesc puțin” (necesită câmp nou).
5. Glosar cu `DefinedTermSet`.

## 5. Estimare de autoritate (nu măsurat)

| Domeniu | DR/DA (est.) | Bază |
|---|---|---|
| royalcanin.com | 80+ | brand global |
| stirileprotv.ro | 75+ | portal național |
| bzi.ro | 55–65 | portal |
| playtech.ro | 55–65 | portal tech |
| ghidulvet.ro | < 20 | domeniu nou, 0 mențiuni externe găsite |
| divet.ro | necunoscut; legacy din 2007 (Wayback 2007-09-13), relansat 10.2026 | de citit din Bing Webmaster/GSC (Linkuri) |

## 6. Concluzii acționabile

1. **Nu ne batem pe head terms de rase** în primele 6 luni (Royal Canin + știri). Țintim: rase rare/românești + comparații + liste + faună.
2. **Pe sănătate, singurul avantaj durabil față de ghidulvet.ro este recenzorul numit.** Fără el, pierdem la volum (27 de boli vs 5).
3. **Unelte:** 4 noi cu sursă primară (porție, vârsta pisicii, calendar vaccinare, greutate ideală/BCS); nu 119 pagini „ce pot mânca”, ci un verificator (există) + ~25 de pagini cu volum.
4. **Verificare lunară a SERP-ului** cu un tracker cu IP românesc sau manual (nu cu WebSearch SUA) pentru 30 de interogări: lista din `keyword-map.csv` (statusurile `exists`).
5. **Link-building ținta:** Royal Canin și știrile nu vor linka către noi; ținta sunt cluburi de rasă, adăposturi, bloguri de biologie, școli, asociații cinofile/feline, ONG-uri (vezi `IMPLEMENTATION-ROADMAP.md`, Faza 3).
