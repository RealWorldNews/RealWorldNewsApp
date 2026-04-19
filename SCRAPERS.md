# Scrapers

Daily news scrapers for RealWorldNewsApp. Each scraper pulls article URLs from a news source's index page, fetches each article, uses Claude Haiku to extract a structured JSON payload, and POSTs to the app's ingestion endpoint.

## Architecture

```
GitHub Actions cron (10:00 UTC daily)
  └─ npm run scrape:all
       └─ ts-node scrapers/sources/<source>.ts (per source)
            ├─ Playwright fetches listing + article HTML
            ├─ Claude Haiku extracts { headline, summary, body, location, media, date }
            └─ POST /api/articles (Bearer INGEST_SECRET)
                 └─ prisma.article.upsert  (slug-based dedup)
```

Scrapers live in `scrapers/` and are **excluded from the Next build** (see `tsconfig.json`). They run only as ts-node scripts from the repo root or in GitHub Actions. Nothing in `scrapers/` ships to Vercel.

Why not Vercel cron? Playwright needs a real Chromium binary. Vercel Lambdas can't install one reliably within size/time limits. GitHub Actions runs Chromium natively and has no runtime cap for our purposes.

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
| `SCRAPE_LIMIT` | `10` | Max articles per run |

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
"scrape:<source>": "ts-node --project scrapers/tsconfig.json scrapers/sources/<source>.ts",
```

4. Append the new script to `scrape:all`:

```json
"scrape:all": "npm run scrape:template && npm run scrape:<source>"
```

5. Test locally:

```
npm run dev                   # in one terminal
npm run scrape:<source>       # in another — writes to the DB the dev server points at
```

## Running scrapers

**Locally (dev DB):**

```
npm run scrape:<source>       # one source
npm run scrape:all            # everything
```

The scraper reads `INGEST_URL` from `.env.local`. Point it at `http://localhost:3000/api/articles` while `npm run dev` is running.

**Manually against prod:** flip `INGEST_URL` in `.env.local` to your production URL, then run the same command. Be careful — writes go straight to the prod DB.

**Scheduled (prod):** GitHub Actions runs `npm run scrape:all` every day at 10:00 UTC (06:00 EDT / 05:00 EST). Trigger an immediate run from the Actions tab → "Daily scrape" → "Run workflow".

GitHub secrets required:
- `ANTHROPIC_API_KEY`
- `INGEST_URL` (production URL)
- `INGEST_SECRET`

## Clearing data

```
npm run db:clear -- <slug-prefix>       # delete articles whose slug starts with prefix
npm run db:clear -- --all               # nuke everything
```

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
  "media": "string (comma-separated image URLs, or empty)",
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

`extractArticle(pageText)` sends the page HTML/text to `claude-haiku-4-5-20251001` with a system prompt that locks the output to strict JSON. Cost is roughly a fraction of a cent per article.

If Haiku returns malformed JSON, the scraper logs the failure and continues with the next URL — one bad article never kills the run.

## Troubleshooting

- **`Missing required env var`** — you're running the scraper without `.env.local`. Run `vercel env pull .env.local` or copy from another env.
- **`401 Unauthorized` from ingest** — `INGEST_SECRET` mismatch between scraper env and Vercel env.
- **All slugs show `created` but nothing on the site** — `INGEST_URL` probably points at localhost; check `.env.local`.
- **Playwright fails in GHA** — make sure `npx playwright install --with-deps chromium` ran; it's in `.github/workflows/scrape.yml`.
- **Haiku returns invalid JSON repeatedly for one site** — the HTML may be JS-rendered. Use `getVisibleText` instead of `getPageText` in that source, or wait for a selector before extracting.
