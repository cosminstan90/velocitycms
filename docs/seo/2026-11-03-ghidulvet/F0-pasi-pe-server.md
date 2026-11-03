# F0: pași care rămân pe server / în admin (nu se pot face din cod)

Codul din PR-ul F0 nu schimbă nimic din ele singur. Fiecare pas e independent.

## 1. Texte vechi în SEO (admin, 2 minute)

Titlul și descrierea paginii principale vin din baza de date (`/admin/seo`), nu din cod. Acum sunt:

- Titlu: `DiVet – Enciclopedia animalelor de companie`
- Descriere: `Ghid complet despre câini, pisici, animale mici, păsări și animale exotice…`

Site-ul nu acoperă „animale mici” sau „păsări”. Propunere (descrierea are 148 de caractere):

- Titlu: `DiVet – Enciclopedia animalelor din România`
- Descriere: `Enciclopedie despre câini, pisici, animale marine, insecte și specii sălbatice: origine, aspect, temperament, îngrijire și sănătate.`

Aceeași descriere ajunge în RSS (`/feed.xml`), `/blog` și manifest.

## 2. Etichete fără diacritice (admin sau script, la alegere)

Tag-urile se numesc acum „Caini Familie”, „Rase Mari” etc. Numele (nu slug-ul) se corectează din admin, fără risc pentru URL-uri.
Propunere: `Câini de familie`, `Rase mari`, `Rase mici`, `Câini de lucru`, `Câini prietenoși`, `Câini de pază`, `Câini de vânătoare`, `Câini de aret`, `Câini activi`, `Rase de pisici`, `Nevertebrate marine`, `Ciobănesc german`, `Golden retriever`, `Labrador retriever`, `Bichon frisé`.
Fără descriere în admin, pagina de etichetă afișează acum o descriere generică; una scrisă de mână (80–150 de cuvinte) e mai bună.

## 3. Header-e de securitate duplicate (nginx)

Răspunsul public conține `X-Frame-Options: DENY` (din Next) **și** `X-Frame-Options: SAMEORIGIN`. Al doilea vine dintr-un fișier inclus de nginx, nu din `divet.ro.conf`. Se caută astfel:

```bash
grep -rn "X-Frame-Options" /etc/nginx/ /usr/local/ 2>/dev/null
```

Se șterge linia `add_header X-Frame-Options SAMEORIGIN` de acolo (sau se suprascrie în vhost cu `proxy_hide_header X-Frame-Options;` în `location @reverse_proxy`) și apoi `nginx -t && systemctl reload nginx`. Next rămâne singura sursă de header-e de securitate.

## 4. Cache pentru HTML (nginx microcache) — F0.12

Aplicația trimite `Cache-Control: no-store` pe toate paginile (rutele sunt `force-dynamic`, vezi ghidul de deploy: `revalidate` nu e o opțiune). Rezultat: la rafală, TTFB urcă la 1–19 s. Soluția fără risc pentru aplicație este un cache scurt în nginx.

1. În `/etc/nginx/nginx.conf`, în blocul `http {}`:

```nginx
proxy_cache_path /var/cache/nginx/divet levels=1:2 keys_zone=divet:20m max_size=500m inactive=10m use_temp_path=off;
```

2. În `location @reverse_proxy` din `divet.ro.conf` (adaugă, nu înlocui):

```nginx
    # Microcache: HTML public 60 s, nu pentru admin/API/login/sesiuni.
    set $skip_cache 0;
    if ($request_method != GET)                          { set $skip_cache 1; }
    if ($request_uri ~* "^/(admin|api|login|auth)")       { set $skip_cache 1; }
    if ($http_cookie ~* "authjs|next-auth|session")       { set $skip_cache 1; }

    proxy_cache divet;
    proxy_cache_key "$scheme$host$request_uri";
    proxy_cache_valid 200 301 308 60s;
    proxy_cache_valid 404 10s;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
    proxy_cache_background_update on;
    proxy_cache_lock on;
    proxy_ignore_headers Cache-Control Expires;
    proxy_cache_bypass $skip_cache;
    proxy_no_cache $skip_cache;
    add_header X-Cache-Status $upstream_cache_status;
```

3. `mkdir -p /var/cache/nginx/divet && chown www-data /var/cache/nginx/divet` (utilizatorul din `nginx.conf`), `nginx -t && systemctl reload nginx`.

Verificare: `curl -sI https://divet.ro/caini/rase | grep -i x-cache-status` (MISS, apoi HIT) și o rafală de 20 de cereri concurente cu `p95 TTFB < 800 ms`. `/admin`, `/api/*` și `/login` trebuie să rămână fără `HIT`. Un articol publicat de scheduler apare în cel mult 60 s.

Atenție: `proxy_ignore_headers Cache-Control` face ca nginx să ignore `no-store` doar pentru rutele care nu sunt excluse mai sus. Dacă adaugi rute noi cu date personalizate (ex. coș, cont), adaugă-le în lista `skip_cache`.

## 5. IndexNow (opțional, Bing/Yandex)

1. Generează o cheie: `openssl rand -hex 16`.
2. În `.env` de pe server: `INDEXNOW_KEY=<cheia>`. Cheia se citește la **build** (rewrite-ul `/{cheie}.txt`), deci urmează `./deploy-pm2.sh`.
3. Verificare: `curl https://divet.ro/<cheia>.txt` returnează cheia.
Fără variabilă, nu se întâmplă nimic. Cu ea, `/api/scheduler/run` anunță automat URL-urile nou publicate.

## 6. Slug-uri lungi (F0.14): decizie luată să NU se facă

`bichon-frise-rasa-caini-caracteristici`, `labrador-rasa-caini-caracteristici`, `golden-retriever-caracteristici-temperament` sunt cele 3 articole vechi. Aceste slug-uri sunt exact URL-urile originale pe care Google le-a indexat și pe care vin backlinkurile din 2025 (apar în exportul GSC ca `/labrador-rasa-caini-caracteristici` etc.). Redenumirea ar adăuga un lanț de redirecturi pentru un câștig de SEO neglijabil. Rămân cum sunt.
