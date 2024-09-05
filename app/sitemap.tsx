import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getArticles();

  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: "https://www.realworldnews.org/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.realworldnews.org/resources",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const projectUrls: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `https://distort-apps.vercel.app/articles/${project.slug}`,
    lastModified: new Date(project.date),
    changeFrequency: "weekly" as const,  
    priority: 0.7,
  }));

  return [...baseUrls, ...projectUrls];
}
