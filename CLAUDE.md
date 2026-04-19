# RealWorldNewsApp — Project Context

Daily news site. Scrapers pull articles from news sources, Claude Haiku extracts structured JSON, data lands in Vercel Postgres, and Next.js App Router renders the pages.

---

## Tech Stack

- **Next.js** — App Router, no `src/` folder
- **TypeScript** — strict (`strict: true` in tsconfig)
- **Styling** — Tailwind CSS
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

## CSS — mobile-first, CSS Grid (via Tailwind)

Tailwind here, but the same 2025/2026 CSS principles apply. Use Tailwind utilities to express them.

### Layout model

- **`grid` for any 2D or page-level layout** — card lists, headers, page sections. In Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- **`flex` only for 1D inline/small things** — nav link rows, button groups, icon+label pairs.
- **Never use fixed `height` on containers** — let content + padding define height. `h-screen` / `min-h-screen` is fine for full-viewport shells only.
- **Never use `float`**.

### Mobile-first

- **Base styles target the smallest screen**, then layer Tailwind breakpoint variants on top: `sm:`, `md:`, `lg:`.
- **Breakpoints**: `md` (768px) for tablet, `lg` (1024px) for desktop. Add others only when the design needs them.
- **Never write `max-*:` variants** (or `@media (max-width: ...)` in raw CSS). Always go min-width / mobile-first.

```tsx
// Good — mobile-first, progressive enhancement
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// Bad — desktop-first, fighting yourself at smaller sizes
<div className="grid grid-cols-3 max-md:grid-cols-1">
```

### Spacing

- **Use `gap` on grid/flex containers**, not margins on children. `gap-4`, `gap-x-6`, etc.
- **Stick to the Tailwind spacing scale** (`p-4`, `mt-6`, …). Don't sprinkle arbitrary values (`p-[13px]`) unless the design actually needs them.

### Logical properties

Tailwind supports logical-property utilities — prefer them for anything that could be RTL-sensitive or flow-directional:

- `ps-*` / `pe-*` over `pl-*` / `pr-*` (padding-inline-start/end)
- `ms-*` / `me-*` over `ml-*` / `mr-*`
- `start-*` / `end-*` over `left-*` / `right-*`
- `py-*` / `px-*` still fine for explicit block/inline axes

### Images

- Use `next/image` with `className="block"` to kill the inline-baseline gap.
- Give `width` and `height` or use `fill` with a sized parent.

### Don't

- Hardcode hex colors inline when a Tailwind token covers it (e.g. `text-white`, `bg-zinc-900`). Reach for arbitrary values only when the design genuinely requires a one-off shade.
- Use fixed `px` widths on page containers. Prefer `max-w-*`, `w-full`, `fr` in grid templates.

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
- Run locally: `npm run scrape:<source>` or `npm run scrape:all`
- Runs on GitHub Actions cron daily at 10:00 UTC (06:00 EDT / 05:00 EST)
- Env vars: `ANTHROPIC_API_KEY`, `INGEST_URL`, `INGEST_SECRET`, optional `SCRAPE_LIMIT`
- Clear: `npm run db:clear -- <slug-prefix>` or `-- --all`

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
