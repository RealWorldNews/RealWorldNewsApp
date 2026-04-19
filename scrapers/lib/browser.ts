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
