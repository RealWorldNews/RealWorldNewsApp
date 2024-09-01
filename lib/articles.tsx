import { prisma } from "@/lib/prisma";
import { Article } from "../types/article";

export async function getArticles(searchQuery?: string): Promise<Article[]> {
  try {
    const articles = await prisma.article.findMany({
      where: searchQuery
        ? {
            OR: [
              { body: { contains: searchQuery, mode: "insensitive" } },
              { headline: { contains: searchQuery, mode: "insensitive" } },
              { resource: { contains: searchQuery, mode: "insensitive" } },
              { author: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}, 
      orderBy: {
        date: "desc",
      },
    });
    await prisma.$disconnect();
    return articles;
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    throw error; // Rethrow the error instead of process.exit
  }
}

export async function getArticle(slug: string): Promise<Article> {
  try {
    const article = await prisma.article.findUnique({
      where: {
        slug: slug,
      },
    });
    await prisma.$disconnect();
    if (article === null) {
      throw new Error(`Article with slug '${slug}' not found.`);
    }
    return article;
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    throw error; 
  }
}
