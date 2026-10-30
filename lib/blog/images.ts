/**
 * Shared image rules for blog MDX content.
 *
 * The site is a static export (no image optimization server), so sources must
 * already ship as WebP/AVIF — enforced at build time by BlogImage, which
 * throws during static generation (failing the build) on violations.
 *
 * Markdown image titles carry optional caption + intrinsic dimensions:
 *   ![Alt text ≥ 10 chars](/blog/<slug>/shot.webp "Caption · 1600x900")
 */

const LOCAL_SUPPORTED_PATTERN = /\.(webp|avif)$/i;
const EXTERNAL_PATTERN = /^https?:\/\//i;
const DIMENSIONS_PATTERN = /(\d{2,5})\s*[x×]\s*(\d{2,5})/;

export function assertSupportedBlogImageSource(src: string): void {
  // Remote hosts can negotiate formats themselves; local static assets cannot.
  if (EXTERNAL_PATTERN.test(src)) return;
  if (!LOCAL_SUPPORTED_PATTERN.test(src)) {
    throw new Error(
      `Blog image "${src}" must be WebP or AVIF. This site statically exports (no server-side transcoding) — commit optimized files under public/blog/<slug>/ as .webp or .avif.`,
    );
  }
}

export type ParsedImageMeta = {
  caption?: string;
  width?: number;
  height?: number;
};

/** Splits a markdown image title into caption text and WxH dimensions. */
export function parseImageMeta(title?: string): ParsedImageMeta {
  if (!title) return {};
  const dims = DIMENSIONS_PATTERN.exec(title);
  const width = dims?.[1] ? Number(dims[1]) : undefined;
  const height = dims?.[2] ? Number(dims[2]) : undefined;
  const caption = title
    .replace(DIMENSIONS_PATTERN, "")
    .replace(/[\s·—–-]+$/u, "")
    .trim();
  return { caption: caption || undefined, width, height };
}
