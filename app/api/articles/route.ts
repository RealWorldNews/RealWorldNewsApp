import { type NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

type Body = {
  slug?: string
  headline?: string
  summary?: string
  body?: string
  location?: string
  media?: string
  videoUrl?: string
  source?: string
  sourceUrl?: string
  date?: string
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { slug, headline, summary, body: articleBody, location, media, videoUrl, source, sourceUrl, date } = body

  if (!slug?.trim() || !headline?.trim() || !articleBody?.trim() || !date) {
    return NextResponse.json({ message: 'Missing required fields: slug, headline, body, date' }, { status: 422 })
  }

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ message: 'Invalid date' }, { status: 422 })
  }

  const data = {
    slug: slug.trim(),
    headline: headline.trim(),
    summary: summary?.trim() ?? '',
    body: articleBody,
    location: location?.trim() ?? '',
    media: media?.trim() ?? '',
    videoUrl: videoUrl?.trim() ?? '',
    source: source?.trim() ?? '',
    sourceUrl: sourceUrl?.trim() ?? '',
    date: parsedDate,
  }

  try {
    const existing = await prisma.article.findUnique({ where: { slug: data.slug } })
    const article = await prisma.article.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    })
    revalidatePath('/')
    revalidatePath(`/articles/${article.slug}`)
    return NextResponse.json({ id: article.id, slug: article.slug }, { status: existing ? 200 : 201 })
  } catch (err) {
    console.error('[api/articles] error', err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const source = request.nextUrl.searchParams.get('source')?.trim()
  if (!source) {
    return NextResponse.json({ message: 'Missing ?source=<name>' }, { status: 400 })
  }

  try {
    const { count } = await prisma.article.deleteMany({
      where: { source: { equals: source, mode: 'insensitive' } },
    })
    revalidatePath('/')
    return NextResponse.json({ deleted: count, source }, { status: 200 })
  } catch (err) {
    console.error('[api/articles DELETE] error', err)
    return NextResponse.json({ message: 'Internal server error', error: String(err) }, { status: 500 })
  }
}
