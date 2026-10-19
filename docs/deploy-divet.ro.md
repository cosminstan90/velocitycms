# Lansarea noului DiVet pe divet.ro

Server: `root@2.59.132.127` · aplicația: `/home/divet.ro/htdocs/app` · proces PM2: `velocitycms` (port 3002) · Node 22.

Nimic de aici nu se rulează automat. Fiecare pas pe producție se face cu acordul proprietarului.

## Ce se schimbă

- **Cod:** template-ul `divet` (navigație din categorii, fișe cu date structurate, `/index-a-z`, FAQ vizibil, JSON-LD și sitemap corectate, publisher cu `subCategorySlug`).
- **Baza de date:** două migrări aditive pe `Category` (`sortOrder`, `showInNav`; unicitatea slug-ului devine pe părinte). Cele 3 articole existente rămân neatinse în `caini`.
- **Date:** 7 grupuri + 30 de subcategorii și 19 definiții de câmpuri (seed-uri idempotente).
- **Site-ul rămâne pe template-ul `fauna`** până când îl comuți tu din admin.

## Înainte de prima lansare (local)

1. Branch-ul `feat/divet-enciclopedie` conține deja `origin/main`. Publică-l și îmbină-l în `main` (PR pe GitHub).
2. `main` trebuie să fie fast-forward față de ce e pe server (`git log e061d64..main` — serverul e la `e061d64`).

## Lansarea (pe server)

Scripturile `deploy-pm2.sh`, `backup-db.sh` și `scripts/smoke.sh` vin cu codul nou, deci **prima dată** se aduce codul manual:

```bash
ssh root@2.59.132.127
cd /home/divet.ro/htdocs/app
git pull --ff-only origin main        # nu atinge ecosystem.config.js (are o modificare locala pe server)
./deploy-pm2.sh --skip-pull --seed
```

Ce face scriptul, în ordine: backup al bazei (verificat) în `/home/divet.ro/backups/pre-deploy/` → `npm ci` → `prisma generate` + `migrate deploy` → seed-uri (`--seed`) → `npm run build` → `pm2 reload` → health check → test de fum.

Testul de fum cere 200 pe cel mult 30 de pagini din sitemap (acasă, grupuri, subcategorii, articole, etichete, autori) și 404 pe o pagină inexistentă. Dacă pică, scriptul oprește și tipărește comanda de revenire la commit-ul anterior.

Lansările următoare: `./deploy-pm2.sh` (fără `--seed`, fără `--skip-pull`).

## După lansare (în admin)

1. Site-ul rulează încă pe `fauna`. Verifică-l: `https://divet.ro/`, un articol, `/index-a-z`.
2. `/admin/sites` → site-ul Divet → template **DiVet**. Efectul e imediat.
3. `/admin/seo`: înlocuiește titlul „Ttitle Meta" și descrierea „Description" cu texte reale (titlul paginii principale vine din baza de date, nu din cod).
4. Verifică în browser: meniul cu grupuri, mega-meniul, o fișă, `/caini`, căutarea, pe desktop și pe telefon.

## Revenire

| Situație | Acțiune |
|---|---|
| Designul nu convinge | `/admin/sites` → template înapoi pe **Fauna**. Instant, fără redeploy. Limitare: `fauna` face linkuri greșite pentru articolele din subcategorii (nu are noțiunea de părinte). |
| Codul nou strică ceva | `git reset --hard <commit anterior> && npm ci --include=dev && npm run build && pm2 reload velocitycms` (scriptul tipărește comanda cu hash-ul corect). |
| Baza de date | Migrările sunt aditive. Dacă totuși e nevoie: restaurează backup-ul într-o bază **nouă**, verifică-o, apoi decide: `gzip -dc <dump>.sql.gz \| psql <url-baza-noua>`. |

## Ce trebuie actualizat în afara acestui repo

- **Sistemul care publică articole prin API** trebuie să trimită `categorySlug` (grup) și `subCategorySlug` (vezi regula 3 din `AI_CONTENT_GUIDE.md`). Fără `subCategorySlug`, articolul intră direct în grup (`/caini/<slug>`), ca înainte. Un slug necunoscut creează o categorie nouă care **nu apare în meniu** până nu e publicată din admin.
- Valorile de rating din câmpuri folosesc o singură scară cu cinci trepte (vezi ghid).

## Riscuri și limitări cunoscute

- **Nu pune `export const revalidate` pe rutele din `app/(frontend)`.** `app/not-found.tsx` citește `headers()` (ca să logheze 404-urile), iar componenta 404 e inclusă în fiecare pagină: orice rută devine dinamică, iar cele cu `revalidate` + `generateStaticParams` dau 500 în producție ("Page changed from static to dynamic"). Toate rutele din `(frontend)` sunt `force-dynamic`. Dev-ul și `tsc` nu prind asta; testul de fum după deploy da.
- `next build` descarcă fonturile de la Google (`next/font`): serverul are nevoie de acces la internet în timpul build-ului.
- Build-ul scrie în `.next` cât timp procesul vechi încă rulează: în cele câteva zeci de secunde ale build-ului, câteva cereri pot primi erori.
- Căutarea ignoră diacriticele pentru română și literele latine uzuale (translate în SQL, fără extensie). Pe un volum mare de articole interogarea face scanare secvențială; dacă devine lentă, se trece pe o coloană normalizată cu index trigram.
- Comparațiile (`/comparatie`) nu sunt restilizate: cad pe template-ul `fauna`.
- Unicitatea slug-ului pe categorii rădăcină nu e garantată de baza de date (în PostgreSQL `NULL` nu e egal cu `NULL`); o garantează aplicația, în API-ul de categorii și în seed-uri.
- `contentHtml` se afișează fără sanitizare (comportament existent): token-ul de publisher trebuie tratat ca secret.
- Rich Results Test (Google) nu poate fi rulat de aici: după lansare, verifică manual un articol cu FAQ.
