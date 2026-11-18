# Șablon pagină de comparație DiVet (`/comparatie/<a>-vs-<b>`)

Adaptare a `COMPARISON-PAGE.md` din skill-ul `seo-competitor-pages`: nu există produs, preț, CTA comercial sau rating.
Funcția paginii este informațională: ajută cititorul să aleagă între două animale și trimite spre fișele complete.
Se potrivește modelului existent: postare în categoria rădăcină `comparatie`; tabelul se **generează** din fișele A și B
(`lib/comparison.ts`); pagina dă 404 dacă oricare fișă nu e publicată; textul editorial vine din `contentHtml`; verdictul
din câmpul `verdict`; FAQ-ul din nodul `faqBlock`. Detalii de câmpuri: `AI_CONTENT_GUIDE.md`, secțiunea „Pagini de comparație".

## 0. Date de intrare (fieldValues + metadate)

| Element | Regulă |
|---|---|
| `slug` postare | `a-vs-b`, A = numele care apare primul în autocomplete; nu se creează `b-vs-a` |
| `postA_slug`, `postB_slug` | slug-urile fișelor (nu ale comparației), ambele PUBLICATE |
| `title` (H1) | „A vs B: diferențe și asemănări" sau varianta cu intenția clară („…: sunt aceeași specie?"); un titlu = o intenție |
| `metaTitle` | ≤ 52 de caractere, **fără „DiVet"** (se adaugă „ \| DiVet") |
| `metaDescription` | 140–155 de caractere: ce comparăm + ce primește cititorul (tabel, verdict) |
| `excerpt` / `tldr` | 2 propoziții, text simplu |
| `verdict` | vezi §3 |
| imagine | una singură, cu `altText` descriptiv; cardurile folosesc imaginile fișelor |
| autor + dată | autor real cu pagină `/autor/…`; „Actualizat la" vizibil (de implementat, vezi STRATEGY §7 pct. 8) |

## 1. Structura paginii și țintele de cuvinte

Total vizibil: **~850–1.100 de cuvinte** (proză 550–750 + FAQ 5 × 40–60 + verdict + etichete). Ghidul actual cere 300–500 de
cuvinte unice (minim anti-„pagină subțire"); skill-ul sugerează 1.500 — nu e necesar pentru acest tip de pagină, deoarece
tabelul și fișele aduc restul. Recomandare: începe cu 550–750 de cuvinte la primele 3 comparații și măsoară în GSC.

| # | Bloc | Cine îl produce | Țintă | Conținut |
|---|---|---|---|---|
| 1 | **H1** | `title` | ≤ 70 de caractere | cuvântul-cheie țintă, în ordinea din autocomplete |
| 2 | **Răspuns direct (primul `<p>`)** | editorial | **40–55 de cuvinte** | „A și B sunt două rase de … care diferă mai ales prin X, Y, Z." Conține ambele nume, linkuri spre ambele fișe, fără cifre nesursate. Ideal deasupra tabelului (cerință de template) |
| 3 | **Carduri A / B** | template | — | imagine, `tldr` al fișei, „Vezi fișa completă" |
| 4 | **Pe scurt (verdict)** | `verdict` | 25–45 de cuvinte | format în §3 |
| 5 | **Comparație pe scurt (tabel)** | **generat** | auto | criterii din `specs` + `behavior`; rândurile diferite sunt cele pe care se bazează secțiunea următoare; fără rânduri inventate în `contentHtml` |
| 6 | **H2 „Diferențe care contează"** | editorial | 200–300 | 3–4 diferențe, fiecare 50–80 de cuvinte, în forma: ce diferă → de unde se știe (fișă/sursă) → ce înseamnă pentru stăpân |
| 7 | **H2 „Cui i se potrivește fiecare"** | editorial | 120–180 | două liste scurte „Alege A dacă…" / „Alege B dacă…" (situații: apartament, copii, program, buget de timp), fără „mai bun" general |
| 8 | **H2 „Ce au în comun"** | editorial | 80–120 | 3 asemănări reale (origine, rol, nevoi) |
| 9 | **H2 „Sănătate și îngrijire" (rase)** / **„Habitat și comportament" (faună)** | editorial | 80–150 | doar cu sursă linkată; trimite la articolele din `sanatate` prin `rase_predispuse` |
| 10 | **FAQ (faqBlock)** | editorial | 5–6 întrebări × 40–60 | vezi §5; generează FAQPage prin schema existentă |
| 11 | **Alte comparații** | template | 4–6 linkuri | prioritar cele cu aceeași fișă (de implementat; azi = ultimele 6) |
| 12 | **Surse și metodă** | editorial | 40–80 | listă scurtă de surse + „Tabelul vine din fișele DiVet; ultima verificare: <dată>" |

Ierarhie de titluri: un singur H1; H2 pentru fiecare bloc; cardurile A/B nu ar trebui să fie H2 cu titlul lung al fișei
(să folosească nume scurt).

## 2. Tabelul comparativ

- Generat, nu scris. Coloane: Criteriu | A | B. Nume scurt al animalului în antet („Labrador", nu „Labrador Retriever: caracteristici și îngrijire").
- Rânduri tipice (rase): origine, talie, greutate, înălțime, speranță de viață, temperament; profil: nivel de energie, îngrijirea blănii,
  ușurința la dresaj, toleranța la singurătate, năpârlire, bun cu copiii. Faună: habitat, dietă, lungime/greutate maximă, statut de conservare.
- Celulele necompletate se afișează „—"; dacă > 30% din rânduri au „—", comparația nu se publică până se completează fișele.
- Fără emoji-uri ✅/❌ și fără „câștigător pe rând": criteriile sunt descriptive, nu un scor.
- Nota de sub tabel: „Diferă pe N din M criterii. Datele vin din fișele celor două." (există deja).

## 3. Formatul verdictului

Două propoziții, maximum 45 de cuvinte, în forma:

> „**Alege Labradorul** dacă vrei un câine energic, cu blană scurtă, ușor de întreținut. **Alege Golden Retrieverul** dacă accepți periajul regulat
> pentru un temperament puțin mai calm. Ambele au nevoie de mișcare zilnică."

Reguli: fără „câștigător", fără superlative; fiecare propoziție = un criteriu verificabil în tabel; verdictul nu introduce cifre
absente din fișe; dacă diferența depinde de linie/individ (ex. „linie de lucru vs linie de show"), se spune.

## 4. Reguli de corectitudine și surse (adaptate din „Fairness Guidelines")

1. **Un singur adevăr:** valorile din tabel vin din fișe; dacă o cifră din proză nu e în fișe, are sursă linkată (standard de rasă FCI/AKC/Kennel Club, IUCN pentru faună, articole de specialitate). Nu se citează site-uri de comparație auto-generate.
2. **Fără defăimare / fără stereotipuri de rasă:** „agresiv", „periculos" apar doar atribuite unei surse și cu context (educație, socializare). Pentru rase cu reglementări (amstaff, rottweiler) se trimite la legislația în vigoare.
3. **Fără „cine câștigă într-o luptă"** (orcă vs rechin, lup vs urs): comparăm adaptări, dietă, habitat, mărime; menționăm că întâlnirile directe sunt rare și nu sunt un criteriu de ierarhizare.
4. **Sănătate (YMYL):** fără doze, diagnostic sau recomandări de tratament; problemele frecvente se atribuie fișei și articolului de sănătate; pentru rasele cu probleme structurale (urechi pliate la Scottish Fold, brahicefalie la bulldog francez/boston terrier) se linkează o sursă și se evită minimalizarea.
5. **Echilibru:** fiecare animal primește cel puțin un avantaj real și o limitare reală; același număr de linkuri către fiecare fișă.
6. **Date de revizie:** „Actualizat la <dată>" vizibil; revizuire la 6 luni sau când fișa A/B se modifică.
7. **Fără monetizare ascunsă:** pagina nu recomandă crescători, magazine sau prețuri (nu avem date verificabile); dacă apar reclame AdSense, sunt etichetate și nu se plasează în tabel/verdict.
8. **Nu se inventează evaluări:** nu există rating, review sau scoruri „X/5"; nici în schema.
9. **Mențiunea AI:** textul trece prin validarea din `AI_CONTENT_GUIDE.md`; cifrele și afirmațiile de sănătate se verifică manual.

## 5. FAQ (5–6 întrebări, răspunsuri de 40–60 de cuvinte)

Se aleg din intențiile reale; primul răspuns repetă esența verdictului:

1. „Care este diferența principală dintre A și B?" (1 propoziție + 2 diferențe din tabel)
2. „Care se potrivește mai bine într-un apartament?" (talie, energie, toleranța la singurătate — din fișe)
3. „Care este mai potrivit pentru familiile cu copii?" (`bun_cu_copiii`, temperament; fără garanții)
4. „Care năpârlește mai mult / necesită mai multă îngrijire?" (`naparleste`, `ingrijire_blana`)
5. „Pot A și B să trăiască împreună?" sau „Sunt aceeași specie / rudă?" (în funcție de pereche)
6. „Cât trăiesc A și B?" (din `speranta_viata`, cu trimitere la fișă)

Varianta „A sau B?" din autocomplete intră în una dintre întrebări sau în primul paragraf, nu ca pagină separată.

## 6. Linkuri interne

- Din primul paragraf: câte un link spre fișa A și B (anchor = numele scurt); apoi un link spre fiecare în „Cui i se potrivește".
- Fișele A și B trimit înapoi prin blocul „Compară cu…" (există; apare automat când comparația e publicată).
- „Alte comparații": 4–6, cu aceeași fișă înaintea celorlalte (clusterele din STRATEGY §4).
- Listele care conțin ambele rase („Apare în": `getListsForBreed`), ex. `/liste/rase-de-caini-pentru-copii`.
- Articole de sănătate relevante prin `rase_predispuse`; secțiunile `/caini/rase` sau `/pisici/rase`; glosar pentru termeni (brahicefalic, dublu strat).
- Breadcrumb: Acasă > Comparații > titlu (există).
- Nu se linkează către site-uri comerciale; surse externe cu `rel` normal pentru instituții, fără affiliate.

## 7. Schema (vezi `comparison-schema.json`)

Se folosește ce generează deja `generatePostSchema`: WebSite + BreadcrumbList + Article + FAQPage (din `faqBlock`).
Nu se adaugă un al doilea FAQPage / BreadcrumbList / Product / AggregateRating. Singurele adăugiri propuse: `about` (cele două animale ca `Thing` cu `url` spre fișe) pe Article.

## 8. Listă de verificare înainte de publicare

- [ ] ambele fișe sunt publicate; ≥ 6 rânduri comune în tabel, < 30% „—"
- [ ] primul paragraf: 40–55 de cuvinte, ambele nume, ambele linkuri
- [ ] verdict în formatul din §3; fără „câștigător"
- [ ] fiecare cifră e în fișe sau are sursă linkată; secțiunea „Sănătate" are sursă
- [ ] FAQ 5–6 întrebări, fără repetarea textului din fișe
- [ ] `metaTitle` ≤ 52 de caractere, fără „DiVet"; `metaDescription` 140–155
- [ ] slug = `a-vs-b`; nu există `b-vs-a`
- [ ] ≥ 4 linkuri interne spre alte comparații/liste/sănătate; cele două fișe linkate
- [ ] după publicare: „Compară cu…" apare pe ambele fișe; pagina este în sitemap; URL trimis la IndexNow
