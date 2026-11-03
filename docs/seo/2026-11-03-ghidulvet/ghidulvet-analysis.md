# ghidulvet.ro competitive teardown (collected 2026-11-03)

Method: curl with browser UA; single sitemap.xml parsed locally; 13 pages fetched and parsed (title/meta/H/JSON-LD/links). "OBS" = observed, "INF" = inference.

## 1. Size & architecture

- OBS: Next.js app on Vercel (X-Powered path `/_next/static`, `Server: Vercel`, `X-Nextjs-Prerender`). NOT WordPress. No generator meta.
- OBS: robots.txt: `User-agent: *` Allow / ; Disallow /api/ /dashboard/ /admin/ /auth/ /_next/ /autentificare; `meta-externalagent` Disallow /; Sitemap: https://ghidulvet.ro/sitemap.xml. No rules for GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot (so all allowed by wildcard).
- OBS: /llms.txt and /llms-full.txt -> 404. No sitemap index; one flat sitemap.xml (2.48 MB) with **13,178 URLs**.
- OBS lastmod: 12,306 URLs = 2026-11-01 (bulk regeneration stamp, meaningless as velocity signal); 819 = 2026-08-28; 2026-04-24/25 (29), 2026-05-04 (13), 2026-07-04 (7), 2026-10-10/13 (4). Article pages show "Actualizat 24.04.2026 / 25.04.2026 / 04.05.2026". INF: the editorial corpus was written in a burst Apr-May 2026 (~100 pages), with little since; site is very young (company TOP GUIDE SRL, J2026036188000, registered 2026). Publishing velocity of real content is NOT a steady cadence; growth is programmatic (directory data).
- URL counts per section (OBS):
  | Section | URLs | Type |
  |---|---|---|
  | /veterinari/ | 8,978 (42 county hubs + ~2,700 locality + 6,209 /veterinari/cabinet/{slug}) | clinic directory (ANSVSA register) |
  | /farmacie-veterinara/ | 2,145 (139 county/city + 2,005 pharmacy) | pharmacy directory |
  | /proceduri/ | 1,511 (10 hubs + 1,500 = 10 procedures x 150 localities: vaccinare-caine/pisica, sterilizare-caine/pisica, castrare-caine/pisica, microchipare, eutanasiere, detartraj-dentar, consult-veterinar) | programmatic local x service |
  | /veterinari-la-domiciliu/ | 151 | local |
  | /calculatoare/ | 135 (15 tools + 119 /ce-pot-manca/{food} pages) | tools + "can dogs eat X" |
  | /rase/ | 55 (~29 dog + ~25 cat breeds) | breed pages |
  | /ghiduri/ | 50 | guides, incl. symptom-triage guides, small-pets |
  | /urgente-24-7/ | 44 (county pages + 1 city) | emergency local |
  | /boli/ | 27 (+ hubs /boli/caine, /boli/pisica) | disease pages |
  | /toxic/ | 21 | toxic plants/meds/foods |
  | /top/ | 13 | listicles |
  | /simptome/ | 11 | symptom checkers |
  | /magazin/ | 10 | affiliate shop categories |
  | /specializari/ | 9, /castrare-gratuita/ 9 | vet specialties; free-neutering by city |
  | other | vaccinare-caine-pisica, sterilizare-castrare, microcip-pasaport-animale, despre, contact, confidentialitate, revendica, pentru-cabinete | |
- INF: ~11,800 of 13,178 URLs (~90%) are programmatic directory/local pages. Real editorial content is only ~230 URLs (rase 55 + ghiduri 50 + boli 27 + toxic 21 + simptome 11 + top 13 + 15 tools + 119 ce-pot-manca ≈ 311 incl. thin food pages).
- Nav (OBS): Calculatoare, Ghiduri, Rase, Simptome, Boli, Magazin, Veterinari, Pentru cabinete, Urgențe 24/7. Footer adds Proceduri, Toxic, Top-uri, Specializări, Veterinari la domiciliu, Castrare gratuită, Despre, Contact, Confidențialitate, Termeni, Corectare/eliminare date, Setări cookie, Informații afiliere, company data.
- No tag pages, no pagination seen in sitemap; no blog/date-based URLs. Flat 2-level silo URLs, no dates. Hubs: /boli (+/boli/caine, /boli/pisica), /ghiduri, /rase, /simptome, /toxic, /top, /calculatoare, /veterinari/{county}.
- Homepage stats: 8,214 clinics in register, 42 counties, "București 758, Timiș 368, Iași 360, Argeș 290, Cluj 279"; "Urgențe 24/7: 1" (sparse - INF data thin there).

## 2. Content types / templates (with examples)
1. County clinic hub: /veterinari/bihor ("234 verificate"; CollectionPage+ItemList; 46 internal links)
2. Locality listing: /veterinari/iasi/letcani
3. Clinic profile: /veterinari/cabinet/sc-delipan-vet-srl-vaslui (VeterinaryCare+PostalAddress, map, Waze link, affiliate product box, "claim your clinic")
4. Pharmacy: /farmacie-veterinara/barlad/sc-twovet-farm-srl-vaslui
5. Procedure x locality: /proceduri/vaccinare-caine/codlea, /proceduri/detartraj-dentar/cehu-silvaniei (151 each x 10)
6. Home-visit vet: /veterinari-la-domiciliu/pitesti
7. Emergency by county: /urgente-24-7/bucuresti
8. Free neutering by city: /castrare-gratuita/bucuresti
9. Breed page: /rase/labrador-retriever, /rase/ciobanesc-mioritic, /rase/maine-coon
10. Disease page: /boli/parvoviroza-caine, /boli/babesioza-caine, /boli/fiv-pisica
11. Symptom checker (interactive triage): /simptome/vomita, /simptome/schiopata
12. Care/emergency guide: /ghiduri/vaccinari-catel, /ghiduri/caine-vomita, /ghiduri/caine-a-mancat-ciocolata
13. Toxicity: /toxic/xilitol, /toxic/ibuprofen, /toxic/crini-pisica
14. Calculators (15): varsta-caine, varsta-pisica, hrana-caine, hrana-pisica, sarcina-caine/pisica, barf-caine, greutate-ideala-caine/pisica, necesar-apa-zilnic, costuri-adoptie-animal, dozare-medicamente, calendar-vaccinari, convertor-unitati
15. "Can they eat X": /calculatoare/ce-pot-manca/ciocolata (119 pages, ~340 words each)
16. Listicles: /top/top-10-rase-caini-mici, /top/top-cabinete-veterinare-bucuresti
17. Affiliate shop categories: /magazin/jucarii
18. Specialty hubs: /specializari/ortopedie
No Q&A forum, no glossary, no quizzes, no comparison (X vs Y) pages, no drug guides (only /toxic human meds + dozare calculator), no marine/insect/wildlife content.

## 3. Deep sample (OBS)

| Page | Title | Meta desc | H1 | Words | Schema | FAQ | Imgs | Int/ext links | Author/date | Disclaimer | Monetization |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | Ghidul Vet — Pentru animalele pe care le iubești | "Găsește cabinete veterinare în toată România, urgențe 24/7 ..." | Găsești veterinarul potrivit. Îți îngrijești mai bine animalul. | ~320 | Organization only (sameAs: []) | no | 1 | 19/0 | - | footer only | none visible |
| /boli/parvoviroza-caine | Parvoviroza canină: simptome, tratament, prevenire · Ghidul Vet | "...Conținut medical educațional Ghidul Vet." | Parvoviroza canină (H1 duplicated in DOM) | ~1,160 | Organization, BreadcrumbList, FAQPage, MedicalCondition (+MedicalSignOrSymptom, MedicalTherapy, MedicalTest) | yes, 7 details | 1 | 10/0 | no author, no date; "Surse: Merck Veterinary Manual, WSAVA, Cornell, AAHA, AVMA" as text (no links) | yes ("consultă un medic veterinar autorizat") | none |
| /rase/labrador-retriever | Labrador Retriever: caracter, îngrijire, sănătate | "25-36 kg, 10-13 ani de viață..." | Labrador Retriever: caracter, îngrijire, prețuri | ~750 | Article, WebPage, ImageObject, SpeakableSpecification, FAQPage, BreadcrumbList | yes | 5 (1 hero w/ descriptive alt; 4 eMag product images) | 10/4 profitshare->emag | none; no date | no | Heavy: 4 profitshare affiliate products |
| /ghiduri/vaccinari-catel | Schema de vaccinări pentru cățel — calendar complet | "Calendarul complet de vaccinări..." | same | ~1,050 | Article (author = Organization "Ghidul Vet"), FAQPage, Speakable, Breadcrumb | yes (8 details) | 2 | 4/1 | "Actualizat 24.04.2026", 11 min read; author = Organization | no (!) | 1 affiliate link |
| /ghiduri/caine-vomita | Câinele vomită — când e normal și când suni veterinarul | good | H1 has missing diacritics ("vomita: cand e normal si cand suni") | ~960 | Article+FAQ+Speakable | yes | 2 | 8/1 | updated 04.05.2026; Org author | yes | 1 affiliate; "Cat de urgent este?" top box, 30-min steps, "Ce NU faci" |
| /simptome/vomita | Câinele meu vomită sau pisica mea vomită — ce e de făcut | "triage interactiv..." | same | ~1,400 | MedicalCondition, MedicalSignOrSymptom, TherapeuticProcedure, MedicalRiskFactor, MedicalGuideline, MedicalEvidenceLevel, FAQPage | yes | 3 | 13/2 | none | yes | affiliate shampoos |
| /toxic/xilitol | Xilitol: toxic la câine, ce să faci urgent | ... | duplicated H1 | ~840 | MedicalCondition (+AnatomicalSystem, Risk, Test, Therapy), EmergencyService, FAQPage | yes | 4 | 7/3 | none; "Surse" (ASPCA APCC...) | yes | 3 KONG affiliate links |
| /calculatoare/varsta-caine | Calculator vârstă câine în ani umani | "...Wang et al. 2020" | Câți ani are câinele tău, cu adevărat? | ~710 | SoftwareApplication+Offer, FAQPage | yes | 3 | 4/2 | none | no | 2 affiliate (Royal Canin) |
| /calculatoare/ce-pot-manca/ciocolata | Ciocolată — toxic pentru câini și pisici | thin templated | Ciocolată | ~340 | FAQPage, Breadcrumb | yes | 0 | 7/0 | none | no | none |
| /top/top-10-rase-caini-mici | Top 10 cele mai mici rase de câini | ok | same | ~1,030 | Article, ItemList, FAQPage, Speakable | yes | 0 images (!) | 25/0 | "Actualizat 25 aprilie 2026"; Org author | no | none. Content bug: list of "dog breeds" includes Devon Rex, Cornish Rex, Siamez, Abisinian, Orientală, Balineză = CAT breeds |
| /veterinari/bihor | Cabinete veterinare Bihor — 234 verificate | "234 cabinete ..." | Veterinari în Bihor | ~400 | CollectionPage+ItemList, Breadcrumb | no | 0 | 46/0 | n/a | no | none |
| /veterinari/cabinet/... | SC Delipan Vet SRL — Cabinet veterinar în Boțești | auto-generated address | SC Delipan Vet SRL | ~430 | VeterinaryCare+PostalAddress | no | 3 | 9/4 | n/a | no | 2 affiliate Royal Canin products on a clinic page |
| /despre | Despre · Ghidul Vet | ... | O platformă independentă... | ~420 | Organization only | no | 0 | | | | |

Common: no TOC seen, no tables except 1 (vaccination schedule), no TL;DR box except the "Cât de urgent este?" and "Acțiune imediată" blocks on emergency pages, FAQ as `<details>` accordions (5-8 Q's) mirrored in FAQPage JSON-LD. Breadcrumbs everywhere. Images: almost none original (programmatic /og image for OG; breed hero image; eMag CDN product images). No external citations as hyperlinks (sources are plain text lists; 0 outbound editorial links).

## 4. Technical (OBS)
- HTTPS enforced, HSTS 2 years, www/apex not tested deeply. Canonicals self-referencing, absolute, no trailing slash. `robots: index, follow`. lang="ro". No hreflang (fine). OG tags 4-10 per page, dynamic OG images at /og?title=...
- Next.js SSR/ISR on Vercel (fra1). `Cache-Control: public, max-age=0, must-revalidate`, X-Vercel-Cache HIT, Age up to 165,000 s. HTML sizes 58 KB-207 KB (home 110 KB).
- TTFB measured (single runs, from my location, partly cold): home 1.06 s and 0.43 s (cached); /rase/labrador 1.18 s; /boli/parvo 2.26 s then 3.5 s; /ghiduri/vaccinari 6.8 s; /calculatoare/varsta-caine **29 s TTFB**; /top/... 2.8 s with 25 s total; /veterinari/bihor 7.9 s. INF: ISR/serverless cold-start problems at origin; heavy variance - possible CWV/crawl-budget risk with 13k URLs.
- Viewport present; Next/Image lazy-loading on some images (hero not lazy). Security headers decent (X-Frame, nosniff, Referrer-Policy, Permissions-Policy).
- No llms.txt. No AI-bot-specific rules except blocking Meta's externalagent.
- Single sitemap with changefreq/priority (ignored by Google); all lastmod = build timestamp -> unreliable.

## 5. Trust / brand (OBS)
- /despre: anonymous "platformă independentă"; no team, no named vets, no credentials. States sources (WSAVA, AAHA/AAFP, NRC, ASPCA APCC, Merck, CMVRO, DSVSA, OSM). Says "nu simulăm autoritate medicală". No editorial policy page, no vet-review process claim; "ghiduri scrise cu același standard..." only. Footer: TOP GUIDE SRL, CUI 54815518, J2026036188000, address in Teleorman, contact@ghidulvet.ro + contact form, Netopia Payments + ANPC SAL logos (suggests paid cabinet plans / shop). Cookie settings link exists. Organization schema `sameAs: []` => no social profiles. No newsletter seen. Revenue plan declared: AdSense + affiliate (profitshare/eMag, already live) + Pro/Premium clinic listings; "Revendică cabinetul" claim flow (/revendica) and /pentru-cabinete.
- Article schema author = Organization, not Person: **zero Person/vet EEAT**.

## 6. Topic coverage map
Clusters (approx pages): Local vet directory ~9,000; pharmacies ~2,150; procedure x city ~1,500; home vets 151; emergency 44; "ce pot mânca" 119; calculators 15; breeds 55; guides 50 (≈12 health/emergency, ≈10 species other than dog/cat, hrană, adoption, behavior); diseases 27; toxic 21; symptoms 11; listicles 13; specialties 9; shop 10.

Specific topics (RO phrasing as on site):
Boli: parvoviroza canină, ciumar canin, leishmanioza, dirofilarioza, babesioza, ehrlichioza, parainfluenza canină, hepatita infecțioasă canină, leptospiroza, displazia de șold, otita externă, dermatita atopică, torsiunea gastrică, diabet câine/pisică, epilepsie câine, panleucopenie pisică, FIV, FeLV, coriza pisicii, calicivirus, PIP, boala renală cronică pisică, hipertiroidism pisică.
Simptome: vomită, diaree, nu mănâncă, șchiopătează, respiră greu, convulsii, letargic, sângerare, mâncărime, urinare anormală.
Ghiduri: prima vizită la veterinar, vaccinări cățel, alegerea hranei câine/pisică, semnale de urgență, sterilizare, deparazitare, adopție primele 30 zile, body condition score, călătorie cu animalul (pașaport), microcipare obligatorie 2026, comenzi de bază, anxietate de separare, călătorie cu mașina, câine bătrân, mușcătură de câine prim ajutor, toaletare, pisică indoor vs outdoor, litieră, hidratare pisică, adopție pisică din adăpost, iepure/cobai/hamster/papagal/canar/țestoasă/gecko, câinele a mâncat ciocolată/struguri, câinele vomită/nu mănâncă/convulsii/respirație grea/diaree cu sânge, pisica nu urinează/vomită/respiră cu gura deschisă/nu mănâncă, animal mușcat de viperă, acvariu începător, hrană pisică sterilizată/kitten/puppy, căpușe & babesioză prevenire, toxice de sărbători, caniculă.
Toxic: crini pisică, azalee, iederă, lalele, xilitol, ibuprofen, paracetamol, aspirină, ADHD amphetamine, SSRI, pseudoefedrină, vitamina D3, antigel, nicotină, ciuperci.
Tools: calculator vârstă câine/pisică, hrană, sarcină (gestație), BARF, greutate ideală, necesar apă, costuri adopție, dozare medicamente, calendar vaccinări.
Local/commercial: cabinete veterinare {județ}, veterinar urgență non-stop, veterinar la domiciliu {oraș}, sterilizare pisică {oraș}, castrare gratuită {oraș}, detartraj dentar, eutanasiere, microchipare.

Overlap with divet.ro: breeds (they have only ~55, popular ones); none of marine/insect/wildlife.

## 7. Strengths / weaknesses

Strengths to match:
- Massive programmatic local footprint (13k URLs) built from an official ANSVSA/CMVRO register: clinic + pharmacy + procedure-by-locality + emergency pages, with VeterinaryCare/CollectionPage/ItemList schema. Hard to replicate for a breed encyclopedia and not our fight.
- Health intent coverage: symptom-triage pages, "câinele a mâncat X" emergency guides, 119 "can dogs eat X" pages, toxic list, tools (calculators with SoftwareApplication schema).
- Rich medical schema (MedicalCondition, MedicalSignOrSymptom, MedicalGuideline, FAQPage, Speakable) and FAQ accordions on every content page; clean canonicals; HSTS; Next.js architecture with fast cached pages.
- Clear urgency-first UX ("Cât de urgent este?", 30-minute steps).
- Affiliate stack already live (profitshare/eMag), AdSense planned.

Exploitable weaknesses:
1. EEAT: anonymous org, no named vet, no reviewer, no credentials, Article author = Organization. For YMYL health content that is a major gap -> a named DMV author/reviewer with Person schema + reviewedBy + dated "revizuit de" would outrank on trust.
2. Sources are plain-text lists, no outbound links to Merck/WSAVA/etc.; no dates on /boli and /toxic pages (no datePublished/dateModified), no dates on breeds.
3. Editorial depth thin: 750-1,400 words, breed pages ~750 words, ce-pot-manca ~340 words templated (119 pages risk thin/duplicate), clinic pages are auto-generated (~430 words, affiliate product boxes on clinic pages). 90% of the sitemap is thin-programmatic: index-bloat/Helpful Content risk.
4. Only ~55 breeds; no sub-breed/vs/comparison content, no glossary, no Q&A, no quizzes; no marine/insect/wildlife/exotic encyclopedic coverage (our niche); very limited species content (iepure, hamster, cobai, papagal, canar, țestoasă, gecko, acvariu: one guide each).
5. Quality bugs: /top/top-10-rase-caini-mici lists cat breeds (Devon Rex, Siamez...) as dog breeds; H1 without diacritics on /ghiduri/caine-vomita; duplicate H1 in DOM; vaccination guide lacks disclaimer; only 1 24/7 emergency clinic indexed; lastmod all equal 2026-11-01.
6. Performance: erratic TTFB (up to 29 s on /calculatoare/varsta-caine, 6-8 s on several pages) even with Vercel cache HIT; Cache-Control max-age=0.
7. Images: virtually no original imagery; breed pages use 1 generic hero + eMag product thumbnails; list pages with zero images. No tables/TOC.
8. GEO: no llms.txt, no Person/sameAs, Organization sameAs empty, no social profiles, no newsletter, no external brand footprint (brand is days/months old). Blocks only Meta bot.
9. Content velocity: editorial burst Apr-May 2026, little visible since (INF from "Actualizat" dates).
10. Monetization-forward (profitshare affiliate on medical pages, e.g. KONG toys under xylitol toxicity) while claiming independence - inconsistent with /despre ("when we add affiliation we will mark visibly").

Opportunities for divet.ro (INF): own the species/breed encyclopedia long-tail they ignore (marine, insects, wildlife, exotics), add health sections per breed (breed-specific diseases linking to authoritative sources), real vet reviewer + Person schema, tables/TOC/original images, llms.txt, speakable/FAQ; don't chase local directory.
