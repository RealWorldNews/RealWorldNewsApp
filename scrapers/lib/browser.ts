import * as cheerio from 'cheerio'
import { chromium, type Browser, type Page } from 'playwright'

export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({ headless: true })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

export async function getPageText(browser: Browser, url: string): Promise<string> {
  const page: Page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    return await page.content()
  } finally {
    await page.close()
  }
}

export async function getVisibleText(browser: Browser, url: string): Promise<string> {
  const page: Page = await browser.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    return await page.evaluate(() => document.body.innerText)
  } finally {
    await page.close()
  }
}

const NOISE_SELECTORS = [
  'script', 'style', 'noscript', 'svg', 'iframe',
  'footer', 'nav', 'aside',
  '.ads', '.ad', '.advertisement', '.ad-container',
  '.recommended', '.more-on', '.related',
  '.sib-newsletter-form', '.newsletter',
  '.widget', '.nudge', '.container--ads',
  '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
  '.rich-share', '.google-preferred-source', '.article-ad-left', '.sticky-ads',
  '.article-pre-footer', '.article-more-from-topic', '.article-related-list',
  '#disco-widget', '.connatix-container', '.cnx-main-container',
  '[id^="connatix"]', '[class*="cnx-"]',
].join(',')

const ARTICLE_SELECTORS = [
  '.wysiwyg--all-content',
  '.wysiwyg',
  '.article__body',
  '.article-body',
  'article',
  'main article',
  'main',
  '[role="main"]',
].join(',')

export function stripToArticle(html: string): string {
  const $ = cheerio.load(html)

  $(NOISE_SELECTORS).remove()

  const metas = $('head > title, head > meta[property^="og:"], head > meta[name^="article:"], head > meta[name="description"], head > meta[name="keywords"]')
    .toArray()
    .map(el => $.html(el))
    .join('\n')

  const article = $(ARTICLE_SELECTORS).first()
  const body = article.length ? article.html() : $('body').html()

  return `<!doctype html><html><head>${metas}</head><body>${body ?? ''}</body></html>`
}

export async function getArticleHtml(browser: Browser, url: string): Promise<string> {
  const raw = await getPageText(browser, url)
  return stripToArticle(raw)
}
