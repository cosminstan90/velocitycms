# SERP / GEO comparison: ghidulvet.ro vs divet.ro (2026-11-03)

## Method limits (read first)
The WebSearch tool is US-only, does not honor `site:`, and returns non-Google results with a lot of FR/IT/EN noise. It is NOT a faithful Romanian Google SERP. Neither domain appeared in any organic top-10 from ~20 queries. That is weak evidence of low rank, not proof. Real position data needs Search Console, a Romanian-IP rank tracker, or manual google.ro checks. Everything else below (robots, llms.txt, sitemaps, redirects, Common Crawl) was fetched directly and is reliable.

## Query x position (sample, ~20 of 30 run)
Positions: "-" = not in the returned list. Recurring other domains noted.

| Query | ghidulvet | divet | Domains seen |
|---|---|---|---|
| labrador caracteristici | - | - | hornbach.ro, foreign (FR/IT/EN) |
| pisica maine coon | - | - | hornbach.ro, capital.ro, royalcanin.com/ro, evz.ro, publi24.ro, Wikipedia |
| alabai rasa caracteristici | - | - | foreign/spam, Wikipedia |
| pisica savannah | - | - | EN only (icatcare, petmd, webmd) |
| parvoviroza caine simptome | - | - | bzi.ro, royalcanin.com/ro, hotnews.ro, biotur.ro |
| de ce vomita cainele | - | - | FR/IT only (santevet, zooplus.fr, my-personaltrainer.it) - Romanian gap |
| vaccinuri caini schema | - | - | royalcanin.com/ro, playtech.ro, bzi.ro, adevarul.ro, biotur.ro |
| castrare pisica | - | - | cats.org.uk (RO pdf), bzi.ro, IT sites |
| ce nu au voie cainii sa manance | - | - | capital.ro, royalcanin.com/ro, evz.ro, antena3, g4media, newsweek.ro, romaniatv |
| varsta caine in ani umani | - | - | playtech.ro, stirileprotv, newsweek.ro, evz.ro, digi24, capital.ro, bzi.ro |
| castravete de mare | - | - | playtech.ro, observatornews, digi24 (cucumber-vegetable noise) |
| balena cu cocoasa | - | - | noise (cocoa/coconut); no results at all |
| rechin taur | - | - | noise (taurine) |
| insecta bat | - | - | EN bat-fly papers |
| ghidulvet | - | - | not recognised (typo suggestions) |
| ghidulvet.ro (blocked own domain) | n/a | n/a | topguide.ro lists it as a Top Guide SRL project; no other mentions |
| divet.ro enciclopedie animale | - | - | book/encyclopedia sites |
| allowed_domains=ghidulvet.ro | indexed: ~10 URLs returned (clinic city pages, farmacie, calculatoare/ce-pot-manca, ghiduri/BCS) | | |
| allowed_domains=divet.ro | | indexed: 10 URLs returned, ALL legacy URLs (see below) | |

Not run (budget/tool quality): beagle, ciobanesc german temperament, rasa bichon, british shorthair pret, boli caini simptome, deparazitare pisica, caine vomita, pisica nu mananca, cat sa mananca un caine, cum dresez un catel, nisip pisici, licurici, site:/divet brand queries beyond above.

Recurring organic competitors (Romanian): royalcanin.com/ro, bzi.ro, playtech.ro, capital.ro, evz.ro, hornbach.ro, newsweek.ro, digi24, antena3, biotur.ro, publi24.ro, Wikipedia. Pet-vertical sites seen elsewhere: petscats.ro, infocaini.ro, veterinarladomiciliu.ro, magivet.ro. Big news/lifestyle publishers dominate informational head terms; vertical specialists are thin.

## Indexed-page estimates
- `site:` operator not supported; use sitemap and Common Crawl instead.
- ghidulvet.ro sitemap: 13,178 URLs. About 8,978 /veterinari (6,209 clinic pages), 2,145 /farmacie-veterinara, 1,511 /proceduri (10 procedures x ~151 cities), 151 /veterinari-la-domiciliu, 135 /calculatoare (120 ce-pot-manca), only 55 /rase, 50 /ghiduri, 27 /boli, 21 /toxic, 44 /urgente-24-7, 13 /top, 11 /simptome. It is a programmatic local-directory + calculators site; editorial depth is ~170 pages.
- divet.ro sitemap: 63 URLs only (hubs, tags, ~45 entity pages; sample showed breeds, marine, insects). Very small.
- Common Crawl CC-MAIN-2026-43: divet.ro 7 captures; ghidulvet.ro 0 in -43 (7 in -38 under /* query, a single index line count). Both barely crawled by CC; not a differentiator.

## Domain age
- divet.ro: Wayback first capture 2007-09-13 (www.divet.ro). Old domain with history, relaunched Oct 2026. Search index still holds legacy WordPress-style URLs (see risk).
- ghidulvet.ro: Wayback was offline during the check (Internet Archive "temporarily offline"); no age data. Sitemap lastmod all 2026-11-01 and Top Guide SRL portfolio suggest a recent 2026 build. RDAP/WHOIS (rotld) not reachable. Operator: Top Guide SRL (also ghidulfunerar.ro, anuntdeces.ro).

## AI / GEO signals
| Item | ghidulvet.ro | divet.ro |
|---|---|---|
| robots.txt AI bots | `User-agent: *` Allow /; only `meta-externalagent` disallowed. GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bingbot all implicitly allowed. Disallow /api /dashboard /admin /auth /_next | `User-agent: *` Allow /; disallow /admin /api /_next. All AI bots allowed. Two sitemaps incl. sitemap-images.xml |
| llms.txt | 404 | 200, well-formed (sections, A-Z index, sitemap, search) |
| Security/headers | Vercel-style, ETag | nginx, HSTS, CSP (ads), X-Frame DENY |
| Brand mentions off-site | Only topguide.ro (own company portfolio). No Wikipedia/Reddit/forum/FB hits found | None found |
| Press | None found | None found |
| Social profiles | None found linked on homepage (not verified deeply) | None found linked on homepage |
| Cited in answer-style queries | Not cited for "de ce vomita cainele" or "cat traieste un labrador" in sample; for food-safety content its calculators/ce-pot-manca pages are indexed | Not cited |

Answer-style citation landscape (de ce vomita cainele, varsta caine, ce nu au voie): news portals (playtech, bzi, capital, evz, digi24), Royal Canin RO, hornbach.ro. No specialist brand owns it; the field is open.

## Important risk found: divet.ro legacy URL index
The search engine returns divet.ro URLs from the OLD site: /caini/boston-terrier/, /caini/cocker-spaniel/, /caini/pudel/, /caini/akita-inu/, /caini/lagotto-romagnolo/, /caini/caini-inteligenti/, /articole/boala-addison-la-caine/, /salbatice/, with titles like "... - Site Title - DiVet". Redirect checks:
- /caini/copoi-ardelenesc -> 308 -> /caini/rase/copoi-ardelenesc (works)
- /caini/boston-terrier, /caini/labrador, /articole/boala-addison-la-caine -> 404 (no redirect)
- New canonical: /caini/rase/labrador-rasa-caini-caracteristici (200). Note some new slugs are keyword-stuffed (bichon-frise-rasa-caini-caracteristici, golden-retriever-caracteristici-temperament).
Action: 301-map every legacy URL to its new equivalent (or closest hub), and inspect GSC "Not found (404)" report. This is likely the single largest recoverable SEO/AI-citation loss.

## Backlink proxies
No free backlink source returned data (no Moz/Bing keys; CC counts tiny; searches for mentions returned nothing). Only found: topguide.ro portfolio link to ghidulvet.ro. divet.ro, being from 2007, may still have legacy backlinks to now-404 URLs - check GSC Links report and Bing Webmaster Tools.

## Keyword gap
Where ghidulvet is built and divet has nothing:
1. Local vet directory: "veterinar [oras]", "cabinet veterinar [oras]", "farmacie veterinara [oras]", "veterinar la domiciliu", "urgente veterinare 24/7" (~11k pages). Not divet's lane; do not chase.
2. Procedures and prices: sterilizare/castrare pisica/caine pret, vaccinare, microcipare, detartraj, eutanasie, consult veterinar (x ~151 cities).
3. Health: boli caine/pisica (27 disease pages: babesioza, ciuma canina, coriza, diabet, boala renala cronica...), simptome (11), toxic (21), "caine a mancat ciocolata/struguri", "caine vomita", "caine nu mananca", convulsii, respiratie grea.
4. Tools: calculatoare varsta caine/pisica, hrana, sarcina, "ce pot manca" (120 foods), BCS.
5. Guides: deparazitare, vaccinari catel, dresaj comenzi de baza, anxietate separare, litiera pisica, calatorie cu animalul, adoptie; small pets (iepure, hamster, cobai, papagal, testoasa, gecko).

Where divet can win quickly (ghidulvet has nothing or ~nothing, and big portals do not cover):
- Wildlife / marine / insect long tail in Romanian: balena cu cocoasa, castravete de mare, rechin taur, insecta bat (likely "insecta frunza/bat" stick-insect cluster), licurici, caracatita uriasa, arici de mare, balena de Groenlanda, gandacul rinocer, ursul grizzly. Sample queries returned no Romanian result at all for balena cu cocoasa, rechin taur, insecta bat - essentially empty Romanian SERPs. Expand to: rechin alb/tigru/balena, delfin, orca, caracatita, meduza, calmar, stea de mare, cal de mare, mantis, tantar, fluture/molie species, scorpion, tarantula, paianjen, ursi/lupi/vulpi/mamifere salbatice (ro.wikipedia is the main rival).
- Rare / foreign breed long tail where Romanian pages are thin or foreign-only: alabai (results all EN/spam), pisica savannah (all EN), ashera, khao manee, nebelung, lagotto, ciobanesc anatolian/caucazian, vizsla, setter irlandez. Add pret, caracteristici, comparatie (e.g. alabai vs kangal, savannah vs bengal).
- Answer-box formats: "cat traieste [specie/rasa]", "cat cantareste", "este periculos", "[specie] vs [specie]" comparisons, FAQ schema.
- Head breeds (labrador, ciobanesc german, beagle, maine coon, british shorthair) are contested by royalcanin.com/ro, hornbach.ro, capital.ro, Wikipedia - slow wins.
- Overlap risk: ghidulvet /rase has only 55 pages, so breeds are an open lane for divet if it scales past ~60 -> 200+ breeds.

## Recommendations
1. 301 legacy URLs (above). 2. Keep llms.txt, add sitemap lastmod accuracy and Article/FAQ/Taxon schema, author/vet-reviewer bylines (E-E-A-T gap vs ghidulvet clinics/data). 3. Add off-site mentions: Wikipedia/Wikidata citations, Reddit r/Romania pet threads, FB groups, press-pitch for Oct 2026 relaunch. 4. Prioritise wildlife/marine/insect long tail and rare breeds; avoid head-to-head with local directory. 5. Verify with GSC and real google.ro SERPs since this sample is approximate.
