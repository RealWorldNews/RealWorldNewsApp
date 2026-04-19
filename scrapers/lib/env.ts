import { config } from 'dotenv'
import path from 'path'

const ROOT = path.resolve(__dirname, '..', '..')

config({ path: path.join(ROOT, '.env.local') })
config({ path: path.join(ROOT, '.env') })

function required(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env var: ${key}`)
  return v
}

export const env = {
  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),
  INGEST_URL: required('INGEST_URL'),
  INGEST_SECRET: required('INGEST_SECRET'),
  SCRAPE_LIMIT: Number(process.env.SCRAPE_LIMIT ?? 10),
}
