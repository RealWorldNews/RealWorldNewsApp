# RealWorldNewsApp — Project Context

Daily news site. Scrapers pull articles from news sources, Claude Haiku extracts structured JSON, data lands in Vercel Postgres, and Next.js App Router renders the pages.

---

## Tech Stack

- **Next.js** — App Router, no `src/` folder
- **TypeScript** — strict (`strict: true` in tsconfig)
- **Styling** — CSS Modules only. No Tailwind. Mobile-first. CSS Grid for 2D layouts, flexbox for 1D inline groupings.
- **Database** — Vercel Postgres via Prisma (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`)
- **Hosting** — Vercel
- **Scrapers** — Playwright + Claude Haiku, excluded from the Next build, run via ts-node locally or GitHub Actions cron (see `SCRAPERS.md`)

---

## Data Flow

```
Playwright scrapers (per source)
  → Claude Haiku extracts structured JSON
  → POST /api/articles (ingestion endpoint, Bearer INGEST_SECRET)
  → Vercel Postgres via Prisma
  → Server Components render pages
```

Ingestion endpoint upserts by `slug`. Running a scraper twice is safe.

---

## Code Conventions

### Next.js 16 community best practices (2026)

**Always do**
- **Server Components** for data reads. Fetch in the page/component directly — don't spin up internal API routes just to pull data.
- **Server Actions** for mutations. Co-locate in `actions/` and call from forms with `<form action={...}>`.
- **`loading.tsx` + `error.tsx`** per route segment. Loading is a Suspense fallback; error is a client boundary.
- **`useRouter` from `next/navigation`** — never `next/router` (that's Pages Router).
- **Slugs in URLs**, not internal CUIDs. URLs should be human-readable and stable.
- **Dynamic routes are async** — `params` and `searchParams` are Promises in Next 15+. `await` them.
- **`revalidatePath`/`revalidateTag`** after mutations that change what's shown elsewhere.
- **ISR (`export const revalidate = N`)** on pages that read from the DB but don't need to be dynamic on every request. Without it, pages that use `await` on a DB call can still be statically prerendered at build time and go stale — add a revalidate window (e.g. 60) so prod self-refreshes.
- **Route Handlers (`route.ts`)** only for things that genuinely belong at a URL — webhooks, ingestion endpoints, cron handlers. Not for reading data your own UI needs.

**Never do**
- Use `src/` folder
- Use `any` (TypeScript is strict here — resolve the type, don't escape it)
- Create an API route just to fetch data for your own Server Components
- Weaken `strict` in `tsconfig.json` to make errors go away
- Write comments that describe what code does — only WHY, and only when non-obvious
- Self-merge PRs

### File naming

- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Loading / error boundaries: `loading.tsx`, `error.tsx`
- Components: `kebab-case.tsx` in `components/`
- Actions: `kebab-case.ts` in `actions/`
- Route handlers: `app/api/<name>/route.ts`

---

## CSS — mobile-first, CSS Modules only

Global vars live in `app/globals.css`. Co-located `*.module.css` files next to each component. No Tailwind.

### Layout model

- **`display: grid`** for any 2D or page-level layout (header, page sections, card grids).
- **`display: flex`** only for 1D inline/small things (nav rows, button groups, icon+label pairs).
- **Never use `float` or fixed `height`** on containers — let content + padding define height.
- **When using `overflow: auto` inside grid**, set `grid-template-columns: minmax(0, 1fr)` on the parent and `min-inline-size: 0` on the scroll container — otherwise nowrap flex content will push the grid track wider than the viewport.

### Mobile-first

- Write base styles for the smallest screen, then layer `@media (min-width: ...)` on top.
- Breakpoints: `768px` (tablet), `1024px` (desktop). No `max-width:` queries.

### Spacing

- Use `gap` on grid/flex containers instead of margins on children.
- All spacing from `--size-*` variables — no raw `px`/`rem` literals.

### Logical properties

- `padding-block`/`padding-inline` over `padding-top/bottom/left/right`
- `margin-block`/`margin-inline` over `margin-top/bottom/left/right`
- `inline-size` / `block-size` over `width` / `height`
- `inset-inline-start` over `left`

### Colors

- All colors via CSS variables from `globals.css` — never hardcoded hex.
- WCAG: when a pill/chip is filled with an accent color (`--link`), use `color: #0a0a0a` + `font-weight: 700` on the text. White on the light-blue accent fails 4.5:1 contrast.

### Images

- `next/image` with `className` that sets `display: block` to kill inline-baseline gap.
- With `fill`, parent needs `position: relative` and `aspect-ratio` or explicit dimensions.

### Filter/tab rails

Chip rows scale poorly with flex-wrap once you have 6+ options. The pattern used in `SourceTabs` and `CategoryFilter`:
- Mobile: horizontal-scroll rail (`overflow-x: auto`, `flex-wrap: nowrap`) with left/right fade gradients from `--background` and `scroll-snap-type: x proximity`.
- Desktop (≥768px): switch to `flex-wrap: wrap; justify-content: center; overflow: visible`.
- Auto-center the active chip with `el.scrollIntoView({ inline: 'center' })` in a `useEffect` keyed on the active value.

---

## Database

Single shared Vercel Postgres across environments (same pattern as the rest of the stack). Be careful running scrapers manually against prod — writes hit live data.

### Schema changes

```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name describe-your-change
# Commit both schema and migrations folder
git add prisma/schema.prisma prisma/migrations/
```

`prisma migrate deploy` runs in the Vercel build automatically. Never run `migrate dev` against prod.

---

## Scrapers — see `SCRAPERS.md`

TL;DR:

- Lives in `scrapers/` (excluded from the Next build via `tsconfig.json`)
- Run locally: `npm run scraper:<source>` or `npm run scraper:all`
- Runs on GitHub Actions cron daily at 11:00 UTC (07:00 EDT / 06:00 EST)
- Env vars: `ANTHROPIC_API_KEY`, `INGEST_URL`, `INGEST_SECRET`, optional `SCRAPE_LIMIT` (default 15, `0` = unlimited)
- Clear: `npm run db:clear -- <source-name>` or `-- --all`
- Haiku uses **tool-use mode** (`extract_article` tool) for strict-typed JSON output — no regex/JSON.parse brittleness
- Per-source refresh: scrape-to-memory, then DELETE only that source, then insert — partial failures never wipe yesterday's data

---

## Key Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema — source of truth |
| `lib/prisma.tsx` | Prisma client singleton |
| `lib/articles.tsx` | Query functions |
| `app/api/articles/route.ts` | Scraper ingestion endpoint |
| `scrapers/` | Scraper scripts (not in Next build) |
| `.github/workflows/scrape.yml` | Daily cron |
| `SCRAPERS.md` | Scraper architecture doc |
