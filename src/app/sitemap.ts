import { MetadataRoute } from "next";
import { getArticles } from "@/lib/db";

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://youthresearchforum.org";
  
  // Fetch articles from Firestore
  const articles = await getArticles();
  
  // Map articles to sitemap formats
  const articleEntries = articles.map((art) => {
    let lastMod = new Date();
    if (art.createdAt) {
      lastMod = art.createdAt.toDate ? art.createdAt.toDate() : new Date(art.createdAt);
    }
    return {
      url: `${baseUrl}/article/${art.slug}`,
      lastModified: lastMod,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    };
  });

  // Static site routes
  const staticEntries = ["", "/national", "/international", "/about", "/login", "/signup"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.6,
  }));

  return [...staticEntries, ...articleEntries];
}
