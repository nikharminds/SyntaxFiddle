import type { MetadataRoute } from "next";
import { RECIPES, type RecipeCategory } from "@/lib/cron/recipes";
import { getAllConverterSlugs } from "@/lib/config/converters";
import { CRON_SCHEDULES } from "@/lib/config/cron-schedules";
import { macroSitemapEntries } from "@/lib/cron/macro-pages";
import { CONVERSION_PAIRS } from "@/lib/converter/routes";
import { CURL_SEO_TARGETS } from "@/lib/curl/seo-targets";
import { JSON_SCHEMA_SEO_TARGETS } from "@/lib/json-schema/seo-targets";
import { XML_SCHEMA_SEO_TARGETS } from "@/lib/xml-schema/seo-targets";
import { REGEX_FLAVORS } from "@/lib/regex/dialects";
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
  // /regex/ canonicalizes to /regex-tester/ — only the canonical URL belongs
  // in the sitemap. lastModified is intentionally omitted: a build-time
  // timestamp would mark every URL updated on every deploy and teach crawlers
  // to ignore lastmod entirely.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/cron/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/csv/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/regex-tester/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/jwt-decoder/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/json-to-schema/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/xml-to-schema/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms/`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const regexFlavorRoutes: MetadataRoute.Sitemap = REGEX_FLAVORS.map((flavor) => ({
    url: `${SITE_URL}/regex/${flavor.slug}/`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const conversionRoutes: MetadataRoute.Sitemap = CONVERSION_PAIRS.map((pair) => ({
    url: `${SITE_URL}/${pair.slug}/`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));
  const recipeRoutes: MetadataRoute.Sitemap = RECIPES.map((recipe) => ({
    url: `${SITE_URL}/cron/${recipe.slug}/`,
    changeFrequency: "monthly",
    priority: CATEGORY_PRIORITY[recipe.category],
  }));
  const curlRoutes: MetadataRoute.Sitemap = CURL_SEO_TARGETS.map((target) => ({
    url: `${SITE_URL}/${target.slug}/`,
    changeFrequency: "monthly",
    priority: target.slug === "curl-converter" ? 0.9 : 0.8,
  }));
  const jsonSchemaRoutes: MetadataRoute.Sitemap = JSON_SCHEMA_SEO_TARGETS.map(
    (target) => ({
      url: `${SITE_URL}/${target.slug}/`,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const xmlSchemaRoutes: MetadataRoute.Sitemap = XML_SCHEMA_SEO_TARGETS.map(
    (target) => ({
      url: `${SITE_URL}/${target.slug}/`,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const cronScheduleRoutes: MetadataRoute.Sitemap = CRON_SCHEDULES.map((schedule) => ({
    url: `${SITE_URL}/cron/${schedule.slug}/`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const cronMacroRoutes: MetadataRoute.Sitemap = macroSitemapEntries();

  const toolsRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/tools/`, changeFrequency: "weekly", priority: 0.9 },
    ...getAllConverterSlugs().map((slug) => ({
      url: `${SITE_URL}/tools/${slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  const allEntries: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...conversionRoutes,
    ...recipeRoutes,
    ...cronScheduleRoutes,
    ...cronMacroRoutes,
    ...curlRoutes,
    ...xmlSchemaRoutes,
    ...jsonSchemaRoutes,
    ...regexFlavorRoutes,
    ...toolsRoutes,
  ];

  // A URL may only appear once in the sitemap — registries are guarded
  // against slug collisions, but this Set guarantees valid XML if one slips
  // through.
  const seenUrls = new Set<string>();
  return allEntries.filter((entry) => {
    if (seenUrls.has(entry.url)) return false;
    seenUrls.add(entry.url);
    return true;
  });
}
