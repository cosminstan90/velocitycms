# Cercetare SEO: cuvinte-cheie și prompturi (F4 / T12)

Fișierele din acest folder sunt **date de lucru**, nu adevăr absolut: Autocomplete arată formulările reale, nu volumele.

## Fișiere

| Fișier | Rol |
|---|---|
| `research/keywords-AAAA-LL-ZZ.csv` | Recolta brută Google Autocomplete (ro/RO): `keyword, seed, intent, drop_reason`. Produsă de `scripts/research/suggest.ts`. Intențiile comerciale și zgomotul au `drop_reason` completat. |
| `keyword-map.csv` | **O singură pagină-țintă per grup de cuvinte-cheie** (anti-canibalizare). `status`: `exists` (live), `planned`, `blocked` (așteaptă date sau fișe), `dropped`. |
| `geo-prompts.csv` | Setul fix de 75 de prompturi în română (rase, sănătate, faună, comparații, practic, brand) pentru urmărirea citărilor AI. `page_status`: `exists`, `scheduled` (articol de sănătate programat 5–17 nov. 2026), `planned`, `blocked`. |
| `geo-tracking.csv` | Rezultatele lunare ale măsurătorii (gol, se completează). |

## 1. Recolta de cuvinte-cheie

```bash
# toate interogările implicite (rase, animale, generice; ~1 minut)
node node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/research/suggest.ts

# o singură sămânță, cu modificatori, extinsă a-z
node node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/research/suggest.ts \
  --seeds "rottweiler,pomeranian" --mods "cat traieste,vs,boli" --alphabet --out docs/seo/research/keywords-rase-noi.csv
```

Fără chei și fără bază de date. Heuristica de intenție (`lib/research.ts`) este orientativă: **verifică manual** rândurile marcate „verifică manual” (`sau` poate fi comparație sau zgomot, ex. „husky sausage dog”).
Rulează lunar; diferențele între fișiere arată interogările noi.

## 2. Din recoltă în `keyword-map.csv`

1. Elimină ce are `drop_reason` (comercial, zgomot, omonime).
2. Grupează pe intenție: fișă, comparație, listă, răspuns scurt, sănătate, instrument, glosar.
3. Alege **un singur URL țintă** per grup; dacă mai multe pagini concurează pentru același grup, rămâne una.
4. Completează `demand_1_5` din **Search Console** (impresii pe interogare, export la 28 de zile), `serp_weakness_1_5` (câte din primele 10 sunt portaluri de știri sau pagini subțiri), `fit_1_5` (cât de bine se potrivește cu datele noastre) și `risk_1_5` (YMYL = risc mare).
5. `score = demand + serp_weakness + fit − risk`; backlogul se ordonează descrescător și intră în loturile de conținut.

> Fără acces la Search Console, coloana `demand` rămâne goală și prioritizarea nu este fundamentată. Acesta este primul lucru de rezolvat.

## 3. Măsurătoarea AI (lunar, ~30 de minute)

Pentru fiecare prompt din `geo-prompts.csv`, pe ChatGPT (cu căutare), Perplexity, Gemini, Google (AI Overviews) și Bing Copilot, adaugă un rând în `geo-tracking.csv`:

- `cited`: `da`/`nu` (divet.ro apare în lista de surse);
- `position`: poziția în lista de surse (dacă există);
- `mentioned_only`: `da` dacă apare doar în text, fără link;
- `competitors_cited`: domeniile citate în schimb;
- `answer_correct`: `da`/`nu`/`parțial` (răspunsul, comparat cu pagina noastră).

Pagini cu `page_status` diferit de `exists` nu se măsoară până nu sunt publicate.
Metrici: rata de citare (prompturi cu cel puțin o citare / total) și pe bucket; top domenii care ne iau locul. Ținta din plan: ≥ 5 din 30 de prompturi de bază citate până în februarie 2027.

## 4. Ce faci cu rezultatele

- **Alții sunt citați, noi nu** → verifică pagina-țintă: răspuns de 40–55 de cuvinte în primul paragraf, tabel, FAQ, sursă citată, dată actualizată.
- **Prompt fără pagină-țintă** → intră în `keyword-map.csv` ca `planned`.
- **Răspuns incorect despre noi** → corectează pagina (și `llms.txt`, dacă e cazul).
- **Prompturi cu intenție comercială sau fără sursă verificabilă** (prețuri, numere de telefon) rămân `planned`; nu publicăm cifre pe care nu le putem susține.
