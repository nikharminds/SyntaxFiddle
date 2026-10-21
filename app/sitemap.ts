import type { MetadataRoute } from "next";
import { RECIPES, type RecipeCategory } from "@/lib/cron/recipes";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";
import { CURL_SEO_TARGETS } from "@/lib/curl/seo-targets";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const CATEGORY_PRIORITY: Record<RecipeCategory, number> = {
  minutes: 0.8,
  hourly: 0.8,
  daily: 0.8,
  weekly: 0.7,
  monthly: 0.7,
  "platform-specific": 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/cron/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/csv/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/regex/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/jwt/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/regex-tester/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/jwt-decoder/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms/`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const lastModified = new Date();
  const conversionRoutes: MetadataRoute.Sitemap = CONVERSION_PAIRS.map((pair) => ({
    url: `${SITE_URL}/${pair.slug}/`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.9,
  }));
  const recipeRoutes: MetadataRoute.Sitemap = RECIPES.map((recipe) => ({
    url: `${SITE_URL}/cron/${recipe.slug}/`,
    lastModified,
    changeFrequency: "monthly",
    priority: CATEGORY_PRIORITY[recipe.category],
  }));
  const curlRoutes: MetadataRoute.Sitemap = CURL_SEO_TARGETS.map((target) => ({
    url: `${SITE_URL}/${target.slug}/`,
    lastModified,
    changeFrequency: "monthly",
    priority: target.slug === "curl-converter" ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...conversionRoutes, ...recipeRoutes, ...curlRoutes];
}
