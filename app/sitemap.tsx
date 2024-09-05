import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles } = await getArticles(); // Destructure the articles array from the returned object

  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: "https://distort-apps.vercel.app",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://distort-apps.vercel.app/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const projectUrls: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `https://distort-apps.vercel.app/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "weekly" as const,  
    priority: 0.7,
  }));

  return [...baseUrls, ...projectUrls];
}
