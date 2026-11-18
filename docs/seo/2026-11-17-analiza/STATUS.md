# divet.ro: stadiul planului SEO (actualizat 18.11.2026)

Sursa listei este analiza din 17.11.2026 (`RAPORT.md`, `plan/`, `geo/`, `comparatii/`). Legendă: ✅ făcut · 🟡 în coadă sau în lucru · ⬜ de făcut · ⛔ blocat.

## 1. Decizii și acces (doar tu poți)

| Ce | Stare | Nota |
|---|---|---|
| Medic veterinar recenzent (`reviewedBy` pe articolele de sănătate) | ⛔ | Termen propus 24.11. Fără el, `/echipa` trebuie reformulată până la 15.12. |
| Acces Google Search Console + Bing Webmaster | ⛔ | Fără date reale, prioritățile sunt estimări. |
| Profiluri externe ale brandului (YouTube, Facebook, LinkedIn) | ⛔ | Necesare pentru `sameAs` și mențiuni ale brandului (GEO). |

## 2. Cod

| Ce | Stare | Unde |
|---|---|---|
| robots.txt corect (text din admin + doar boții de antrenare blocați) | ✅ live | PR #42 |
| `/comparatie` noindex sub 3 comparații + canonical | ✅ live | PR #42 |
| Pagina de comparație: OG, `<article>`, autor și dată, verdict sus, anti-duplicat | ✅ live | PR #42 |
| Titlurile listelor fără brand dublu | ✅ live | PR #42 |
| Redirect `/articole/<slug>` | ✅ live | PR #42 |
| Etichete subțiri scoase din sitemap (prag 5) | ✅ live | PR #41 |
| Liste „Rase asemănătoare cu X” (model nou + 3 pagini) | 🟡 commit local | branch `feat/liste-rase-asemanatoare`, nepublicat |
| `sameAs` pentru Organization și Person | ⬜ | `lib/home-schema.ts`, `lib/seo/author-schema.ts` (așteaptă profilurile) |
| `llms.txt` îmbogățit | ⬜ | draft în `geo/llms.txt`, cod în `app/llms.txt/route.ts` |
| Regula de blocuri citabile de 134–167 de cuvinte | ⬜ | `AI_CONTENT_GUIDE.md` + `lib/seo/geo-scorer.ts` |
| „Cele mai inteligente rase” ordonată după scor, nu alfabetic | ⬜ | `lib/lists-data.ts` |
| `lastmod` real pentru liste în sitemap | ⬜ | `app/sitemap.ts` |
| Liste și pentru alte grupuri decât câini și pisici | ⬜ | `lib/lists.ts` |
| `Cache-Control: no-store` pe HTML | ⬜ prioritate mică | `next.config.ts` / rute `force-dynamic` |
| Redirecturi legacy din exportul GSC | ⛔ | așteaptă accesul GSC |

## 3. Conținut

| Ce | Stare | Nota |
|---|---|---|
| Boala Addison la câini | ✅ live | `/sanatate/boli/boala-addison-la-caine`, GEO 93 |
| Comparații 1–10 (§4 din strategie) | 🟡 programate 21–30.11, 11:00 | câte una pe zi |
| Câmpuri structurate pentru urși, lup, vulpe | ✅ live | 15 valori; lipsesc lungimea grizzly și viața lupului (fără sursă) |
| Comparații 11–20 (ambele fișe publicate) | ⬜ | ragdoll, maine coon, norvegiană, orca vs delfin, lup vs urs, labrador vs ciobănesc, golden vs husky, chihuahua vs pomeranian, polar vs grizzly, scottish vs ragdoll |
| Fișe noi pentru comparații cerute în RO | ⬜ | malamut (prioritate foarte mare), malinois, mops, bulldog englez, cane corso, doberman |
| „Rase asemănătoare” 1–3 (Labrador, Cane Corso, Bichon) | 🟡 scrise, în branch | Bichon apare după 20.11 (Bichonul maltez) |
| „Rase asemănătoare” 4 (Husky) | ⛔ | lipsesc fișele malamut, samoyed, laika |
| „Rase asemănătoare” 5 (Pitbull) | ⛔ amânat | subiect cu legislație; doar cu surse oficiale |
| 6 liste noi (copii, năpârlire ×2, pisici apartament, pază, apartament câini) | ⬜ | întâi câmpurile `naparleste`, `bun_cu_copiii`, `nivel_energie`, `toleranta_singuratate` pe toate fișele |
| Calendar de 12 săptămâni (de la 25.11) | ⬜ | `plan/CONTENT-CALENDAR.md`; coada actuală se termină pe 24.11 (articole) și 30.11 (comparații) |
| Rescrierea articolelor vechi pentru citabilitate (blocuri de 134–167 de cuvinte) | ⬜ | exemple în `geo/GEO-ANALYSIS.md` §10 |

## Ordinea propusă de aici

1. PR + deploy pentru „Rase asemănătoare” (branch `feat/liste-rase-asemanatoare`).
2. Fișa Malamut de Alaska → deblochează comparația Husky vs Malamut și pagina „asemănătoare cu Husky”.
3. Câmpurile pentru liste pe fișele de câini și pisici → 6 liste noi.
4. Comparațiile 11–20.
5. Următorul lot din calendar, de la 25.11.
