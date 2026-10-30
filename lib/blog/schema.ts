import { z } from "zod";
// Relative (not "@/lib/tools") so vitest resolves it without an alias config.
import { TOOLS } from "../tools";

/**
 * Build-time contract for every MDX file in content/blog/.
 *
 * Frontmatter is validated with Zod while pages are statically generated —
 * an invalid file fails the build with a file-relative error instead of
 * shipping broken metadata to production.
 *
 * Field notes:
 * - `title` is capped at 60 chars so the rendered `<title>` tag always fits
 *   the SERP truncation budget (the article route uses `title.absolute`).
 * - `description` doubles as the meta description (50–160 chars, Google's
 *   display range).
 * - `relatedToolSlug` must resolve against the TOOLS registry so the "try it
 *   live" call-to-action can never link to a 404.
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** JS Date.parse silently rolls impossible dates over (Feb 30 → Mar 2), so verify components round-trip. */
const isRealCalendarDate = (value: string): boolean => {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isoDate = (field: string) =>
  z
    .string()
    .regex(ISO_DATE_PATTERN, { message: `${field} must be an ISO date string (YYYY-MM-DD)` })
    .refine(isRealCalendarDate, {
      message: `${field} is not a real calendar date`,
    });

export const blogFrontmatterSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(10, { message: "title must be at least 10 characters" })
      .max(60, { message: "title must be 60 characters or fewer (SEO <title> budget)" }),
    description: z
      .string()
      .trim()
      .min(50, { message: "description must be at least 50 characters" })
      .max(160, { message: "description must be 160 characters or fewer (meta description budget)" }),
    publishedAt: isoDate("publishedAt"),
    updatedAt: isoDate("updatedAt"),
    category: z
      .string()
      .trim()
      .min(2, { message: "category must be at least 2 characters" })
      .max(40, { message: "category must be 40 characters or fewer" }),
    tags: z
      .array(z.string().trim().min(2).max(24))
      .min(1, { message: "tags must contain at least one entry" })
      .max(8, { message: "tags must contain at most 8 entries" }),
    author: z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "author.name must be at least 2 characters" })
        .max(60, { message: "author.name must be 60 characters or fewer" }),
      url: z.string().url({ message: "author.url must be a valid absolute URL" }).optional(),
    }),
    relatedToolSlug: z
      .string()
      .refine((slug) => TOOLS.some((tool) => tool.slug === slug), {
        message: "relatedToolSlug must match a slug registered in lib/tools.ts",
      }),
    /**
     * Optional featured image (WebP/AVIF under public/blog/<slug>/).
     * Rendered at the top of the article with loading priority.
     */
    image: z
      .object({
        url: z.string().min(1, { message: "image.url must not be empty" }),
        alt: z
          .string()
          .min(10, { message: "Alt text must be at least 10 characters for SEO" }),
        caption: z.string().optional(),
        /** Intrinsic pixel size — prevents aspect-ratio distortion (defaults to 1200×630). */
        width: z.number().int().min(1).max(8192).optional(),
        height: z.number().int().min(1).max(8192).optional(),
      })
      .optional(),
    faq: z
      .array(
        z.object({
          question: z
            .string()
            .trim()
            .min(10, { message: "faq questions must be at least 10 characters" })
            .max(150, { message: "faq questions must be 150 characters or fewer" }),
          answer: z
            .string()
            .trim()
            .min(20, { message: "faq answers must be at least 20 characters" }),
        }),
      )
      .max(10, { message: "faq must contain at most 10 entries" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.updatedAt < data.publishedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "updatedAt cannot predate publishedAt",
      });
    }
  });

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

export type BlogFaq = { question: string; answer: string };
