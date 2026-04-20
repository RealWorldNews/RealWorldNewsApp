import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";

export const revalidate = 3600;

const SITE_URL = "https://www.realworldnews.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles } = await getArticles(undefined, 1, undefined, 10000);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/resources`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  for (const article of articles) {
    const articleDate = article.date ? new Date(article.date) : null;
    const lastModified =
      articleDate && articleDate.getTime() > 0 ? articleDate : now;
    entries.push({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
