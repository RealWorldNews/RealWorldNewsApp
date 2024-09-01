import { prisma } from "@/lib/prisma";
import { Article } from "../types/article";

export async function getArticles(
  searchQuery?: string, 
  page: number = 1, 
  pageSize: number = 10
): Promise<{ articles: Article[], totalArticles: number }> {
  try {
    // Fetch all articles that match the search query, sorted by date
    const [allArticles, totalArticles] = await Promise.all([
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

    // Group articles by resource
    const articlesByResource = allArticles.reduce((acc: { [key: string]: Article[] }, article) => {
      if (!acc[article.resource]) {
        acc[article.resource] = [];
      }
      acc[article.resource].push(article);
      return acc;
    }, {});

    // Interleave articles from different resources
    const staggeredArticles: Article[] = [];
    while (Object.keys(articlesByResource).length > 0) {
      for (const resource of Object.keys(articlesByResource)) {
        if (articlesByResource[resource].length > 0) {
          staggeredArticles.push(articlesByResource[resource].shift()!);
        }
        if (articlesByResource[resource].length === 0) {
          delete articlesByResource[resource];
        }
      }
    }

    // Handle pagination
    const paginatedArticles = staggeredArticles.slice((page - 1) * pageSize, page * pageSize);

    return {
      articles: paginatedArticles,
      totalArticles,
    };
  } catch (error: any) {
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
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
