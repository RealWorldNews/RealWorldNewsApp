# Handoff — RealWorldNewsApp

Everything the next session needs to pick up cold. Delete entries as they land.

---

## 0. Start here

1. Read `CLAUDE.md` (project conventions, CSS Modules / no Tailwind, strict TS).
2. Read `SCRAPERS.md` (architecture, minimal-doc pattern, Haiku tool-use, env vars).
3. Skim the rest of this file.
4. `git status` — there is a **large uncommitted diff** on branch `RWN/first-scraper`. Do not start new work until the user decides how to split it into commits (see §3).
5. Sanity checks: `npm run dev`, open `localhost:3000`, verify homepage renders with source tabs. `SCRAPE_LIMIT=2 npm run scraper:npr` should log `hasImage: true` on both articles.

---

## 1. Project in 60 seconds

- Next.js 16 App Router, React 19, Prisma 5 on Vercel Postgres (Neon), CSS Modules (not Tailwind — CLAUDE.md was fixed this session).
- Home page fetches articles server-side, round-robin interleaves by source, supports `?q=`, `?source=`, `?page=` URL params.
- Scrapers: Playwright + Claude Haiku (tool-use mode), scheduled via GitHub Actions at 11:00 UTC daily. They live in `scrapers/`, are excluded from the Next build, and run as ts-node scripts.
- Single shared Vercel Postgres for all environments — writes from a scraper run go live immediately.

### Current sources (5)

| `SOURCE` | `SOURCE_NAME` (display) | Script |
|---|---|---|
| `aljazeera` | Al Jazeera | `npm run scraper:aljazeera` |
| `bbc` | BBC News | `npm run scraper:bbc` |
| `democracynow` | Democracy Now! | `npm run scraper:democracynow` |
| `borderlandbeat` | Borderland Beat | `npm run scraper:borderlandbeat` |
| `npr` | NPR | `npm run scraper:npr` |

`SOURCE_NAME` is also hardcoded into `KNOWN_SOURCES` in `app/page.tsx` so tabs show even at count 0. When you add a new scraper, update both.

### Sensitive content

`SENSITIVE_SOURCES = new Set(["Borderland Beat"])` in `app/articles/[slug]/page.tsx` wraps article detail pages in an 18+ age gate (localStorage key `rwn:age-gate:18plus`). Add new sources to that set if they contain graphic content.

---

## 2. What shipped this session

- NPR scraper `media` fix — og:image extracted directly via Cheerio in the outer loop; `media: ogImg || data.media` prefers the meta tag over Haiku's guess. **Verified locally**, needs prod re-run at 11:00 UTC (or manual trigger).
- Homepage **source tabs** — `components/articles/source-tabs.tsx` + `.module.css`. Horizontal-scroll chip rail with edge fades on mobile, wrap+center on desktop. Dark text + bold weight on active pill (was white-on-blue, failing WCAG at ~2.3:1; now ~11:1). `scrollIntoView` auto-centers the active chip.
- `lib/articles.tsx::getArticles` — now returns `{ articles, totalArticles, sourceCounts, totalAcrossAllSources }` and accepts an optional `source` filter. When a source is selected, date-desc ordering (no interleave).
- `app/page.tsx` — wires `?source=` into the query, renders tabs from `KNOWN_SOURCES` merged with DB counts (missing sources render with count 0).
- Same chip-rail pattern applied to `components/resources/category-filter.tsx` + `.module.css`.
- **Page-grid fix** — `app/page.module.css` and `app/resources/page.module.css` got `grid-template-columns: minmax(0, 1fr)`, and `.rail` + `.row` got `min-inline-size: 0`. Without these, the nowrap flex content inside the scroll rail was expanding the grid track to its min-content width and blowing out the viewport (you can see the bug reproduced in screenshot commit history).
- Mobile logo fix — in `components/main-header/main-header.tsx` the globe is now a sibling span with `em`-based left margin; mobile font dropped from 1.25rem → 1.1rem; `white-space: nowrap` on the `p` keeps it together.
- Docs:
  - `CLAUDE.md` — corrected Tailwind → CSS Modules, added chip-rail + grid+overflow guidance, fixed script name (`scraper:*` not `scrape:*`) and cron time (11:00 UTC).
  - `SCRAPERS.md` — POST contract now includes `source`, `sourceUrl`, `videoUrl`; Haiku section rewritten for tool-use mode; added og:image pattern, `SOURCE` vs `SOURCE_NAME` convention, sensitive-source age-gate note.

---

## 3. Uncommitted state on `RWN/first-scraper`

Large branch — 40+ files. **Ask the user before committing.** Suggested split if they want chunked PRs:

1. **Scraper infrastructure** (`scrapers/lib/*`, `scrapers/sources/_template.ts`, `scripts/db-clear.ts`, `scrapers/tsconfig.json`, `app/api/articles/route.ts`, `prisma/schema.prisma` + both migrations, `.github/workflows/scrape.yml`, `package.json` script additions)
2. **The five source scrapers** (`scrapers/sources/{aljazeera,bbc,democracynow,borderlandbeat,npr}.ts`)
3. **Frontend: article list, video, age gate** (`components/articles/article-*`, `components/articles/age-gate.*`, `components/video/*`, `app/articles/[slug]/*`, `app/page.tsx`, `app/page.module.css`, `types/article.ts`, `lib/articles.tsx`, `components/search/*`, `components/main-header/*`, `app/globals.css`, `next.config.mjs`)
4. **Resources page + category filter** (`app/resources/*`, `components/resources/*`)
5. **Source tabs + docs** (`components/articles/source-tabs.*`, updates to `lib/articles.tsx`, `app/page.tsx`, `app/page.module.css`, `CLAUDE.md`, `SCRAPERS.md`, `HANDOFF.md`, category-filter updates)

Deleted files (don't try to find them): `components/articles/scroll-restoration-wrapper.tsx`, `components/hooks/useScrollRestoration.tsx` — scroll restoration now handled by the browser + Next's default behavior.

---

## 4. Scrapers to add next

Mission-aligned candidates (independent / adversarial / counter-narrative press). Ordered by priority.

| # | Source | Listing URL | Notes |
|---|---|---|---|
| 1 | **The Intercept** | https://theintercept.com/latest/ | Investigative journalism. Clean `<article>` cards, reliable og:image. |
| 2 | **Mondoweiss** | https://mondoweiss.net/latest-articles/ | Palestine/Israel coverage. WordPress. |
| 3 | **The Electronic Intifada** | https://electronicintifada.net/news | Palestinian-led. Drupal-style URLs. |
| 4 | **+972 Magazine** | https://www.972mag.com/ | Dissident Israeli-Palestinian. WordPress. |
| 5 | **Middle East Eye** | https://www.middleeasteye.net/news | JS-heavy — may need `getVisibleText` or a `waitForSelector`. |
| 6 | **Drop Site News** | https://www.dropsitenews.com/ | Intercept-alumni investigative. Substack-style — skip paywalled posts. |
| 7 | **Truthout** | https://truthout.org/latest/ | Progressive independent. |
| 8 | **Common Dreams** | https://www.commondreams.org/news | Progressive news aggregator. |
| 9 | **Jacobin** | https://jacobin.com/latest | Long-form — ensure `buildMinimalDoc` grabs the full body. |
| 10 | **ProPublica** | https://www.propublica.org/articles | Investigative. Confirm CC-BY-ND terms before shipping; they require a tracking pixel for republish. |

### Process per source

1. Inspect a real article in DevTools. Note selectors for h1, subhead, `og:image`, `datetime`, author, body paragraphs.
2. Copy `scrapers/sources/_template.ts` → `scrapers/sources/<slug>.ts`.
3. Set `SOURCE` (slug), `SOURCE_NAME` (display), `BASE_URL`, `INDEX_URL`, a `STORY_PATH` regex, and the listing selector in `getArticleLinks`.
4. Port `buildMinimalDoc` from the source scraper closest in structure (aljazeera for news orgs, democracynow for video, borderlandbeat for blogs, npr for US-legacy formats).
5. Extract `og:image` in the outer loop (NPR pattern) — don't trust Haiku to pick it from meta alone.
6. Add the npm script to `package.json` and append it to `scraper:all`.
7. Add `SOURCE_NAME` to `KNOWN_SOURCES` in `app/page.tsx`.
8. Test: `SCRAPE_LIMIT=2 npm run scraper:<slug>` — watch for `hasImage: true`, `prompt-size` under 10 KB, both rows successfully extracted.
9. Full run, verify on `localhost:3000`.

### Scale caveats

- **Haiku rate limit** (50k TPM): 5 sources × 15 articles × ~1.5k tokens is fine. At ~10 sources you may start hitting it — if so, reduce `SCRAPE_LIMIT`, split `scraper:all` into two cron jobs 30 min apart, or upgrade the Anthropic plan.
- **GHA runtime**: ~60–90s per source. 10 sources ≈ 15 min, well under any cap.

---

## 5. Env + infra reference

### Required env vars (scrapers)

| Var | Where set | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` + Vercel + GitHub Actions secret | Haiku extraction |
| `INGEST_URL` | `.env.local` + GHA secret | `http://localhost:3000/api/articles` locally, `https://www.realworldnews.org/api/articles` in prod |
| `INGEST_SECRET` | `.env.local` + Vercel + GHA secret | Bearer token checked by `/api/articles` |
| `SCRAPE_LIMIT` | optional, default 15 | Set `0` for every article |

### Required env vars (app)

| Var | Where set | Purpose |
|---|---|---|
| `POSTGRES_PRISMA_URL` | Vercel + `.env.local` | Pooled Prisma connection |
| `POSTGRES_URL_NON_POOLING` | Vercel + `.env.local` | Migrations |
| `ANTHROPIC_API_KEY` | Vercel | Same key reused server-side if needed |
| `INGEST_SECRET` | Vercel | Matches scraper-side secret |

`vercel env pull .env.local` syncs Vercel vars locally. Earlier in the session we deleted a stale `POSTGRES_PRISMA_URL_DEV` pointing at localhost — **don't recreate it**.

### GitHub Actions

`.github/workflows/scrape.yml` runs `npm run scraper:all` daily at 11:00 UTC. Manual trigger: Actions tab → "Daily scrape" → "Run workflow". Why not Vercel cron? Playwright needs a real Chromium; Lambdas can't install one within size/time limits.

---

## 6. Known gotchas

- **Prisma client caches the schema in the dev server.** After `prisma migrate dev` + `prisma generate`, you MUST kill `npm run dev` and restart. We hit this twice this session (once adding `source`/`sourceUrl`, once adding `videoUrl`). Symptom: 500s on POST with `Unknown field ...` errors.
- **Horizontal-scroll inside grid** expands the grid track to its min-content width and breaks page layout on mobile. Fix: parent needs `grid-template-columns: minmax(0, 1fr)`; scroll container needs `min-inline-size: 0`. Documented in CLAUDE.md.
- **`.env.local` is gitignored**, good. But `.env` is also there and has real values — verify it is not tracked (`git check-ignore .env`).
- **Scraper "cleared 0 then 500s on insert"** is the Prisma dev-server cache symptom above, not a real clear failure.
- **Haiku tool-use** is the reason JSON extraction is now stable. Do not "simplify" `scrapers/lib/haiku.ts` back to plain JSON parsing — quote-heavy headlines (Democracy Now! is the worst offender) break it immediately.

---

## 7. Loose ends

- **Resources contact email** — still `contact@distortnewyork.com`. User wants something DistortNewYork-branded but not their personal address; revisit during resources polish.
- **NPR prod data** — still has the broken-image rows from before the fix. First post-fix scrape clears and replaces them.
- **Nothing committed this session.** See §3 for suggested commit split. Get explicit approval before committing.

---

## 8. Quick commands

```bash
# dev server
npm run dev

# scrape one source locally (dev server must be running)
SCRAPE_LIMIT=2 npm run scraper:npr

# scrape everything locally
npm run scraper:all

# clear a source manually (case-insensitive contains match on SOURCE_NAME)
npm run db:clear -- NPR

# nuke the whole articles table
npm run db:clear -- --all

# db schema changes
npx prisma migrate dev --name describe-your-change
# then KILL + restart npm run dev (Prisma client caches schema)

# sync env from Vercel
vercel env pull .env.local
```

---

## 9. Key files (read these before editing)

| File | Why |
|---|---|
| `CLAUDE.md` | Project conventions |
| `SCRAPERS.md` | Scraper architecture + gotchas |
| `prisma/schema.prisma` | DB source of truth |
| `lib/articles.tsx` | All article queries + types |
| `app/page.tsx` | Homepage composition + `KNOWN_SOURCES` list |
| `app/api/articles/route.ts` | Ingestion POST endpoint + DELETE |
| `scrapers/lib/haiku.ts` | Tool-use extraction — reference implementation |
| `scrapers/sources/aljazeera.ts` | Reference scraper for standard news orgs |
| `scrapers/sources/democracynow.ts` | Reference for video-first sources |
| `scrapers/sources/npr.ts` | Reference for the og:image-in-outer-loop pattern |
| `components/articles/source-tabs.tsx` + `.module.css` | Chip-rail pattern |
| `components/articles/age-gate.tsx` | Sensitive-source gate |
