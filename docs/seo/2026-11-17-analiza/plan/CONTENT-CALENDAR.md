# Calendar de conținut — 25.11.2026 – 16.02.2027 (12 săptămâni)

Pornește după coada actuală (ultima programare ~24.11.2026). Săptămâna = miercuri–marți.

## 0. Reguli și volume

- **Cadență: ~14 pagini/săptămână (2/zi în medie), 166 în 12 săptămâni.** Planul F4 propunea 4/zi; recomand să **nu** depășim 2/zi: constrângerea reală este verificarea surselor (eșantion 25%) și recenzia medicală, nu scrierea. Dacă recenzorul e confirmat și lotul trece fără corecturi majore, se poate urca la 3/zi din săptămâna 7.
- Sloturi existente: 11:00 și 17:00 ora României (din lotul de sănătate); propun 3 sloturi/zi (09:30, 13:00, 17:00), dar publicăm câte 2 în zilele obișnuite și 1 în weekend.
- **Sănătatea (YMYL): 3/săptămână**, publicate cu eticheta „în curs de revizuire” până la confirmarea recenzorului; după 31.12.2026, doar cu `reviewedBy`.
- **Condiții de pornire pentru comparații:** ambele fișe publicate. Ordinea de mai jos ține cont de asta.
- Ritmul lunar de re-măsurare (GSC, GEO) este în `IMPLEMENTATION-ROADMAP.md`.
- Toate titlurile de mai jos sunt **propuneri de lucru**; prioritatea se re-ordonează după primul export GSC (săptămâna 1).

### Mix pe 12 săptămâni

| Tip | Număr | Pe săptămână | Țintă URL |
|---|---|---|---|
| Fișe rase câini | 36 | 3 | `/caini/rase/<slug>` |
| Fișe rase pisici | 12 | 1 | `/pisici/rase/<slug>` |
| Fișe faună | 48 | 4 | `/marine`, `/insecte`, `/salbatice` |
| Sănătate (boli, simptome, toxice, vaccinare, paraziți, urgențe) | 36 | 3 | `/sanatate/*` |
| Comparații | 12 | 1 | `/comparatie/<a>-vs-<b>` |
| Liste filtrate | 8 | ~0,7 | `/liste/<slug>` |
| Instrumente | 4 | ~0,3 | `/instrumente/<slug>` |
| Animale mici de companie | 10 | ~0,8 | `/animale-mici/...` (hub după 6) |
| **Total** | **166** | **~14** | |

Extra (nu intră în numărătoare): 110 termeni noi în glosar (de la ~40 la 150), 10 texte de categorie, 20 de intro-uri sau dezactivări de etichete.

### Fauna pe subcategorie (48)

mamifere marine +5 · rechini și pești +4 · nevertebrate marine +5 · păsări marine +2 · gândaci +4 · insecte exotice +4 · mamifere sălbatice +2 · răpitoare +8 · fauna României +8 · specii protejate +6.

## 1. Pre-condiții din prima săptămână (înainte de volumul mare)

| Dată | Acțiune | Responsabil |
|---|---|---|
| 18–24.11 | Acces GSC + Bing; export interogări/404; prima rulare `suggest.ts` actualizată | utilizator + agent |
| 22.11 | Prima comparație (labrador vs golden) live — verifică schema, noindex pe hub devine indexabil la a 3-a | agent |
| 24.11 | Decizie recenzor | utilizator |
| 25.11 | Prima măsurare GEO (30 de prompturi) → `geo-tracking.csv` | agent |

## 2. Calendarul pe săptămâni

Notație: **[R]** rasă câini, **[P]** rasă pisici, **[F]** faună, **[S]** sănătate, **[C]** comparație, **[L]** listă, **[I]** instrument, **[A]** animale mici. Fiecare rând = un articol propus (titlu de lucru → URL).

### S1 · 25.11 – 01.12 (14 pagini) — „Completăm bazele comparațiilor și lista de rase mici”
- [R] Malamut de Alaska · Dobermann · Shih Tzu → `/caini/rase/malamut-de-alaska`, `.../dobermann`, `.../shih-tzu`
- [P] Birman → `/pisici/rase/pisica-birmana-sacra` (verifică numele standard FCI/FIFe)
- [F] Lamantinul (`/marine/mamifere-marine/lamantinul`) · Cașalotul · Stea de mare (`/marine/nevertebrate-marine/steaua-de-mare`) · Acvila de munte (`/salbatice/rapitoare/acvila-de-munte`)
- [S] Leptospiroza la câini (`/sanatate/boli/leptospiroza-la-caini`) · Câinele a mâncat ibuprofen/paracetamol (`/sanatate/substante-toxice/ibuprofenul-si-paracetamolul-la-caini-si-pisici`) · Respirație grea la câine (`/sanatate/simptome/cainele-respira-greu`)
- [C] **Maine Coon vs Norvegiană de pădure** (`/comparatie/maine-coon-vs-pisica-norvegiana-de-padure`; ambele fișe live)
- [I] Vârsta pisicii în ani umani (`/instrumente/varsta-pisica`)
- Cod: model `comparatie` finalizat, hub `noindex` până la 3 comparații; câmp `naparleste`.

### S2 · 02.12 – 08.12 (14)
- [R] Cane Corso · Jack Russell Terrier · Yorkshire Terrier
- [P] Devon Rex
- [F] Rechinul-ciocan · Calmarul uriaș · Buha mare (`/salbatice/rapitoare/buha`) · Vidra (`/salbatice/specii-protejate/vidra`)
- [S] Leishmanioza la câini · **Vaccinarea antirabică în România** (`/sanatate/vaccinare/vaccinarea-antirabica`) · Pisica nu urinează (urgență) (`/sanatate/simptome/pisica-nu-urineaza`)
- [C] **Persană vs British Shorthair**
- [L] **Rase de câini mici** (necesită ≥ 8 fișe „Mic”: chihuahua, pomeranian, boston terrier, bichon frisé, coton de tulear, shih tzu, yorkshire, jack russell → 8 ✔) → `/liste/rase-de-caini-mici`
- [A] Iepurele de companie: ghid (`/animale-mici/iepure/iepurele-de-companie`)

### S3 · 09.12 – 15.12 (14)
- [R] Ciobănesc Belgian Malinois · Boxer · Carlin (pug)
- [P] Pisica Siberiană
- [F] Pește-clovn · Meduza-cutie · Șoimul călător · Pisica de mare (sepia)
- [S] Dirofilarioza la câini · Vaccinarea câinelui adult: rapeluri (`/sanatate/vaccinare/rapeluri-la-caini`) · **Insolația la câine** (`/sanatate/urgente/insolatia-la-caini`)
- [C] **Husky vs Malamut**
- [L] **Rase de câini medii** (≥ 8 „Mediu”: de verificat câmpul; altfel amânat)
- [I] **Porția zilnică de hrană** (RER/MER, cu avertismente)
- [A] Hamsterul sirian

### S4 · 16.12 – 22.12 (14) — „Sezon de sărbători: toxice și pericole”
- [R] Cocker Spaniel · Samoyed · Akita Inu
- [P] Cornish Rex
- [F] Delfinul cu nas de sticlă · Pufinul (`/marine/pasari-marine/pufinul`) · Gândacul scarabeu · Pisica sălbatică (`/salbatice/fauna-romaniei/pisica-salbatica`)
- [S] Plante de Crăciun toxice pentru pisici și câini (`/sanatate/substante-toxice/plantele-de-craciun-si-animalele`) · Nucile și migdalele la câini · Pancreatita la câini (`/sanatate/boli/pancreatita-la-caini`)
- [C] **Pisică sau câine?** (hub de decizie, fără costuri nesusținute)
- [L] **Rase de câini pentru apartament** (energie scăzută/medie + talie)
- [A] Cobaiul (`/animale-mici/cobai/cobaiul`)

### S5 · 23.12 – 29.12 (12; ritm redus în sărbători)
- [R] Dalmatian · Shiba Inu
- [P] Pisica Turcă de Van
- [F] Narvalul · Peștele-leu · Crabul-păianjen · Cerbul carpatin (`/salbatice/fauna-romaniei/cerbul-carpatin`)
- [S] Constipația la câini · Alimente de Crăciun periculoase (legat de instrumentul `aliment-periculos`)
- [C] **Ciobănesc mioritic vs Ciobănesc carpatin** (ambele fișe live)
- Cod: `lib/related.ts` și oprirea `.backlinks.cjs`; recenzor: lotul 1 (boli) revizuit.

### S6 · 30.12 – 05.01 (14) — „Reluare + gate de sănătate”
- [R] Ciobănesc Australian · Teckel · Cavalier King Charles Spaniel
- [P] Ocicat
- [F] Foca cenușie · Corali · Calmarul comun · Uliul porumbar (`/salbatice/rapitoare/uliul-porumbar`)
- [S] **Din 01.01: toate articolele de sănătate se publică cu `reviewedBy`.** Deparazitarea cățelului (legat de `deparazitarea-cainilor-si-pisicilor`) · Sterilizarea pisicii și a cățelei · Prima vizită la veterinar (ultimele două cer o categorie nouă `sanatate/ingrijire`, vezi roadmap, decizia D6)
- [C] **Siameză vs Orientală** (ambele fișe live)
- [A] Papagalul peruș (`/animale-mici/papagali/perusul`)

### S7 · 06.01 – 12.01 (14) — „Rase mari și comparații cu cerere”
- [R] Mastiff · Saint Bernard · Newfoundland
- [P] Tonkineză
- [F] Albatrosul · Gândacul croitor · Călugărița religioasă · Mistrețul (`/salbatice/mamifere/mistretul`)
- [S] Boala renală cronică la pisici · Convulsiile la câini (urgență) · Otita externă la câini
- [C] **Alabai vs Ciobănesc caucazian**
- [L] **Cele mai mari animale** (necesită `greutate_max_kg` + ≥ 8 intrări) → `/liste/cele-mai-mari-animale`
- [A] Țestoasa de uscat

### S8 · 13.01 – 19.01 (14)
- [R] Weimaraner · Basset Hound · Whippet
- [P] Balineză
- [F] Gândacul-bastonaș · Fluturele monarh · Cormoranul mare · Vipera comună (`/salbatice/fauna-romaniei/vipera-comuna`; câmp `pericol`)
- [S] Hipertiroidismul la pisici · Torsiunea gastrică la câini · Dermatita atopică la câini
- [C] **Bulldog francez vs Boston Terrier**
- [L] **Rase de câini pentru copii** (câmp `bun_cu_copiii`)
- [I] **Calendar vaccinare + deparazitare** (generează .ics; doar cu aprobarea recenzorului)

### S9 · 20.01 – 26.01 (14) — „Rase de lucru și faună protejată”
- [R] Setter englez · Pudel (o fișă, trei talii) · Ogar afgan
- [P] Bobtail japonez
- [F] Scorpionul · Hamsterul european (`/salbatice/specii-protejate/hamsterul-european`) · Castorul · Capra neagră (`/salbatice/specii-protejate/capra-neagra`)
- [S] Căpușele: calendarul sezonier · Calicivirusul felin · Hepatita infecțioasă canină
- [C] **Beagle vs Basset Hound** (Basset din S8)
- [A] Gecko leopard

### S10 · 27.01 – 02.02 (14)
- [R] Shar Pei · Ciobănesc Românesc de Bucovina · Kangal
- [P] Somali
- [F] Rechinul-tigru · Cosașul · Peștele-lună · Carnivorele mari din România (pagină-hub: `/salbatice/fauna-romaniei/carnivorele-mari`, leagă lupul, ursul, râsul)
- [S] Coriza pisicii (rinotraheita) · Câinele bea mult · Insuficiența renală la câini: alimentație (fără doze)
- [C] **Orcă vs delfin comun** (ambele există)
- [L] **Rase de pisici de apartament**
- [A] Peștele auriu (acvariu mic)

### S11 · 03.02 – 09.02 (14)
- [R] Staffordshire Bull Terrier · Bull Terrier · Terrier Scoțian
- [P] Manx
- [F] Jderul (`/salbatice/fauna-romaniei/jderul`) · Pelicanul creț · Cerbul-lopătar · Gândacul de Colorado
- [S] Diabetul la pisici · Epilepsia la câini · Cum scoți o căpușă (HowTo, `/sanatate/urgente/cum-scoti-o-capusa`)
- [C] **Rechin alb vs rechin taur**
- [L] **Rase de câini de pază** (talie mare; ≥ 8 intrări cu atribut)
- [I] **Greutate ideală / BCS pentru câine și pisică**

### S12 · 10.02 – 16.02 (14) — „Consolidare + analiza de 3 luni”
- [R] Border Terrier · Ciobănesc Scoțian (Collie) · Dog German
- [P] British Longhair
- [F] Lebăda cucuiată · Peștele-sabie · Pinguinul african · Bufnița de zăpadă (verificare statut)
- [S] Displazia de șold la câini (legat de „rase predispuse”) · Sterilizarea câinelui (după decizia de categorie) · Microciparea în 2026 (verificare legislativă obligatorie)
- [C] **Ragdoll vs Maine Coon**
- [A] Șobolanul de companie
- Raport „3 luni” (vezi roadmap, finalul Fazei 2).

> **Notă.** Titlurile sunt **propuneri de lucru**. Fiecare specie trece verificarea de sursă (IUCN, FCI, enciclopedii) înainte de programare; titlurile care nu trec se înlocuiesc cu specii din aceeași subcategorie, fără a schimba numărul. Lista finală se fixează săptămânal în `keyword-map.csv`. Calendarul fixează **tipurile, numărul și dependențele**. Subcategoriile `fauna-romaniei`, `specii-protejate`, `rapitoare` și `sanatate/urgente`/`ingrijire` trebuie create înainte de prima publicare în ele (vezi `SITE-STRUCTURE.md` §6).

## 3. Dependențe și porți

1. **Comparațiile** nu se publică înainte de a doua fișă (Malamut S1 → husky vs malamut S3; Basset S8 → beagle vs basset S9).
2. **Listele** cer ≥ 8 intrări cu atributul real; verificarea se face cu scriptul de listă (sub 8 → 404/noindex).
3. **Sănătate**: toate cele 36 de articole noi + ~38 existente trebuie să treacă prin recenzor; dacă SLA-ul de 5 zile nu se respectă, reducem la 2/săptămână, nu publicăm nerevizuit după 01.01.2027.
4. **Instrumente**: formula și sursa primară citate în pagină, testate cu Vitest; calendarul de vaccinare nu se lansează fără recenzor.
5. **Imagini**: Commons cu atribuire; minim 1 imagine proprie sau unică/săptămână din S3.
6. **Link intern**: fiecare articol nou, la publicare, primește ≥ 2 linkuri de intrare din articole existente și trimite ≥ 4 (publisher validează).

## 4. Calendar editorial pe teme (sezonalitate, RO)

| Perioadă | Temă | Pagini |
|---|---|---|
| Decembrie | Plante și alimente toxice de sărbători, frig, artificii (anxietate) | S4–S5 |
| Ianuarie | Frigul și câinii/pisicile, obezitatea post-sărbători, hipotermie | S6–S8 |
| Februarie | Căpușe (pregătire martie), deparazitare, vaccinare primăvară | S9–S12 |
| Martie–octombrie | Căpușe, canicula (insolație) | după 16.02 |

## 5. Ce urmărim din calendar (KPI de conținut)

- Publicate la timp: ≥ 90% din 166.
- Rata de respingere la verificare manuală: < 10% (altfel reducem cadența).
- ≥ 4 linkuri interne primite per articol la 14 zile de la publicare.
- Pagini indexate / publicate ≥ 85% la 28 de zile (GSC).
- Impresii medii per pagină la 28 de zile: reper de lucru > 20 (est.); sub 5 după 60 de zile → consolidăm sau îmbunătățim.
