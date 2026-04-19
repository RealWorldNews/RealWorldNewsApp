import Anthropic from '@anthropic-ai/sdk'
import { env } from './env'

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const MODEL = 'claude-haiku-4-5-20251001'

export type ExtractedArticle = {
  headline: string
  summary: string
  body: string
  location: string
  media: string
  date: string
}

const SYSTEM_PROMPT = `You extract structured news article data from raw HTML or cleaned page text.

Return a single JSON object that matches this TypeScript type exactly, and nothing else:
{
  "headline": string,       // the article's main headline, plain text
  "summary": string,        // 1-2 sentence standfirst / deck; empty string if none
  "body": string,           // the full article body as readable plain text (paragraphs separated by blank lines). Strip nav, ads, related-links, comments.
  "location": string,       // city/region the story is about; empty string if unclear
  "media": string,          // comma-separated image URLs for the article (hero first). Empty string if none.
  "date": string            // ISO 8601 UTC, e.g. "2026-04-19T00:00:00.000Z". Use the publication date from the page; fall back to today if missing.
}

Rules:
- Output ONLY the JSON. No prose, no markdown fencing.
- Do not fabricate fields. Use "" for unknown strings.
- Keep body faithful to the original wording; do not summarize.
- Media URLs must be absolute https URLs.`

export async function extractArticle(pageText: string): Promise<ExtractedArticle> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: pageText.slice(0, 200_000) }],
  })

  const first = res.content[0]
  if (!first || first.type !== 'text') {
    throw new Error('Haiku returned no text content')
  }
  const raw = first.text.trim()
  const json = raw.startsWith('```') ? raw.replace(/^```(?:json)?|```$/g, '').trim() : raw

  let parsed: ExtractedArticle
  try {
    parsed = JSON.parse(json)
  } catch (err) {
    throw new Error(`Haiku returned invalid JSON: ${raw.slice(0, 200)}`)
  }

  return {
    headline: parsed.headline ?? '',
    summary: parsed.summary ?? '',
    body: parsed.body ?? '',
    location: parsed.location ?? '',
    media: parsed.media ?? '',
    date: parsed.date ?? new Date().toISOString(),
  }
}
