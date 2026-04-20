import '../scrapers/lib/env'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function usage(): never {
  console.error(`Usage:
  npm run db:clear -- <source>     delete articles whose source matches (case-insensitive, contains)
  npm run db:clear -- --all        delete ALL articles

Examples:
  npm run db:clear -- "Al Jazeera"
  npm run db:clear -- aljazeera`)
  process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) usage()

  try {
    if (args.includes('--all')) {
      const res = await prisma.article.deleteMany({})
      console.log(`✓ Deleted ${res.count} articles`)
      return
    }

    const source = args.find((a) => !a.startsWith('--'))
    if (!source) usage()

    const res = await prisma.article.deleteMany({
      where: { source: { contains: source, mode: 'insensitive' } },
    })
    console.log(`✓ Deleted ${res.count} articles with source matching "${source}"`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
