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

Rules:
- Do not fabricate fields. Use "" for unknown strings.
- Keep body faithful to the original wording; do not summarize.
- Media URLs must be absolute https URLs.
- Date must be ISO 8601 UTC (e.g. "2026-04-19T00:00:00.000Z"). Use the publication date from the page; fall back to today if missing.
- Return the structured data via the extract_article tool.`

const EXTRACT_TOOL = {
  name: 'extract_article',
  description: 'Return the extracted news article fields',
  input_schema: {
    type: 'object' as const,
    properties: {
      headline: { type: 'string', description: "The article's main headline, plain text." },
      summary: { type: 'string', description: '1-2 sentence standfirst / deck. Empty string if none.' },
      body: {
        type: 'string',
        description:
          'The full article body as readable plain text, paragraphs separated by blank lines. Strip nav, ads, related-links, comments.',
      },
      location: { type: 'string', description: 'City/region the story is about. Empty string if unclear.' },
      media: { type: 'string', description: 'Comma-separated absolute https image URLs (hero first). Empty string if none.' },
      date: { type: 'string', description: 'ISO 8601 UTC publication date.' },
    },
    required: ['headline', 'summary', 'body', 'location', 'media', 'date'],
  },
}

export async function extractArticle(pageText: string): Promise<ExtractedArticle> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'extract_article' },
    messages: [{ role: 'user', content: pageText.slice(0, 200_000) }],
  })

  const toolUse = res.content.find(block => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Haiku did not return a tool_use block')
  }

  const input = toolUse.input as Partial<ExtractedArticle>

  return {
    headline: input.headline ?? '',
    summary: input.summary ?? '',
    body: input.body ?? '',
    location: input.location ?? '',
    media: input.media ?? '',
    date: input.date ?? new Date().toISOString(),
  }
}
