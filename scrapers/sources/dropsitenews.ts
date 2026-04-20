import * as cheerio from 'cheerio'
import { chromium, type Browser } from 'playwright'
import { env } from '../lib/env'
import { getPageText } from '../lib/browser'
import { extractArticle } from '../lib/haiku'
import { clearSource, ingestAll, type ArticlePayload } from '../lib/ingest'
import { slugify } from '../lib/slugify'
import { error, log } from '../lib/logger'

const SOURCE = 'dropsitenews'
const SOURCE_NAME = 'Drop Site News'
const BASE_URL = 'https://www.dropsitenews.com'
const INDEX_URL = BASE_URL
const STORY_PATH = /^https:\/\/www\.dropsitenews\.com\/p\/[a-z0-9-]+\/?$/

const VIDEO_PATTERNS = [
  /https:\/\/[^\s"'<>]+\.mp4(?:\?[^\s"'<>]*)?/i,
  /https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+/,
  /https:\/\/player\.vimeo\.com\/video\/\d+/,
  /https:\/\/video\.substack\.com\/[^\s"'<>]+/,
]

async function dismissPopup(page: Awaited<ReturnType<Browser['newPage']>>) {
  const selectors = [
    'button[aria-label="Close"]',
    'button[aria-label*="close" i]',
    '.modal-close',
    '.close-button',
    '[class*="close-modal"]',
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
    await page.waitForSelector('a[data-testid="post-preview-title"]', { timeout: 15_000 }).catch(() => {
      // fall back to whatever matched
    })
    await dismissPopup(page)

    const hrefs = await page.$$eval(
      'a[data-testid="post-preview-title"]',
      els => els.map(el => (el as HTMLAnchorElement).getAttribute('href') ?? ''),
    )

    const seen = new Set<string>()
    const allMatches: string[] = []
    for (const href of hrefs) {
      if (!href) continue
      const clean = href.split('?')[0].split('#')[0]
      const full = clean.startsWith('http') ? clean : `${BASE_URL}${clean}`
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

function extractVideoUrl(rawHtml: string): string {
  for (const pattern of VIDEO_PATTERNS) {
    const match = rawHtml.match(pattern)
    if (match) return match[0]
  }
  return ''
}

function isPaywalled(html: string): boolean {
  return /data-component-name=["']Paywall["']/.test(html) ||
    /This post is for paid subscribers/i.test(html) ||
    /Keep reading with a 7-day free trial/i.test(html)
}

function toISO(input: string): string {
  if (!input) return new Date().toISOString()
  const parsed = new Date(input)
  if (isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function extractPublishedTime($doc: cheerio.CheerioAPI): string {
  const metaTime = $doc('meta[property="article:published_time"]').attr('content')
  if (metaTime) return metaTime
  const timeAttr = $doc('time[datetime]').first().attr('datetime')
  if (timeAttr) return timeAttr
  // Substack byline: plain text like "Apr 17, 2026". Search for any element whose
  // text parses as a date.
  let found = ''
  $doc('.post-header div, .byline-wrapper div, [class*="meta"]').each((_, el) => {
    if (found) return
    const text = $doc(el).text().trim()
    if (!text || text.length > 30) return
    const parsed = new Date(text)
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      found = parsed.toISOString()
    }
  })
  return found
}

function buildMinimalDoc(html: string, videoUrl: string): string {
  const $ = cheerio.load(html)

  $('aside, .subscribe-widget, .post-ufi, .post-contributor-footer, .post-footer, .subscribe-widget-wrap, .button-wrapper, script, style, noscript, iframe').remove()

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

  const h1 = $('h1.post-title').first().text().trim() || $('h1').first().text().trim()
  const subtitle = $('h3.subtitle').first().text().trim()
  const ogImg = $('meta[property="og:image"]').attr('content') ?? ''
  const heroImg = ogImg || $('.available-content figure img').first().attr('src') || ''
  const dateAttr = $('meta[property="article:published_time"]').attr('content') ?? ''

  const bodyParas: string[] = []
  const container = $('.available-content .body.markup').first()
  container.find('> p').each((_, el) => {
    const text = $(el).text().trim()
    if (text) bodyParas.push(`<p>${text}</p>`)
  })

  return `<!doctype html><html><head>${metas}</head><body>
<h1>${h1}</h1>
${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
${heroImg ? `<img src="${heroImg}">` : ''}
${videoUrl ? `<video src="${videoUrl}"></video>` : ''}
${dateAttr ? `<time datetime="${dateAttr}"></time>` : ''}
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
        if (isPaywalled(raw)) {
          log(SOURCE, 'skipped-paywalled', { url })
          continue
        }
        const $doc = cheerio.load(raw)
        const ogImg = $doc('meta[property="og:image"]').attr('content') ?? ''
        const publishedTime = extractPublishedTime($doc)
        const videoUrl = extractVideoUrl(raw)
        const minimal = buildMinimalDoc(raw, videoUrl)
        log(SOURCE, 'prompt-size', { index: i + 1, chars: minimal.length, hasImage: Boolean(ogImg), hasVideo: Boolean(videoUrl) })
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
          videoUrl,
          source: SOURCE_NAME,
          sourceUrl: url,
          date: toISO(publishedTime || data.date),
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
