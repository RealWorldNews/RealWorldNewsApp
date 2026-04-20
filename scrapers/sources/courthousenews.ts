import * as cheerio from 'cheerio'
import { chromium, type Browser } from 'playwright'
import { env } from '../lib/env'
import { getPageText } from '../lib/browser'
import { extractArticle } from '../lib/haiku'
import { clearSource, ingestAll, type ArticlePayload } from '../lib/ingest'
import { slugify } from '../lib/slugify'
import { error, log } from '../lib/logger'

const SOURCE = 'courthousenews'
const SOURCE_NAME = 'Courthouse News'
const BASE_URL = 'https://www.courthousenews.com'
const INDEX_URL = 'https://courthousenews.com/'
const STORY_PATH = /^https:\/\/(?:www\.)?courthousenews\.com\/(?!(?:category|author|tag|page|wp-content|wp-admin|wp-includes|feed)\/)[a-z0-9][a-z0-9-]*\/?$/

async function dismissPopup(page: Awaited<ReturnType<Browser['newPage']>>) {
  const selectors = [
    'button[aria-label="Close"]',
    'button[aria-label*="close" i]',
    '.popup-close',
    '.modal-close',
    '.close-button',
    'button.close',
    '[class*="newsletter"] button[class*="close"]',
  ]
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout: 1_500 })
      return
    } catch {
      // try next
    }
  }
}

async function getArticleLinks(browser: Browser): Promise<string[]> {
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  try {
    await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await dismissPopup(page)

    const hrefs = await page.$$eval(
      '.arpr_article_preview h2 a, .arpr_article_preview .image a',
      els => els.map(el => (el as HTMLAnchorElement).getAttribute('href') ?? ''),
    )

    const seen = new Set<string>()
    const allMatches: string[] = []
    for (const href of hrefs) {
      if (!href) continue
      const full = href.startsWith('http') ? href : `${BASE_URL}${href}`
      if (!STORY_PATH.test(full)) continue
      if (seen.has(full)) continue
      seen.add(full)
      allMatches.push(full)
    }
    log(SOURCE, 'candidates', { totalOnPage: hrefs.length, matchingStoryUrls: allMatches.length })
    return env.SCRAPE_LIMIT > 0 ? allMatches.slice(0, env.SCRAPE_LIMIT) : allMatches
  } finally {
    await page.close()
  }
}

function buildMinimalDoc(html: string): string {
  const $ = cheerio.load(html)

  $('aside, .related-articles, #email-subscribers, .article-categories, .share, .footer_widgets, .article-author-follow, script, style, noscript, iframe').remove()

  const metas = [
    $('meta[property="og:title"]'),
    $('meta[property="og:description"]'),
    $('meta[property="og:image"]'),
    $('meta[property="article:published_time"]'),
    $('meta[property="article:modified_time"]'),
    $('meta[name="description"]'),
  ]
    .map(el => (el.length ? $.html(el) : ''))
    .filter(Boolean)
    .join('\n')

  const h1 = $('.article-header h1').first().text().trim() || $('h1').first().text().trim()
  const excerpt = $('.article-header .excerpt').first().text().trim()
  const ogImg = $('meta[property="og:image"]').attr('content') ?? ''
  const heroImg = ogImg || $('figure.featured-image img').first().attr('src') || ''
  const dateText = $('.author-date span').first().text().trim().replace(/^\/\s*/, '')

  const bodyParas: string[] = []
  const container = $('.article-content').first()
  container.find('> p').each((_, el) => {
    const text = $(el).text().trim()
    if (text) bodyParas.push(`<p>${text}</p>`)
  })

  return `<!doctype html><html><head>${metas}</head><body>
<h1>${h1}</h1>
${excerpt ? `<p class="dek">${excerpt}</p>` : ''}
${heroImg ? `<img src="${heroImg}">` : ''}
${dateText ? `<time>${dateText}</time>` : ''}
${bodyParas.join('\n')}
</body></html>`
}

async function run() {
  log(SOURCE, 'start', { index: INDEX_URL, limit: env.SCRAPE_LIMIT })

  const browser = await chromium.launch({ headless: true })
  const payloads: ArticlePayload[] = []
  try {
    const urls = await getArticleLinks(browser)
    log(SOURCE, 'found-links', { count: urls.length })

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const t0 = Date.now()
      log(SOURCE, 'extract-start', { index: i + 1, of: urls.length, url })
      try {
        const raw = await getPageText(browser, url)
        const $doc = cheerio.load(raw)
        const ogImg = $doc('meta[property="og:image"]').attr('content') ?? ''
        const authorNames: string[] = []
        $doc('p.author a, .entry-byline a[href*="/author/"]').each((_, el) => {
          const name = $doc(el).text().trim()
          if (name && !authorNames.includes(name)) authorNames.push(name)
        })
        const author = authorNames.join(', ')
        const minimal = buildMinimalDoc(raw)
        log(SOURCE, 'prompt-size', { index: i + 1, chars: minimal.length, hasImage: Boolean(ogImg) })
        const data = await extractArticle(minimal)
        if (!data.headline) {
          log(SOURCE, 'skipped-no-headline', { url })
          continue
        }
        payloads.push({
          slug: slugify(data.headline),
          headline: data.headline,
          summary: data.summary,
          body: data.body,
          location: data.location,
          media: ogImg || data.media,
          author,
          source: SOURCE_NAME,
          sourceUrl: url,
          date: data.date,
        })
        log(SOURCE, 'extract-done', { index: i + 1, ms: Date.now() - t0 })
      } catch (err) {
        error(SOURCE, 'extract-failed', { url, message: (err as Error).message })
      }
    }
  } finally {
    await browser.close()
  }

  if (payloads.length === 0) {
    log(SOURCE, 'done-empty', { reason: 'no payloads — keeping existing rows' })
    return
  }

  const clearCount = await clearSource(SOURCE, SOURCE_NAME)
  log(SOURCE, 'cleared', { count: clearCount })

  const result = await ingestAll(SOURCE, payloads)
  log(SOURCE, 'done', result)
}

run().catch(err => {
  error(SOURCE, 'fatal', { message: (err as Error).message })
  process.exit(1)
})
