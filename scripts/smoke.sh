#!/usr/bin/env bash
# smoke.sh — test de fum dupa deploy: paginile din sitemap trebuie sa raspunda 200
#
# Utilizare:
#   scripts/smoke.sh [BASE_URL] [MAX]     (implicit: http://127.0.0.1:3002 si 30 de pagini)
#
# De ce din sitemap: listeaza cate o pagina din fiecare tip (acasa, index, grupuri,
# subcategorii, pagini statice, etichete, autori, articole), deci un tip de ruta stricat
# (de ex. o configurare de cache gresita care da 500 doar in productie) nu trece neobservat.
# Se adauga si o pagina inexistenta, care trebuie sa dea 404, nu 500.
#
# Iese cu codul 1 daca vreo pagina nu are statusul asteptat.

set -uo pipefail

BASE="${1:-http://127.0.0.1:${PORT:-3002}}"
MAX="${2:-30}"

code() { curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$1" || true; }

echo "▶ Test de fum: $BASE"

SITEMAP_CODE="$(code "$BASE/sitemap.xml")"
if [ "$SITEMAP_CODE" != "200" ]; then
  echo "  ✗ /sitemap.xml  ($SITEMAP_CODE)"
  exit 1
fi

# <loc> -> cale (fara origine); sitemap-ul contine URL-uri absolute cu domeniul public
PATHS="$(curl -s --max-time 30 "$BASE/sitemap.xml" \
  | grep -o '<loc>[^<]*</loc>' \
  | sed -E 's#<loc>https?://[^/]+##; s#</loc>##; s#^$#/#' \
  | sort -u)"

TOTAL="$(printf '%s\n' "$PATHS" | grep -c . || true)"
if [ "$TOTAL" -eq 0 ]; then
  echo "  ✗ sitemap-ul nu contine niciun URL"
  exit 1
fi

# Peste limita, esantion uniform (ca sa acopere si urmele fiecarui tip)
if [ "$TOTAL" -gt "$MAX" ]; then
  STEP=$(( (TOTAL + MAX - 1) / MAX ))
  PATHS="$(printf '%s\n' "$PATHS" | awk -v s="$STEP" 'NR % s == 1')"
fi

FAILED=0
CHECKED=0
while IFS= read -r p; do
  [ -z "$p" ] && continue
  c="$(code "$BASE$p")"
  CHECKED=$((CHECKED + 1))
  if [ "$c" = "200" ]; then
    echo "  ✓ $p  ($c)"
  else
    echo "  ✗ $p  ($c, asteptat 200)"
    FAILED=$((FAILED + 1))
  fi
done <<< "$PATHS"

# Pagina inexistenta: 404, nu 500
c="$(code "$BASE/nu-exista-test-de-fum")"
CHECKED=$((CHECKED + 1))
if [ "$c" = "404" ]; then
  echo "  ✓ /nu-exista-test-de-fum  ($c, asteptat 404)"
else
  echo "  ✗ /nu-exista-test-de-fum  ($c, asteptat 404)"
  FAILED=$((FAILED + 1))
fi

echo "  Verificate: $CHECKED   Esuate: $FAILED   (din $TOTAL URL-uri in sitemap)"
[ "$FAILED" -eq 0 ]
