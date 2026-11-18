# Analiză GEO (AI search) – divet.ro – 17 noiembrie 2026

Metodă: citire repo (read-only), 17 cereri HTTP către divet.ro (robots, llms.txt, llms-full.txt, sitemap, 12 pagini, fără JS, user-agent de browser), 5 căutări web. Limită: WebSearch este doar pentru SUA și nu respectă `site:`, deci verdictele despre citări AI sunt proxy, nu măsurători. Nu s-au rulat prompturi reale în ChatGPT, Perplexity sau AI Overviews.

## 1. GEO Readiness Score: 63 / 100

| Criteriu (pondere) | Scor | Observație scurtă |
|---|---|---|
| Citabilitate pasaje (25%) | 15/25 | Răspuns direct în primele 40-60 cuvinte, FAQ cu răspunsuri de 30-40 cuvinte, surse nominalizate în articolele noi. Niciun bloc de 134-167 cuvinte; articolele vechi au atribuiri vagi |
| Structură (20%) | 17/20 | H1>H2>H3 curat, „Pe scurt", cuprins, tabel de comparație, FAQ în `<details>`, liste |
| Multimodal (15%) | 8/15 | 7 imagini/articol, un instrument interactiv; zero video, zero infografice proprii |
| Autoritate / brand (20%) | 6/20 | Autor „Redacția DiVet" (fără persoană reală), fără recenzor veterinar, zero mențiuni externe găsite, fără `sameAs` |
| Tehnic (20%) | 17/20 | SSR complet, robots deschis, llms.txt + llms-full.txt, HSTS, IndexNow; HTML cu `no-store` |

## 2. Platform breakdown (estimare)

| Platformă | Scor | De ce |
|---|---|---|
| Google AI Overviews | 66 | Structură și schema bune, dar domeniul nu apare în top-10 pentru interogările testate (vezi serp-geo.md din 3 noiembrie); 92% din citări vin din top-10 |
| Bing Copilot | 64 | IndexNow activ, sitemap, SSR; lipsește validarea în Bing Webmaster ca măsură (neverificat) |
| ChatGPT search | 52 | Citează mult Wikipedia și Reddit; DiVet nu are prezență în niciuna. Crawlerele OpenAI au acces |
| Perplexity | 50 | Favorizează discuții Reddit și surse cu autoritate; DiVet are conținut extractabil dar zero validare comunitară |

## 3. Acces crawlere AI

Sursa: `app/robots.ts` (dinamic, citește `SeoSettings.blockAiTrainingBots`). Robots.txt servit în producție conține doar `User-Agent: *`, `Allow: /`, `Disallow: /admin/ /api/ /_next/` și două sitemap-uri. Nu există reguli per bot, deci toate sunt permise implicit.

| Crawler | Stare | Comentariu |
|---|---|---|
| GPTBot | Permis (implicit) | Training OpenAI; decizie editorială |
| OAI-SearchBot | Permis | Necesar pentru ChatGPT search |
| ChatGPT-User | Permis | Browsing la cerere |
| ClaudeBot | Permis | |
| anthropic-ai / Claude-Web | Permis | |
| PerplexityBot / Perplexity-User | Permis | |
| Google-Extended | Permis | Controlează doar Gemini training/grounding, nu Search |
| CCBot | Permis | Common Crawl, hrănește multe LLM-uri |
| Bytespider | Permis | Cunoscut pentru trafic agresiv; de limitat dacă apar probleme |
| cohere-ai, Applebot-Extended, Meta-ExternalAgent | Permis | |

Bug latent în `app/robots.ts`: dacă adminul completează `robotsTxt`, codul ignoră conținutul și servește doar `User-agent: *` + `Allow: /`, fără `Disallow: /admin/`. Dacă pornește `blockAiTrainingBots`, blochează GPTBot dar și ChatGPT-User și PerplexityBot, adică și accesul de căutare/browsing, nu doar training. Lista nu conține OAI-SearchBot, ClaudeBot, Google-Extended, Bytespider.

Recomandare: păstrați tot deschis pentru motoarele de căutare AI. Opțional, explicitați regulile (documentează intenția și rezistă schimbărilor de setări):

```
User-agent: OAI-SearchBot
Allow: /
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Bytespider
Disallow: /
```
(Pe fiecare `Allow` se pot păstra `Disallow: /admin/`, `/api/`.) Fișier: `app/robots.ts`.

## 4. llms.txt

Stare: prezent (`https://divet.ro/llms.txt`, 200, `text/plain; charset=utf-8`, cache 1 h), plus `/llms-full.txt` (611 KB, text integral al articolelor). Rută dinamică din `app/llms.txt/route.ts`, listă generată din navigare (`getNavigation`) și `HOME_INTRO`.

Calitate: format valid llmstxt.org. Slăbiciuni: (a) listează doar categorii, niciun articol, deci un LLM nu vede cele mai citabile pagini (ghidurile de sănătate); (b) fără linkuri către despre-noi, politica editorială, echipă; (c) fără notă despre surse, dată, mod de citare; (d) fără bloc „Optional" care să trimită la `llms-full.txt`; (e) 611 KB depășește ce încape într-o fereastră de context; un llms-full pe secțiuni ar fi mai util.

Draft gata de folosit: `D:\Projects\DiVet\seo-2026-11-17\geo\llms.txt` (structură reală din sitemap: 25 articole de sănătate, rase, marine, insecte, sălbatice, instrumente, pagini editoriale). Implementare: extindeți `app/llms.txt/route.ts` să adauge (1) paragraful de metodologie, (2) blocul „Despre DiVet", (3) top articole pe categorie din DB (ex. cele mai recente 5 per categorie, mai ales `/sanatate`), (4) blocul „Optional". Nu înlocuiți generarea din DB cu fișierul static, ci replicați structura. Verificați manual lista de rase/articole din draft, scrisă din sitemap la 17.11.

## 5. Brand și entitate

Căutări (WebSearch, standard): „divet.ro enciclopedie animale", „DiVet divet.ro reddit/youtube/facebook". Rezultat: zero apariții ale divet.ro sau ale brandului. Doar firme cu nume asemănător (DI VET IMAGISTICA SRL, DYVET PET SRL etc.), care creează risc de confuzie de entitate. Concluzii (limita instrumentului: SUA-only, fără operator `site:`):

| Semnal | Stare |
|---|---|
| Wikipedia / Wikidata | Fără intrare găsită |
| Reddit (r/Romania, r/RomaniaPets etc.) | Fără mențiuni găsite |
| YouTube | Fără canal găsit |
| Facebook / grupuri de proprietari | Fără mențiuni găsite |
| LinkedIn | Fără pagină găsită |
| `sameAs` în schema Organization | Absent (vezi secțiunea 9) |

Contextul din 3 noiembrie confirmă: mențiuni zero și în indexul web testat. Pentru GEO, Ahrefs arată că mențiunile de brand contează de ~3x mai mult decât backlinkurile, deci este cea mai mare lacună.

Plan realist, în ordine: (1) profiluri verificabile (YouTube, Facebook, LinkedIn Company, X) și legarea lor în `sameAs`; (2) 2-3 videoclipuri scurte (30-60 s) pe subiecte de urgență (ciocolata, xilitol, struguri) cu link în descriere; (3) răspunsuri utile, fără spam, pe Reddit și în grupuri FB, cu link doar când este relevant și respectând regulile; (4) un recenzor veterinar numit (vezi secțiunea 8); (5) intrare Wikidata pentru organizație când există surse independente.

## 6. Citabilitate la nivel de pasaj

Eșantion: `/sanatate/substante-toxice/ciocolata-si-cainii`, `/caini/rase/rottweiler`, `/marine/mamifere-marine/orca`.

Constatare generală: paragrafele au 20-75 de cuvinte; răspunsurile FAQ 26-40; niciun bloc contiguu, autonom, de 134-167 cuvinte. Unitatea reală este deci prea mică pentru a fi extrasă cu context complet, iar un pasaj bun este de multe ori împărțit între un paragraf scurt, o listă și un alt paragraf.

| Pasaj (articol / secțiune) | Cuvinte | Scor 0-10 | Motiv |
|---|---|---|---|
| Ciocolată / „Pe scurt" | 35 | 8 | Definiție directă, fapt, acțiune; prea scurt pentru lungimea optimă |
| Ciocolată / „Cât de urgent este" | 70 | 8 | Atribuit (Pet Poison Helpline), cifre (6-12 ore), acțiune clară |
| Ciocolată / „Ce o face periculoasă" + paragraful următor | 58 + 47 | 6 | Bine sursate, dar despărțite de listă; conține referințe „Manualul" fără antecedent |
| Ciocolată / FAQ (6) | 30-40 | 7 | Autonome, sursate, dar fiecare răspunde la o singură mică întrebare |
| Rottweiler / „Cât trăiește" | 47 | 7 | Cifre și surse, dar datele de sănătate sunt în altă secțiune |
| Rottweiler / „Probleme de sănătate" | listă 5 puncte | 4 | Listă fragmentară, procentele nu au explicat „din câini studiați" în fiecare punct |
| Rottweiler / „Ce spune legea" | 32 + listă 5 + 52 | 6 | Util, unic pe piața RO, dar fărâmițat și fără dată clară pe fiecare element |
| Orca / „Hrană și ecotipuri" | 41 + 21 | 5 | Cifre bune, dar „Sursele despre specie" este atribuire vagă |
| Orca / „Orca: ce este" | 59 | 5 | „Sursele despre specie descriu…" fără sursă numită |
| Orca / FAQ | 18-31 | 6 | Corecte, fără surse în răspuns |

Observație: articolele de sănătate noi atribuie explicit (Merck, VCA, ASPCA, Pet Poison Helpline); cele de rase și animale sălbatice folosesc des „sursele spun", care nu poate fi citat de un LLM ca provenință.

## 7. Verificare SSR (HTML brut, fără JS)

Toate cele 12 pagini returnează 200 și conținutul principal în HTML inițial (`<article>`, H1, H2, tabele, FAQ). Nu s-a executat JavaScript.

| Pagină | Cuvinte vizibile în HTML | H2 | Tabele | FAQ `<details>` | Notă |
|---|---|---|---|---|---|
| `/` | 1.134 | 4 | 0 | 9 | FAQPage 4 întrebări |
| `/caini/rase/rottweiler` | 2.157 | 21 | 1 | 11 | Comparație în tabel |
| `/pisici/rase/ragdoll` | 1.877 | 19 | 1 | 11 | |
| `/sanatate/substante-toxice/ciocolata-si-cainii` | 1.793 | 10 | 1 | 11 | Tabel „Cât de urgent" |
| `/sanatate/boli/parvoviroza-la-caini` | 1.759 | 11 | 1 | 11 | |
| `/marine/mamifere-marine/orca` | 1.757 | 14 | 1 | 11 | |
| `/insecte/gandaci/licurici` | 1.582 | 17 | 1 | 11 | |
| `/caini/rase` (categorie) | 1.108 | 4 | 0 | 8 | CollectionPage + 12 H3 |
| `/glosar` | 1.454 | 15 | 0 | 5 | DefinedTermSet |
| `/instrumente/aliment-periculos` | 775 | 4 | 0 | 8 | Verdictul alimentelor trebuie verificat în HTML (nu s-a testat răspunsul la căutare) |
| `/autor/redactia` | 703 | 0 | 0 | 5 | |
| `/despre-noi` | 753 | 6 | 0 | 5 | |

Probleme: (1) `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` pe toate paginile HTML (confirmat; sursa: pagini `force-dynamic`, ex. `app/(frontend)/[slug]/page.tsx`). nginx are microcache 60 s, deci crawlerele nu sunt afectate de încărcare, dar header-ul împiedică cache-ul în CDN/browser și revalidările condiționale; (2) `<details>` apare de 11 ori în articole deși există 6 FAQ (restul sunt probabil elemente din secțiuni, de verificat); nu afectează accesul. (3) Pagina de instrument are doar 775 cuvinte, bazată pe date prezente în HTML; confirmat că nu cere JS pentru FAQ. Verdict: SSR ok, fără dependență de JS pentru conținutul textual.

HSTS: **prezent** (`max-age=31536000; includeSubDomains`). Problema anterioară este rezolvată. Prezente și: X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, CSP (cu `unsafe-inline` și `unsafe-eval`).

## 8. Top 5 modificări cu cel mai mare impact

1. **Autor și recenzor real pe articolele de sănătate.** Adăugați un recenzor medic veterinar (nume, titlu, nr. de înscriere în Colegiul Medicilor Veterinari, link LinkedIn) și afișați „Verificat medical de …" cu `reviewedBy` în schema `MedicalWebPage`. Fișiere: `lib/seo/schema-generator.ts` (nodul Article/MedicalWebPage), `lib/seo/author-schema.ts`, șablonul paginii de articol din `app/(frontend)/[slug]/[subSlug]/…`, pagina `/echipa`. Cel mai mare efect asupra E-E-A-T și asupra încrederii LLM-urilor pe conținut YMYL.
2. **Entitate și prezență externă.** `sameAs` pe Organization (YouTube, Facebook, LinkedIn, X) și pe Person/ProfilePage; creați profilurile; 2-3 videoclipuri YouTube; participare Reddit/FB. Fișiere: `lib/home-schema.ts` (Organization, linia 21), `lib/seo/schema-generator.ts` (linia 190), `lib/seo/author-schema.ts` (`sameAs` deja suportat, linia 52, dar nepopulat). Mențiunile de brand sunt cel mai corelat semnal cu citările AI.
3. **Pasaje autonome de 134-167 cuvinte, cu sursă numită.** Introduceți în fiecare articol 2-3 blocuri sub H2 interogativ („Cât trăiește un rottweiler?", „Ce mănâncă orca?"), care repetă subiectul, fiecare cu cifre și sursă numită; eliminați „sursele spun". Fișier: `AI_CONTENT_GUIDE.md` (regula de scriere) și `lib/seo/geo-scorer.ts` (adăugați verificare lungime bloc 134-167 și atribuire nenumită). Reluați articolele vechi (Labrador, Golden Retriever, Bichon) primele.
4. **llms.txt îmbogățit și llms-full pe secțiuni.** Folosiți draftul din `geo/llms.txt`. Fișiere: `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts` (împărțiți: `/llms-full.txt` doar sănătate, plus fișiere per secțiune, sau limitați lungimea). Efort mic, util mai ales pentru agenți și IDE-uri, impact incert la motoarele de căutare majore.
5. **Header-e cache și date de actualitate.** Servați HTML public cu `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` (sau `revalidate` ISR) și `Last-Modified`/ETag, în loc de `no-store`; păstrați `dateModified` real. Fișiere: `next.config.ts` (`headers()`, liniile 52-99), `app/(frontend)/[slug]/page.tsx` (`dynamic = 'force-dynamic'` la linia 13, comentariul de la linia 24 menționează deja `revalidate = 86400`), `middleware` dacă există. Nu va schimba citările direct, dar ajută crawlerele și validările condiționale. Prioritate: sub celelalte patru.

Mențiune: nu s-a găsit în repo un `proxy.ts`/`middleware.ts` care să seteze `no-store`; cauza exactă a header-ului trebuie confirmată în runtime (Next.js setează `no-store` pe rute dinamice).

## 9. Recomandări schema (descoperire AI)

Stare verificată (JSON-LD din HTML):

| Tip | Pagini | Stare |
|---|---|---|
| Article | rase, marine, insecte | Prezent; `author` Person „Redacția DiVet" cu `@id` și url, `publisher` Organization inline, `datePublished`, `dateModified`, `image`, `speakable` (`article h1`, `[data-speakable="tldr"]`), `articleSection`, `audience` |
| Article + MedicalWebPage | sănătate (ciocolată, parvoviroză) | Prezent (tip dublu) |
| FAQPage | articole (6), home (4), instrument | Prezent |
| BreadcrumbList | articole, categorii, glosar, instrument | Prezent, 4 niveluri, URL-uri absolute |
| WebSite + SearchAction | articole, home | Prezent |
| Organization | doar pe home | Fără `sameAs`, fără `description`, `logo` = `/opengraph-image` (nu logo dedicat); lipsește `@id` în nodul din articol (referința `@id` e inline fără `sameAs`) |
| ProfilePage + Person | `/autor/redactia` | **Prezent acum** (rezolvă punctul vechi), dar Person fără `sameAs`, fără `image`, fără `knowsAbout`; `jobTitle` „Echipa editorială DiVet" |
| Speakable | articole | **Prezent acum** (rezolvă punctul vechi) |
| DefinedTermSet | `/glosar` | Prezent |
| WebApplication | instrument | Prezent |
| CollectionPage + ItemList | home, categorii | Prezent |

Ce rămâne:
1. `Organization`: adăugați `sameAs`, `description`, `logo` dedicat (PNG pătrat ≥112 px), `foundingDate`, `contactPoint`. Fișiere: `lib/home-schema.ts`, `lib/seo/schema-generator.ts` (linia 190). Folosiți același `@id` (`https://divet.ro/#organization`) peste tot.
2. `Person`/`ProfilePage`: `sameAs`, `image`, `knowsAbout` și `reviewedBy` către recenzor. Fișier: `lib/seo/author-schema.ts`.
3. `MedicalWebPage`: adăugați `lastReviewed`, `reviewedBy`, `about` (MedicalCondition/Substance), `audience` corect. Fișier: `lib/seo/schema-generator.ts`.
4. `Article`: adăugați `citation` (lista surselor din articol: Merck, VCA, IUCN, FCI) și `mainEntityOfPage`; pe rase, `about` cu `Thing` și `sameAs` către Wikidata unde există. Fișier: `lib/seo/schema-generator.ts`.
5. Nu adăugați alte tipuri „comerciale"; păstrați FAQPage doar cu răspunsuri identice cu conținutul vizibil (acum sunt).
6. Dacă `dateModified` se schimbă la fiecare republicare (ex. ciocolata: publicat 5 nov, actualizat 11 nov), asigurați-vă că reflectă modificări reale de conținut.

## 10. Sugestii de rescriere (pasaje concrete)

Principii: titlul H2 sub formă de întrebare, răspunsul în prima propoziție, cifre și surse numite, 134-167 cuvinte, fără referințe care cer context („Manualul", „sursele"). Rescrierile folosesc numai fapte deja prezente în articole; editorul trebuie să le reverifice față de sursele primare înainte de publicare.

### 10.1 Ciocolata și câinii – „Ce o face periculoasă" (58 + 47 cuvinte, despărțite de listă)
Original: „Potrivit Merck Veterinary Manual, toxicitatea vine din metilxantine: teobromina și cafeina…" și „Un procent mai mare de cacao pe etichetă înseamnă mai multe metilxantine…"

Propunere (circa 137 de cuvinte), H2 „De ce este ciocolata periculoasă pentru câini?":

> Ciocolata este periculoasă pentru câini pentru că conține teobromină și cafeină, două metilxantine pe care câinii le elimină lent. Potrivit Merck Veterinary Manual, teobromina apare în concentrații de aproximativ 3–10 ori mai mari decât cafeina, iar ambele contribuie la intoxicație. Riscul crește cu cât ciocolata este mai închisă: cacao pudră, ciocolată neîndulcită, ciocolată neagră, apoi ciocolată cu lapte; ciocolata albă conține cantități neglijabile, dar grăsimea și zahărul pot provoca totuși vărsături, diaree sau pancreatită (VCA). Semnele apar de obicei la 6–12 ore după ingestie și includ sete excesivă, vărsături, neliniște, tremurături și ritm cardiac neregulat. Pet Poison Helpline recomandă să suni medicul veterinar sau o clinică de urgență imediat, chiar dacă pare normal, să ai la îndemână tipul de ciocolată, cantitatea și ora ingestiei și să nu provoci voma fără indicația unui profesionist.

Notă: formularea „pe care câinii le elimină lent" este o simplificare; confirmați-o în sursa Merck înainte de publicare sau eliminați-o.

### 10.2 Orca – „Hrană și ecotipuri" (41 + 21 cuvinte)
Original: „Orcile nu sunt toate la fel. Cercetătorii deosebesc ecotipuri cu dietă diferită…" și în „Orca: ce este", „Sursele despre specie descriu orca…" (atribuire vagă).

Propunere (circa 140 de cuvinte), H2 „Ce mănâncă orca?":

> Orca mănâncă pește sau mamifere marine, în funcție de ecotip, adică de populația din care face parte. Orcile „rezidente" din nord-estul Pacificului mănâncă pește: somonul reprezintă 96% din dieta lor, iar somonul Chinook 65% din acest somon, din aproximativ 30 de specii de pești consumate. Orcile „tranzitorii" vânează mamifere marine: foci, lei de mare, delfini și balene mari. În medie, o orcă mănâncă circa 227 kg pe zi. Tehnicile diferă la fel de mult ca dieta: în Norvegia, orcile încolăcesc heringul într-o minge deasă cu bule și îl lovesc cu coada, iar în Antarctica orcile de tip B creează valuri care spală focile de pe sloiuri. Aceste diferențe arată că orca nu are un singur meniu: fiecare ecotip are dietă și tehnici proprii, iar populațiile rezidente trăiesc toată viața în grupuri matriliniare conduse de femele.

În același articol, înlocuiți „Sursele despre specie descriu…" cu sursa numită (ex. IUCN Red List, NOAA). Cifrele (96%, 65%, 227 kg) trebuie atribuite explicit, nu doar listate.

### 10.3 Rottweiler – „Cât trăiește" + „Probleme de sănătate" (47 cuvinte + listă)
Original: „Royal Kennel Club indică sub 10 ani. Un studiu VetCompass din Marea Britanie… longevitate mediană de 9,0 ani…"

Propunere (circa 135 de cuvinte), H2 „Cât trăiește un rottweiler și de ce mor cel mai des?":

> Un rottweiler trăiește, de regulă, sub 10 ani, potrivit Royal Kennel Club. Un studiu VetCompass din Marea Britanie, pe date din 2013, a găsit o longevitate mediană de 9,0 ani: femelele au trăit 9,5 ani, iar masculii 8,7 ani. Cea mai frecventă cauză de deces a fost neoplazia, în 33,0% dintre cazuri. Printre afecțiunile cel mai des înregistrate în același studiu s-au numărat agresivitatea (7,46% dintre câinii studiați), obezitatea (7,06%), otita externă (6,14%) și boala degenerativă a articulațiilor (4,69%). Rasa se îngrașă ușor, deci hrana adaptată vârstei și controlul greutății contează. Pentru un pui, Royal Kennel Club recomandă, ca minim, testarea ADN pentru polineuropatia laringiană juvenilă (JLPP) și testarea șoldurilor și coatelor la părinți. Mergi la veterinar dacă șchiopătează, are un nod care crește sau slăbește fără motiv.

Notă: lista de simptome finale vine din secțiunea „Când mergi la veterinar" a articolului; verificați dacă „nod" în loc de „nodul" respectă stilul.

## Proxy citări concurente (prompturi RO)

Căutări de test (WebSearch, SUA-only, deci incomplet):
- „ciocolata și câinii ce faci imediat": rezultate Antena 3, Merck/MSD Veterinary Manual, AKC, PDSA, Colorado State, bloguri EN. Niciun site de enciclopedie RO nu apare, deci nișa „ghid de urgență în română" este slab ocupată de surse specializate. DiVet poate concura ca ghid RO sursat din Merck/VCA/ASPCA.
- „cât trăiește un rottweiler": Dogster, VCA, WebMD, Purina, Royal Canin, PDSA, Orvis (aproape tot EN). Răspunsul în română nu este servit de un site RO în top; oportunitate pentru pasajul 10.3.
- „de ce vomită pisica": Petco, Best Friends, Royal Canin RO (`royalcanin.com/ro`), MSD. Royal Canin RO este concurent recurent (confirmat și în serp-geo.md).
- Concurenți recurenți din 3 noiembrie: royalcanin.com/ro, bzi.ro, playtech.ro, capital.ro, evz.ro, hornbach.ro, Wikipedia (RO), biotur.ro. Pentru AI Overviews în română, probabil același set plus Wikipedia.

Pentru măsurare reală: populați `docs/seo/geo-tracking.csv` (acum gol, doar antet) rulând manual 10-15 prompturi din `docs/seo/geo-prompts.csv` (75 de prompturi) în ChatGPT search, Perplexity și Google, de pe IP românesc, lunar. Începeți cu RAS-02 („Cât trăiește un labrador?") și cu prompturile de sănătate.

## Stare puncte vechi

| Punct deschis | Stare 17.11 |
|---|---|
| Speakable lipsă | Rezolvat (`speakable` pe Article) |
| Pagina autor fără Person/ProfilePage | Rezolvat (ProfilePage + Person), dar fără `sameAs` |
| Cache-Control no-store | Încă valabil (HTML) |
| HSTS lipsă | Rezolvat (max-age 1 an, includeSubDomains) |
| Fără recenzor veterinar | Încă valabil |

## Fișiere scrise
- `D:\Projects\DiVet\seo-2026-11-17\geo\GEO-ANALYSIS.md`
- `D:\Projects\DiVet\seo-2026-11-17\geo\llms.txt`
