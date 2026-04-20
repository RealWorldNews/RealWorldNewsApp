import { prisma } from "@/lib/prisma";
import { Article } from "../types/article";

const PAGE_SIZE = 12;

export interface SourceCount {
  source: string;
  count: number;
}

export async function getArticles(
  searchQuery?: string,
  page: number = 1,
  source?: string,
  pageSize: number = PAGE_SIZE,
): Promise<{
  articles: Article[];
  totalArticles: number;
  sourceCounts: SourceCount[];
  totalAcrossAllSources: number;
}> {
  const searchWhere = searchQuery
    ? {
        OR: [
          { headline: { contains: searchQuery, mode: "insensitive" as const } },
          { body: { contains: searchQuery, mode: "insensitive" as const } },
          { summary: { contains: searchQuery, mode: "insensitive" as const } },
          { location: { contains: searchQuery, mode: "insensitive" as const } },
          { source: { contains: searchQuery, mode: "insensitive" as const } },
        ],
      }
    : {};

  const searchScoped = await prisma.article.findMany({
    where: searchWhere,
    orderBy: { date: "desc" },
  });

  const sourceCountMap = new Map<string, number>();
  for (const a of searchScoped) {
    const key = a.source || "unknown";
    sourceCountMap.set(key, (sourceCountMap.get(key) ?? 0) + 1);
  }
  const sourceCounts: SourceCount[] = Array.from(sourceCountMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => a.source.localeCompare(b.source));

  const filtered = source
    ? searchScoped.filter((a) => a.source === source)
    : searchScoped;

  const staggered = source ? filtered : interleaveBySource(filtered);
  const start = (page - 1) * pageSize;
  const articles = staggered.slice(start, start + pageSize);

  return {
    articles,
    totalArticles: staggered.length,
    sourceCounts,
    totalAcrossAllSources: searchScoped.length,
  };
}

function interleaveBySource(articles: Article[]): Article[] {
  const queues = new Map<string, Article[]>();
  for (const a of articles) {
    const key = a.source || "unknown";
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key)!.push(a);
  }

  const out: Article[] = [];
  const lists = Array.from(queues.values());
  let remaining = articles.length;
  while (remaining > 0) {
    for (const list of lists) {
      const next = list.shift();
      if (next) {
        out.push(next);
        remaining--;
      }
    }
  }
  return out;
}

export async function getArticle(slug: string): Promise<Article | null> {
  return prisma.article.findUnique({ where: { slug } });
}
