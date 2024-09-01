import { prisma } from "@/lib/prisma";
import { Article } from "../types/article";

export async function getArticles(searchQuery?: string, page: number = 1, pageSize: number = 10): Promise<{ articles: Article[], totalArticles: number }> {
  try {
    // Calculate the offset for pagination
    const skip = (page - 1) * pageSize;

    // Fetch the articles and the total count of articles that match the search query
    const [articles, totalArticles] = await Promise.all([
      prisma.article.findMany({
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
        skip: skip,
        take: pageSize,
      }),
      prisma.article.count({
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
      }),
    ]);

    await prisma.$disconnect();
    return { articles, totalArticles };
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
