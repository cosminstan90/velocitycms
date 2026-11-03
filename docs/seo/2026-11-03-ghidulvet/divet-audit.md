# divet.ro audit (read-only), measured 2026-11-03 ~20:30-20:40 UTC

Note: the live date is 2026-11-03 (not 11-20). Local checkout branch is `fix/proxy-host-forwarded`, not `main`; live deploy may differ slightly from it.

## Part A: Live site

### A1. robots / sitemap / counts
- robots.txt (159 B): `User-agent: *  Allow: /`, Disallow `/admin/ /api/ /_next/`, Sitemap: sitemap.xml + sitemap-images.xml. No per-bot AI rules (all AI crawlers allowed; `blockAiTrainingBots` = false).
- /sitemap.xml: 63 URLs, single file (no index). lastmod range 2026-10-25T11:12 to 2026-11-03T18:01 (all have lastmod, changefreq, priority).
  - 1 home, 1 /index-a-z, 5 group hubs (caini, pisici, salbatice, marine, insecte), 8 subcategory hubs, 2 pages (/despre-noi, /politica-confidentialitate), 8 tag pages (/eticheta/*), 1 author (/autor/redactia), **37 articles**.
  - Articles per category: caini/rase 16, pisici/rase 10, marine/nevertebrate-marine 3, marine/mamifere-marine 2, marine/rechini-si-pesti 2, insecte/insecte-exotice 2, insecte/gandaci 1, salbatice/mamifere 1.
  - 3 of the 37 are legacy-site articles (published 2026-03-28/29/31: labrador, golden-retriever, bichon-frise, long keyword slugs, 1800-2100 words). 34 are from the relaunch queue (2026-10-23 .. 2026-11-03: 2-3 per day).
  - Tag pages in sitemap: caini-familie, caini-activi, caini-de-aret, caini-de-paza, caini-de-vanatoare, rase-mari, rase-pisici, nevertebrate-marine. Tag titles are un-diacriticised ("Caini Familie").
- /sitemap-images.xml: 37 image entries (one per article, with image:title).
- /sitemap.xml/ -> 308 to /sitemap.xml. No sitemap_index/wp-sitemap.

### A2. Page-by-page (title / meta / H1 / H2 / JSON-LD)
**Homepage `/`** (228 KB)
- title "DiVet – Enciclopedia animalelor de companie"; meta "Ghid complet despre câini, pisici, animale mici, păsări și animale exotice: rase, caracteristici, temperament, îngrijire și sănătate." (stale: no "animale mici, păsări" content exists; title says "de companie" but site has marine/wild/insects). Same stale meta is on /blog and the RSS description.
- H1 "Enciclopedia animalelor din România". H2: Explorează după grup / Articole recomandate / Adăugate recent / O enciclopedie făcută pentru cititori. ~576 words, 43 internal links, 0 external, 28 imgs (17 with empty alt = decorative duplicate cards; no missing attr).
- JSON-LD (one @graph): Organization (no logo, no sameAs), WebSite+SearchAction, CollectionPage with ItemList, FAQPage (home FAQ is visible, 9 details).
- **BUG: ItemList URLs are wrong**: `https://divet.ro/rase/pisica-orientala`, `/nevertebrate-marine/caracatita-...`, `/mamifere-marine/...`, `/gandaci/...` all return 404. Cause: `postUrl()` in `app/(frontend)/page.tsx` L100-102 uses only `p.category.slug` and ignores the parent. Fix: reuse `buildPostPath` / `p.href`.

**Category hub `/caini/rase`** (TTFB varied, see A3)
- title "Rase de câini: caracteristici și comparații | DiVet" (52 chars); meta 142 chars; H1 "Rase de câini"; H2: Toate articolele din Rase de câini / Întrebări frecvente despre rase de câini / Alte secțiuni. ~564 words (intro + FAQ from `lib/category-content.ts`), 25 internal links, 12 cards (page size 12 so 16 articles paginate). JSON-LD: WebSite, BreadcrumbList, CollectionPage (no ItemList, no numberOfItems), FAQPage (visible). Canonical OK, no breadcrumb nav text detected via aria-label (JSON-LD breadcrumb only; visible breadcrumbs component exists: `components/frontend/templates/divet/Breadcrumbs.tsx`).

**Articles** (3 sampled in detail + all 37 crawled)
- /caini/rase/copoi-ardelenesc: title "Copoi ardelenesc: caracteristici și utilizare | DiVet"; meta 137 chars; H1 "Copoi ardelenesc - Rasă de câini: caracteristici și utilizare" (H1 differs from title tag); 19 H2 (Pe scurt, Caracteristicile rasei, Profil comportamental, origine și istorie, Aspect fizic, Temperament, Dresaj, Îngrijire, Alimentație, Sănătate și speranță de viață, Comparație, Potrivit pentru cine, Primele luni acasă, Greșeli frecvente, Întrebări frecvente, Mai multe din Câini...). Page-text ~1200-1300 words including related cards/TOC (the body is longer than the stated 600-850).
- /pisici/rase/pisica-abisiniana: same structure, 20 H2, 1262 words, 23 internal / 3 external links (GCCF + Wikimedia Commons file page + CC license).
- /marine/nevertebrate-marine/caracatita-uriasa-din-pacific: 18 H2, 1187 words; reuses the template heading **"Caracteristicile rasei"** for an octopus (wrong label for non-breed species); 3 external (National Geographic + Commons + CC).
- Across all 37: 1 table each (comparison), 6 FAQ (details elements, visible), 1-4 external links (median 3), always 1 hero image with alt + related thumbnails, `<time>` shows only the published date ("27 octombrie 2026"); abisiniană shows an "Actualizat" label with an empty value in the sampled markup.
- Title tags 41-56 chars, meta 131-153 chars, all within range; no duplicates seen. Slug style: new = clean species slug; legacy 3 = long keyword slugs.
- JSON-LD on every article (identical for all 37): `WebSite, BreadcrumbList, Article, FAQPage`.
  - Article: author Person "Redacția DiVet" with url https://divet.ro/autor/redactia (correct); publisher Organization WITHOUT logo; datePublished/dateModified (dateModified is ~equal to datePublished); speakable cssSelector `article h1`, `[data-speakable="tldr"]` (good); articleSection.
  - **BUG: `image.url` is relative** (`/media/uploads/...webp`) on all 37 articles. Google requires absolute URLs; fix in `lib/seo/schema-generator.ts` `buildArticleSchema` (imageUrl = featuredImage.url, not passed through `resolveUrl`). Note the OG image tag is absolute, so only the schema is wrong.
  - Article URL, BreadcrumbList items, author URL, FAQ all point to correct URLs.
  - No `Person` @id link (Article author is an inline Person, not `@id` referencing the ProfilePage's Person), no `mainEntityOfPage`, no `about`/`Thing` for the animal, no `MedicalWebPage`/`reviewedBy`, no Taxon/Dataset.
  - FAQPage: Q/A match visible FAQ (6). OK.
- Breadcrumbs: JSON-LD correct (4 levels); visible breadcrumb component exists.
- Images: hero image `webp` via /_next/image (avif/webp), alt text present (pattern "<Name> - Rasă de câini: caracteristici, îngrijire și sănătate"; reused as the card alt on every listing, so many identical alt strings). Image credit link to Wikimedia Commons with licence shown (CC0/CC BY/BY-SA) which is good for compliance. Images come from Commons, so they are not unique.
- AdSense: `adsbygoogle.js` loaded, no manual ad slots (Auto ads).

**Author `/autor/redactia`**: title "Redacția DiVet | DiVet" (doubled brand); H1 only, no H2; 231 words; JSON-LD ProfilePage + Person (jobTitle "Echipa editorială DiVet", description discloses "pregătite cu ajutorul instrumentelor de inteligență artificială", worksFor Organization). Honest AI disclosure; no real human credentials, no sameAs, no image. Meta truncated at 155 with an ellipsis.

**/despre-noi**: H1 "Despre DiVet", 6 H2 (Ce este, Cum sunt făcute articolele, Cum tratăm cifrele care nu se potrivesc, Imagini și licențe, Corecturi, Contact), 260 words (thin but substantive for methodology), JSON-LD WebSite+Breadcrumb+WebPage (no AboutPage, no Organization contactPoint).

**/index-a-z**: 449 words, 15 letter H2s, 38 links, **no JSON-LD**, no og:url. Only lists 37 items, hence will scale as a flat page (ok for now).

**/eticheta/caini-familie** (tag): 86 words, 4 cards, indexable (>=3 posts), no JSON-LD, un-diacriticised title "Caini Familie", meta "Articole etichetate cu Caini Familie" (thin and generic).

**/blog**: legacy route, 200, indexable, **no canonical**, generic home meta, not in sitemap, and not linked: duplicate of the listing. Should be noindex or redirected to /.
**/director** (+ /director/veterinari): live 200 but empty (36 words), `noindex, follow` (correct, 0 listings), not in the sitemap, not in the home nav.
**/comparatie**: 404 on live (route exists in code but requires a "comparatie" category).

### A3. Technical
- TTFB, first pass (cold/concurrent): / 4.2 s, /caini/rase 15.8 s, /caini 3.0 s, article 1.0-3.4 s, /autor 0.6 s, /index-a-z 6.5 s, /cautare 6.5 s, 404 2.9 s. Crawl of the 37 articles in one burst: median 1.55 s, max 19.2 s (dog-de-bordeaux, setter-irlandez, pisica-bombay 19 s; pointer-englez, khao-manee, ursul-grizzly 9 s). Second pass (warm, sequential): 0.26-0.69 s for /, article, hub, /marine, feed. So: fast when idle, **very spiky under concurrent load** (Googlebot-like bursts), because every page is `force-dynamic` and the DB is hit per request.
- Cache-Control on HTML: `private, no-cache, no-store, max-age=0, must-revalidate` for all pages (home, hubs, articles, 404). No CDN/edge caching, no ISR. Static: `/_next/static` and `/media/uploads` images `public, max-age=31536000, immutable` (uploads: `public, max-age=86400` on the image fetched), llms.txt `public, max-age=3600`.
- HSTS: `max-age=31536000; includeSubDomains` (no preload). X-Frame-Options DENY (+ a second SAMEORIGIN from nginx; duplicate/conflicting headers from nginx and Next, also duplicate X-Content-Type-Options and Referrer-Policy with two different values). CSP is set (unsafe-inline/unsafe-eval, Google ad hosts). Permissions-Policy set.
- HTTP -> HTTPS 301, www -> apex 301, trailing slash `/caini/rase/` -> 308 to non-slash (consistent; canonical is non-slash).
- Canonical present on all pages (absolute, no trailing slash; home canonical is `https://divet.ro` without slash vs sitemap `https://divet.ro/`, trivial). `<html lang="ro">`. No hreflang (single language, fine).
- OG/Twitter: complete on all (og:type article on posts; image = featured image; fallback dynamic `/opengraph-image` and `/twitter-image`). Article has no `article:published_time`/`article:author` OG tags (not found).
- **/llms.txt: present (1294 B, llmstxt.org format, section list only, no per-article links, no description of each article). /llms-full.txt: 404.**
- AI crawler rules: none (all allowed) in robots.txt.
- **RSS: /feed.xml exists (20 items, full metadata + enclosure image), but there is no `<link rel="alternate" type="application/rss+xml">` in any page head** (not discoverable). Channel description is the stale homepage meta.
- 404: real 404 status with branded page (14 KB). Case variants (/Caini, /caini/rase/BEAGLE) are 404, not redirected.
- Legacy URLs: `lib/legacy-redirects.ts` maps 12 old URLs (3 old articles + 9 old category pages). On live, `/caini/labrador-retriever` etc. are redirected (my test used non-mapped paths, which 404 as designed). Unknown how many other old-site URLs existed. Redirect UI table in admin (`/admin/redirects`, Redis lookup in `proxy.ts`).
- `/?p=12` returns 200 (query ignored; canonical is the home).
- Images: media is served via `/media/uploads/...` with HTTP 200 for newly published images (fixed, see B).

### A4. Content strategy observations
- Breadth (37 pages live): 26 pet-breed profiles (16 dogs, 10 cats), 7 marine animals, 3 insects/exotic, 1 wild mammal. Four of the five groups have only 1-3 articles; they show up as hubs with a thin list. Cats and dogs dominate the "encyclopedia" but are single-intent "breed profile" pages.
- The "wildlife/marine/insects" topics have high-curiosity but low-commercial value; no pet-owner intent. AdSense RPM for these will be low.
- **Health / veterinary content is almost absent**: each breed article has ONE short "Sănătate și speranță de viață" paragraph (~80 words; lists breed diseases in a sentence). There are no articles on diseases, symptoms, vaccination schedules, deworming, sterilization, toxic foods, nutrition by life stage, first aid, behaviour problems, costs, "can dogs eat X", "how long do cats live", puppy/kitten care, senior care. These are the highest-volume Romanian pet queries and the topics ghidulvet-type sites win on. No MedicalWebPage schema, no named veterinary reviewer (the only author is the AI-assisted editorial team), so YMYL/E-E-A-T on any health content would be weak.
- No tools (food calculator, age converter, weight/portion calculator, vaccination calendar), no comparison hub pages (comparison exists only as a table inside each article), no local/near-me content (the directory is built but empty).
- Breed-only structure means each article reuses the same 18-20 H2 template (template-fingerprint risk for "scaled content" detection; mitigate with variation and real first-hand/vet input).

---

## Part B: Codebase (D:\Projects\Velocity\velocitycms)

### Schema / SEO
| Capability | Status | File |
|---|---|---|
| Post schema graph: WebSite+SearchAction, BreadcrumbList, Article, FAQPage, HowTo, Review | done | `lib/seo/schema-generator.ts` (generatePostSchema L300; buildArticleSchema L~150) |
| Article `image.url` absolute | **broken** (relative) | `lib/seo/schema-generator.ts` L~163-176 |
| `Pet` type when fieldValues has breed/species | exists but half-baked: "Pet" is not a valid schema.org type for this use; not triggered on live (fieldValues not matching) | same file L161-168 |
| Speakable | done (Article + `[data-speakable="tldr"]`) | `lib/seo/speakable-schema.ts`, schema-generator L192 |
| Author Person/ProfilePage | done (PR #22) | `lib/seo/author-schema.ts`, `app/(frontend)/autor/[slug]/page.tsx`. Missing: link Article author to the ProfilePage Person @id; no sameAs/photo (no real person) |
| Home schema (Organization, WebSite, CollectionPage+ItemList, FAQ) | done but ItemList URLs bug | `lib/home-schema.ts`, `app/(frontend)/page.tsx` L100-117; Organization has no logo/sameAs |
| Category schema (CollectionPage) | basic, no ItemList | `generateCategorySchema` in schema-generator L369 |
| MedicalWebPage / reviewedBy / VeterinaryCare for articles | **missing** (VeterinaryCare exists only for directory listings) | `lib/seo/listing-schema.ts` |
| LocalBusiness/VeterinaryCare for listings | done, no reviews/aggregateRating | `lib/seo/listing-schema.ts` |
| Canonical builder, nested paths | done | `lib/seo/canonical-builder.ts` |
| Tag noindex for <3 posts, excluded from sitemap | done | `lib/seo/tag-index.ts`, `app/(frontend)/eticheta/[slug]/page.tsx` L53 |
| sitemap.xml | done: home, A-Z, categories (only with posts), pages, tags, authors, posts, directory (template `divet` only) | `app/sitemap.ts` (force-dynamic) |
| sitemap-images.xml | done | `app/sitemap-images.xml/route.ts` |
| robots.txt | done, with optional AI-training-bot block toggle (`blockAiTrainingBots`, DB setting) | `app/robots.ts` |
| llms.txt | done (nav-derived list); no llms-full.txt, no per-article entries | `app/llms.txt/route.ts` |
| RSS | done (20 items) but no `<link rel=alternate>` in layout | `app/feed.xml/route.ts` (grep shows no rss alternate in `app/layout.tsx`/metadata) |
| IndexNow | missing | none |
| Search | done: diacritic-insensitive SQL translate LIKE, noindex results page | `lib/search.ts`, `app/(frontend)/cautare/page.tsx` |
| Index A-Z | done, no schema | `lib/index-az.ts`, `app/(frontend)/index-a-z/page.tsx` |
| Silo / internal linking | done: related groups + subs + latest per category, never links to empty cats | `lib/silo.ts` (buildSilo), `components/frontend/templates/divet/RelatedArticles.tsx`; admin AI suggestions with Claude Haiku, Redis cache 1h: `lib/seo/internal-linker.ts`, `app/api/posts/[id]/suggest-links/route.ts` |
| Category content (intro, FAQ, meta, related blurbs) | done for 10 keys (caini, caini/rase, pisici/rase, 3 marine, 2 insecte, salbatice/mamifere, plus groups); includes `marine/pasari-marine` with no articles | `lib/category-content.ts` (478 lines) |
| Legacy redirects | 12 aliases, target must exist | `lib/legacy-redirects.ts`; DB redirects in `proxy.ts` -> `/api/internal/redirect-lookup` |
| GEO scorer (direct answer 20, speakable 15, FAQ 15, stats 10, author 10, definition 10, comparison 10, citability 10) | done, pure function, used by publisher | `lib/seo/geo-scorer.ts` (390 lines), UI `components/seo/GeoPanel.tsx`, SEO panel `components/seo/SeoPanel.tsx` |
| Visible FAQ | done (`<details>`) and JSON-LD matches | `components/frontend/templates/divet/FaqSection.tsx` |
| Comparison | `comparisonBlock` editor block exists (`components/editor/blocks/ComparisonBlock.ts`); live articles render a `<table>`. `/comparatie` route exists but 404 live (no category) | `app/(frontend)/comparatie/*` |
| Spec grid / TL;DR / behaviour profile | done | `SpecGrid.tsx`, `TldrCard.tsx`, `BehaviorProfile.tsx` |
| Directory (vets, trainers, groomers) | built (listings, services, city/type pages, admin CRUD, seed script), **empty on live** (noindex, not in sitemap, not in nav) | `lib/director.ts`, `lib/listings.ts`, `app/(frontend)/director/**`, `app/api/listings`, `app/(admin)/admin/director` |
| Calculators / tools | **none** (word appears only in geo-scorer) | n/a |
| Newsletter | API exists (`app/api/newsletter/route.ts`) | not surfaced on the sampled pages |
| Hreflang | none (single language) | n/a |

### Publisher API
- `POST /api/publisher/receive` (`app/api/publisher/receive/route.ts`, 485 lines): X-CMS-Token timing-safe auth; accepts title, slug, contentHtml, category/subCategory, focusKeyword, fieldValues[], featured image (download + webp processing, alt generation), `status` draft|published, `scheduledAt` (ISO, >1 min in future), otherwise a smart slot (`lib/publisher/scheduler.ts`, 57 lines) via cron `app/api/scheduler/run`. Computes GEO score + schema + speakable on save.
- HTML to Tiptap JSON via `lib/tiptap/server-html-parser.ts`. AI_CONTENT_GUIDE.md L340 now says `<table>` is saved correctly as `table` nodes (so the older "no table support" limitation is fixed for plain tables, and live articles do render a table). Remaining limitation: a plain table does NOT earn the GEO comparison points; only a `comparisonBlock` does, and the HTML publisher has no documented way to emit that block, so queued articles lose 10 GEO points by design.
- Other limits: no per-article author/reviewer override (author = site default user, `AI_CONTENT_GUIDE.md` L342), no way to set Article `about`/`reviewedBy`, no internal-link validation on receive, only draft/published (no update-in-place for `dateModified` semantics beyond upsert), no `noIndex` field documented.
- `AI_CONTENT_GUIDE.md` (466 lines): rules for typography, allowed HTML, field sets (tldr, dog/cat, birds, fish, reptiles, generic), IUCN codes, FAQ (5+ Q, <=50 words), featured image, full payload, SEO (100 pts) and GEO (100 pts) rubrics, first-paragraph template (<=60 words, definition verb, keyword with diacritics), checklist (800+ words, 3 H2, 2 internal + 1 external link, >=3 numeric facts). Note it targets 800+ words; live pages are ~1200 including chrome.

### Images / media
- Runtime uploads 404-until-reload: **fixed**. `next.config.ts` has a `fallback` rewrite `/media/uploads/:path*` -> `/api/media-file/:path*` (`app/api/media-file/[...path]/route.ts`, path traversal guards, content types, HEAD support). Live check: newly published images (`...-1792687920503.webp`) return 200 with `Cache-Control: public, max-age=86400` (static ones `immutable` 1y). Per-site upload dirs: `lib/media/storage.ts`; processing `lib/media/image-processor.ts`.
- Next/Image with avif/webp, `remotePatterns **` (any https host allowed; hardening opportunity).

### Caching / performance
- Every frontend route is `export const dynamic = 'force-dynamic'` (16 files, e.g. `app/(frontend)/page.tsx` L9, `[slug]/[subSlug]/[articleSlug]/page.tsx` L18); `next.config.ts` has no `Cache-Control` for pages (the comment "Long-lived cache for immutable Next.js assets" has no rule beneath it). Result is `no-store` HTML (A3). Admin publish already calls `revalidatePath`, so ISR (`revalidate = 300`, or `unstable_cache` for the nav/home queries) is a feasible switch.
- nginx and Next both set security headers, producing duplicates (X-Frame-Options DENY + SAMEORIGIN; two Referrer-Policy values); see `nginx/` and `docs/deploy-divet.ro.md`.

### Ads / consent
- AdSense via `components/frontend/AdsenseScripts.tsx`, `lib/ads.ts`, `app/ads.txt/route.ts`, CSP in `next.config.ts`; auto ads only; no cookie banner of its own (Google CMP).

### Other bugs / debt spotted
1. Home ItemList URLs 404 (see A2). `app/(frontend)/page.tsx` L100.
2. Article schema image relative (all 37 articles).
3. Home/blog/RSS meta mentions "animale mici, păsări și animale exotice" (stale seed text; source `seo.defaultMetaDesc`).
4. Template heading "Caracteristicile rasei" on non-breed animals.
5. `/blog` is an indexable orphan with no canonical.
6. RSS not auto-discoverable.
7. Tag page titles lack diacritics (derived from slug via `humanizeSlug`, `lib/publisher-paths.ts`), thin tag pages.
8. `typescript.ignoreBuildErrors: true` in `next.config.ts` (hides type errors).
9. Organization schema lacks logo (site `defaultOgImage` is null), publisher in Article lacks logo, which blocks Article rich-result publisher branding.
10. `dateModified` ≈ `datePublished` for all articles, so no freshness signals; `<time>` shows "Actualizat" with empty value on at least one page.
