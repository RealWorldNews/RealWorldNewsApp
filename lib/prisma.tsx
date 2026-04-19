import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: isProduction ? process.env.POSTGRES_PRISMA_URL : process.env.POSTGRES_PRISMA_URL_DEV,
    },
  },
});
