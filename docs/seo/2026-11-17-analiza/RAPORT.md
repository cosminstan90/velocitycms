# divet.ro: analiză SEO consolidată (17.11.2026)

Sinteză a trei analize făcute în paralel: plan SEO, GEO/AI search și pagini de comparație. Detaliile sunt în subfolderele `plan/`, `geo/` și `comparatii/`. Cifrele de trafic și volum sunt estimări, pentru că nu a existat acces la GSC, Bing Webmaster sau Ahrefs. Constatările marcate „✔ verificat” au fost reverificate manual pe site și în cod.

## Diagnostic pe scurt

- **Fundația tehnică e bună.** Conținutul e randat pe server (SSR), cu tabele și FAQ în HTML-ul brut. Schema e completă: Article, FAQPage, BreadcrumbList, MedicalWebPage, speakable și ProfilePage. HSTS e activ ✔. Crawlerele AI sunt permise ✔.
- **Scor GEO: 63/100.** Pe platforme: Google AIO ~66, Bing Copilot ~64, ChatGPT ~52, Perplexity ~50.
- **Lacunele mari nu țin de cod, ci de încredere (E-E-A-T):**
  - lipsește un medic veterinar numit care să recenzeze articolele;
  - brandul DiVet nu e menționat pe niciun alt site;
  - nu există acces la date reale de căutare (GSC).
- **Poziționare.** Concurenții sunt Royal Canin RO, ghidulvet.ro și portaluri de știri (ProTV, BZI, Playtech). DiVet nu poate concura pe termenii generali. Nișele câștigabile sunt:
  - fauna, rasele rare și cele românești;
  - comparațiile și listele;
  - sănătatea, dar numai cu un recenzor veterinar.

## Priorități

### P0: decizii și acces (acțiuni ale tale)
1. **Recenzorul veterinar.** Cele 25 de articole de sănătate au `MedicalWebPage` fără `reviewedBy`, iar `/echipa` vorbește despre recenzie fără nicio persoană. Planul are un termen de decizie (24.11) și un plan B: dacă nu există recenzor până la 15.12, `/echipa` trebuie reformulată.
2. **Acces la Search Console și Bing Webmaster** pentru baseline: interogări, 404, acoperire. Fără el, prioritizarea se face pe ghicite.

### P0/P1: remedieri în cod (mici, toate verificate)
3. ✔ **`app/robots.ts`**:
   - dacă `robotsTxt` e completat în admin, se pierd `Disallow: /admin/ /api/ /_next/`, iar textul personalizat nici nu e folosit;
   - `blockAiTrainingBots` blochează și ChatGPT-User și PerplexityBot, care sunt boți de căutare, nu de antrenare.

   Azi nu afectează site-ul (opțiunile nu sunt active), dar e o capcană.
4. ✔ **Hub-ul `/comparatie`** răspunde 200 cu 0 comparații, fără canonical și fără robots. Trebuie `noindex` până există cel puțin 3 comparații.
5. ✔ **Titlul listelor** repetă brandul: „Rase de câini mari: lista fișelor DiVet | DiVet” (`lib/lists.ts` + `app/(frontend)/liste/[slug]/page.tsx`).
6. **Pagina de comparație** (`ComparisonTemplate.tsx`):
   - selectorul speakable `article h1` nu găsește nimic, pentru că pagina nu are `<article>`;
   - lipsesc tagurile OG și robots din `noIndex`;
   - lipsesc autorul și data vizibile;
   - verdictul stă sub tabel, nu deasupra;
   - nimic nu previne duplicatele `a-vs-b` / `b-vs-a`.
7. ✔ **Redirecturi legacy incomplete**, de exemplu `/articole/boala-addison-la-caine` dă 404.
8. **Etichete subțiri.** Sunt încă 20 de URL-uri `/eticheta/` în sitemap ✔. PR #41 (prag 5) e pe main; de verificat dacă e deployat și dacă rezultatul e cel dorit.
9. **Cache.** HTML-ul vine cu `Cache-Control: no-store` ✔. nginx face microcache, dar CDN-urile și browserele nu pot face cache. Prioritate mică.

> Notă: agentul de plan a măsurat un răspuns de ~56 s pentru `sitemap.xml` la prima cerere. La reverificare a răspuns în 0,2 s, deci probabil e doar prima cerere, înainte de cache. Merită urmărit în log-uri, nu tratat ca P0.

### P1: GEO
10. **`sameAs` + profiluri externe** (YouTube, Facebook, LinkedIn) pentru Organization și Person (`lib/home-schema.ts`, `lib/seo/author-schema.ts`). Mențiunile brandului cântăresc pentru AI mai mult decât backlink-urile.
11. **Blocuri de 134–167 cuvinte**, autonome, cu sursă numită și sub un H2 formulat ca întrebare. Azi paragrafele au 20–75 de cuvinte. De adăugat ca regulă în `AI_CONTENT_GUIDE.md` și în `lib/seo/geo-scorer.ts`. Analiza GEO are trei exemple de rescriere (ciocolată, orcă, rottweiler).
12. **`llms.txt` îmbogățit.** Draftul gata făcut e în `geo/llms.txt`, generat din sitemap-ul real.

### P1: conținut
13. **Comparații.** Primele 10 au deja ambele fișe publicate:
    - labrador vs golden;
    - ciobănesc german vs rottweiler;
    - husky vs ciobănesc german;
    - rechin alb vs delfin;
    - orcă vs rechin alb;
    - scottish fold vs british shorthair;
    - bulldog francez vs boston terrier;
    - urs brun vs grizzly;
    - urs brun vs urs polar;
    - lup vs vulpe.

    Lista completă de 20 e în `comparatii/COMPARISON-STRATEGY.md`. Fișe de scris înainte: malamut, malinois, mops, bulldog englez, cane corso.
14. **Liste.** Live sunt 3: mari, inteligente și pisici liniștite. Pentru a debloca listele pentru copii, apartament, năpârlire redusă și pază:
    - trebuie completate câmpurile `bun_cu_copiii`, `naparleste`, `nivel_energie`, `toleranta_singuratate`, plus un câmp nou pentru pază;
    - trebuie adăugate definițiile lor în `lib/lists.ts`.

    „Cele mai inteligente” e sortată alfabetic, nu după scor.
15. **Ritm.** 2 articole/zi (14/săptămână) în loc de 3: verificarea surselor e factorul limitativ. Calendarul pe 12 săptămâni de la 25.11 e în `plan/CONTENT-CALENDAR.md`. Titlurile sunt propuneri; fiecare specie trebuie verificată pe surse înainte de programare.

## Fișiere
- `plan/`: SEO-STRATEGY, COMPETITOR-ANALYSIS, CONTENT-CALENDAR, IMPLEMENTATION-ROADMAP, SITE-STRUCTURE
- `geo/`: GEO-ANALYSIS, llms.txt (draft)
- `comparatii/`: COMPARISON-STRATEGY, COMPARISON-PAGE (șablon), comparison-schema.json, autocomplete-raw.txt
