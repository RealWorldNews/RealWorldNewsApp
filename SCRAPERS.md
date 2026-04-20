# Scrapers

Daily news scrapers for RealWorldNewsApp. Each scraper pulls article URLs from a news source's index page, fetches each article, uses Claude Haiku to extract a structured JSON payload, and POSTs to the app's ingestion endpoint.

## Architecture

```
GitHub Actions cron (11:00 UTC daily)
  └─ npm run scraper:all
       └─ ts-node scrapers/sources/<source>.ts (per source)
            ├─ Playwright fetches listing + article HTML
            ├─ Claude Haiku extracts { headline, summary, body, location, media, source, sourceUrl, date }
            ├─ Collect all payloads in memory
            ├─ DELETE /api/articles?source=<name>   (clears only this source, only after scrape succeeded)
            └─ POST /api/articles per payload (Bearer INGEST_SECRET)
                 └─ prisma.article.upsert  (slug-based dedup)
                    + revalidatePath('/') and revalidatePath('/articles/<slug>')
```

### Refresh strategy

Each scraper **only clears its own source's rows** and only **after it has successfully scraped new articles into memory**. If a scrape fails mid-run, yesterday's articles stay put. Sources are independent — one failing doesn't affect the others.

Scrapers live in `scrapers/` and are **excluded from the Next build** (see `tsconfig.json`). They run only as ts-node scripts from the repo root or in GitHub Actions. Nothing in `scrapers/` ships to Vercel.

Why not Vercel cron? Playwright needs a real Chromium binary. Vercel Lambdas can't install one reliably within size/time limits. GitHub Actions runs Chromium natively and has no runtime cap for our purposes.

### Extraction: minimal synthetic doc + Haiku

**Do not send raw article HTML to Haiku.** A typical news page is 150–250 KB of HTML (40k–60k tokens) dominated by ads, trackers, nav, recommended stories, and video widgets. Sending that straight to Haiku will:

- Blow the 50k-tokens-per-minute rate limit after a single article
- Take 30–90 seconds per request due to retries + output generation on a large prompt
- Burn tokens on content the model has to ignore anyway

**The right pattern** (see `scrapers/sources/aljazeera.ts` for the reference implementation):

1. Fetch the raw page HTML with Playwright (`getPageText`).
2. Use Cheerio to pull **only the fields that matter** — h1, subhead, `og:*` meta, `article:published_time`, visible date, hero image URL, and the article body paragraphs (via a site-specific selector like `.wysiwyg--all-content > p`).
3. Build a **synthetic minimal HTML doc** (~1–5 KB / ~500–1500 tokens) with just those pieces.
4. Pass that minimal doc to Haiku for the final structured JSON extraction.

Why keep Haiku in the loop at all? Because it still earns its keep:

- It tolerates minor markup drift — if the source renames a class, Haiku still pulls the headline from context instead of silently returning empty.
- It infers `location` from body text (e.g. "The incident occurred in Shreveport, Louisiana" → `"location": "Shreveport, Louisiana"`).
- It normalizes date formats, cleans up summary wording, and handles multi-byline cases.

Measured impact on Al Jazeera:

| | Raw HTML → Haiku | Minimal doc → Haiku |
|---|---|---|
| Prompt size | ~50,000 tokens | ~1,500 tokens |
| Time per article | 60–120 s (w/ retries) | 3–8 s |
| Rate-limit hits | Every few articles | None |

**When adding a new source**, first inspect the article HTML (paste a real page into DevTools). Identify the minimum selectors needed for headline + subhead + hero image + date + body paragraphs. Port `buildMinimalDoc()` from the Al Jazeera scraper and swap the selectors. Avoid the temptation to "just send everything and let Haiku figure it out" — it will work for a few articles, then rate-limit you into retry purgatory.

Log `prompt-size` per extraction so you can catch regressions early. If a source's prompt size drifts above ~10 KB, your selectors are too loose.

## Files

```
scrapers/
  tsconfig.json          ts-node config (commonjs, transpile-only)
  lib/
    env.ts               loads .env.local and validates required vars
    browser.ts           Playwright helpers (withBrowser, getPageText, getVisibleText)
    haiku.ts             Claude Haiku call — extractArticle(pageText)
    ingest.ts            POST /api/articles helper — ingestAll(source, items)
    slugify.ts           deterministic slug from a headline
    logger.ts            timestamped console logging
  sources/
    _template.ts         copy-paste starter for a new source

scripts/
  db-clear.ts            delete by slug-prefix or --all

app/api/articles/route.ts   POST ingestion endpoint (Bearer INGEST_SECRET)

.github/workflows/scrape.yml  daily cron + manual trigger
```

## Env vars

All three are required for scrapers to run:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku for extraction |
| `INGEST_URL` | Where to POST — `http://localhost:3000/api/articles` locally, `https://<your-domain>/api/articles` in prod |
| `INGEST_SECRET` | Bearer token the `/api/articles` endpoint checks |

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `SCRAPE_LIMIT` | `15` | Max articles per run. Set to `0` to take every matching article on the listing page. |

Local setup:

```
vercel env pull .env.local
# then add any missing ones to .env.local
```

Make sure `INGEST_SECRET` exists in Vercel env vars before deploying; the ingestion endpoint rejects everything if it's unset.

## Adding a new source

1. Copy `scrapers/sources/_template.ts` to `scrapers/sources/<source>.ts`.
2. Replace `SOURCE`, `INDEX_URL`, and the `getArticleLinks` logic to match the site's listing page.
3. Add npm scripts in `package.json`:

```json
"scraper:<source>": "ts-node --project scrapers/tsconfig.json scrapers/sources/<source>.ts",
```

4. Append the new script to `scraper:all`:

```json
"scraper:all": "npm run scraper:template && npm run scraper:<source>"
```

5. Test locally:

```
npm run dev                   # in one terminal
npm run scraper:<source>       # in another — writes to the DB the dev server points at
```

## Running scrapers

**Locally (dev DB):**

```
npm run scraper:<source>       # one source
npm run scraper:all            # everything
```

The scraper reads `INGEST_URL` from `.env.local`. Point it at `http://localhost:3000/api/articles` while `npm run dev` is running.

**Manually against prod:** flip `INGEST_URL` in `.env.local` to your production URL, then run the same command. Be careful — writes go straight to the prod DB.

**Scheduled (prod):** GitHub Actions runs `npm run scraper:all` every day at 11:00 UTC (07:00 EDT / 06:00 EST). Trigger an immediate run from the Actions tab → "Daily scrape" → "Run workflow".

GitHub secrets required:
- `ANTHROPIC_API_KEY`
- `INGEST_URL` (production URL)
- `INGEST_SECRET`

## Clearing data

```
npm run db:clear -- <source>            # delete articles by source (case-insensitive contains)
npm run db:clear -- --all               # nuke everything
```

Scrapers also auto-clear their own source before inserting (only after a successful scrape — see "Refresh strategy" above). This command is for manual cleanup between runs.

## Ingestion endpoint contract

`POST /api/articles` — Bearer auth with `INGEST_SECRET`.

Body:
```json
{
  "slug": "string (required)",
  "headline": "string (required)",
  "summary": "string",
  "body": "string (required)",
  "location": "string",
  "media": "string (single image URL, typically og:image, or empty)",
  "videoUrl": "string (optional, populated by video-first sources like Democracy Now!)",
  "source": "string (display name, e.g. \"NPR\", \"Al Jazeera\")",
  "sourceUrl": "string (canonical article URL)",
  "date": "ISO 8601 UTC string (required)"
}
```

Responses:
- `201` — created
- `200` — updated (slug already existed)
- `401` — bad/missing bearer token
- `422` — missing required fields or invalid date
- `500` — DB error

Dedup is slug-based via `prisma.article.upsert({ where: { slug } })`. Running a scraper twice is safe — the second run updates the existing row.

## Haiku extraction

`extractArticle(minimalDoc)` calls `claude-haiku-4-5-20251001` in **tool-use mode** — the model is forced to respond by calling an `extract_article` tool with a typed JSON-schema input. We read the structured `tool_use.input` directly, so there is no `JSON.parse()` step that can fail on quote-escaping or stray newlines in headlines. Cost is a fraction of a cent per article.

If an article still fails (network, HTML drift, timeout), the scraper logs it and continues with the next URL — one bad article never kills the run.

### Media extraction (og:image)

Haiku's `media` guess is not always reliable on sites where the hero image is only in `<meta property="og:image">` and not inside the article body (NPR is the canonical case). The pattern:

```ts
const raw = await getPageText(browser, url)
const $doc = cheerio.load(raw)
const ogImg = $doc('meta[property="og:image"]').attr('content') ?? ''
const minimal = buildMinimalDoc(raw)
const data = await extractArticle(minimal)

payloads.push({
  // …
  media: ogImg || data.media,  // prefer the directly-scraped meta tag
})
```

Use the same pattern for video-first sources (see `democracynow.ts` for a regex-based `.mp4` extractor that populates `videoUrl`).

### Source-naming convention

Each scraper declares two constants:

```ts
const SOURCE = 'npr'          // slug / tag — used for DELETE ?source=…, internal grouping
const SOURCE_NAME = 'NPR'     // display label — shown on article cards and source tabs
```

When adding a new source, also add its display name to the `KNOWN_SOURCES` array in `app/page.tsx` so it renders as a tab with count `0` before its first successful scrape.

### Sensitive-source age gate

Sources with graphic content (currently `Borderland Beat`) are listed in the `SENSITIVE_SOURCES` set in `app/articles/[slug]/page.tsx`. Articles from any source in that set are wrapped in the client-side `<AgeGate>` component, which requires a one-time 18+ confirmation (localStorage-backed) before showing the detail page.

## Troubleshooting

- **`Missing required env var`** — you're running the scraper without `.env.local`. Run `vercel env pull .env.local` or copy from another env.
- **`401 Unauthorized` from ingest** — `INGEST_SECRET` mismatch between scraper env and Vercel env.
- **All slugs show `created` but nothing on the site** — `INGEST_URL` probably points at localhost; check `.env.local`.
- **Playwright fails in GHA** — make sure `npx playwright install --with-deps chromium` ran; it's in `.github/workflows/scrape.yml`.
- **Haiku returns invalid JSON repeatedly for one site** — the HTML may be JS-rendered. Use `getVisibleText` instead of `getPageText` in that source, or wait for a selector before extracting.
