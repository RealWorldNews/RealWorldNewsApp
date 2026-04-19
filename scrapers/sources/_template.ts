import { env } from '../lib/env'
import { withBrowser, getPageText } from '../lib/browser'
import { extractArticle } from '../lib/haiku'
import { ingestAll, type ArticlePayload } from '../lib/ingest'
import { slugify } from '../lib/slugify'
import { error, log } from '../lib/logger'

const SOURCE = 'template'
const INDEX_URL = 'https://example.com/news'

async function getArticleLinks(browser: Parameters<typeof getPageText>[0]): Promise<string[]> {
  const html = await getPageText(browser, INDEX_URL)
  const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1])
  const seen = new Set<string>()
  const urls: string[] = []
  for (const url of matches) {
    if (seen.has(url)) continue
    if (!/\/\d{4}\/\d{2}\//.test(url)) continue
    seen.add(url)
    urls.push(url)
    if (urls.length >= env.SCRAPE_LIMIT) break
  }
  return urls
}

async function run() {
  log(SOURCE, 'start', { index: INDEX_URL, limit: env.SCRAPE_LIMIT })

  const payloads: ArticlePayload[] = await withBrowser(async (browser) => {
    const urls = await getArticleLinks(browser)
    log(SOURCE, 'found-links', { count: urls.length })

    const out: ArticlePayload[] = []
    for (const url of urls) {
      try {
        const html = await getPageText(browser, url)
        const data = await extractArticle(html)
        if (!data.headline) {
          log(SOURCE, 'skipped-no-headline', { url })
          continue
        }
        out.push({
          slug: slugify(data.headline),
          headline: data.headline,
          summary: data.summary,
          body: data.body,
          location: data.location,
          media: data.media,
          date: data.date,
        })
      } catch (err) {
        error(SOURCE, 'extract-failed', { url, message: (err as Error).message })
      }
    }
    return out
  })

  const result = await ingestAll(SOURCE, payloads)
  log(SOURCE, 'done', result)
}

run().catch((err) => {
  error(SOURCE, 'fatal', { message: (err as Error).message })
  process.exit(1)
})
