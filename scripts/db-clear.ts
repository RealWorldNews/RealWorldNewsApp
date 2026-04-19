import '../scrapers/lib/env'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function usage(): never {
  console.error(`Usage:
  npm run db:clear -- <slug-prefix>   delete articles whose slug starts with the given prefix
  npm run db:clear -- --all           delete ALL articles`)
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

    const prefix = args.find((a) => !a.startsWith('--'))
    if (!prefix) usage()

    const res = await prisma.article.deleteMany({
      where: { slug: { startsWith: prefix } },
    })
    console.log(`✓ Deleted ${res.count} articles with slug starting "${prefix}"`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
