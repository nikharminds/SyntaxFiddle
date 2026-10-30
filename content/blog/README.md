# Blog content guide

Articles live in `content/blog/*.mdx` and are compiled into statically
exported routes at `/blog/<file-name>/`. There is no CMS: the file name is
the slug (kebab-case, `.mdx`), and everything else is enforced at build time.

## Publishing workflow (staggered releases)

Unpublished posts wait in `content/blog/drafts/` — the loader reads only
top-level `*.mdx` files, so drafts stay out of pages, the sitemap, RSS, and
OG image generation automatically.

To publish a post:

1. `git mv content/blog/drafts/<slug>.mdx content/blog/`
2. Set `publishedAt` (and `updatedAt`, if edited) to the real go-live date.
3. `npm run blog:images` — regenerates its WebP (the script skips drafts).
4. `npm run typecheck && npm test && npm run build`
5. Deploy, then request indexing for the new URL in Search Console.

## Frontmatter contract

Validated by `lib/blog/schema.ts` (Zod) — an invalid file **fails the build**
with a file-relative error listing every issue.

| Field             | Rules                                                              |
| ----------------- | ------------------------------------------------------------------ |
| `title`           | 10–60 chars. Doubles as the `<title>` tag — keep under 60.          |
| `description`     | 50–160 chars. Doubles as the meta description / RSS excerpt.        |
| `publishedAt`     | ISO date `YYYY-MM-DD`, real calendar date.                          |
| `updatedAt`       | ISO date ≥ `publishedAt`. Drives `<lastmod>` and `dateModified`.    |
| `category`        | 2–40 chars. Powers the index filter chips — reuse existing values.  |
| `tags`            | 1–8 entries, 2–24 chars each. Used for keywords and related posts.  |
| `author.name`     | 2–60 chars. Shown in byline, JSON-LD, and RSS `<dc:creator>`.       |
| `author.url`      | Optional absolute URL.                                              |
| `relatedToolSlug` | Must match a slug in `lib/tools.ts`. Drives the sidebar CTA, the    |
|                   | post-article banner, and the internal-link requirement below.       |
| `faq`             | Optional array (max 10) of `{question, answer}` — renders an FAQ    |
|                   | section and `FAQPage` JSON-LD.                                      |

## Internal linking (enforced)

Every post must link to its related tool from within the article body using
direct, contextual anchor text — not "click here", but the tool's name or
the task it performs:

```mdx
Paste any expression into the [Cron Tester & Generator](/cron/) to see the
next execution times.
```

- `tests/blog-internal-links.test.ts` fails the build if a post has no
  in-body link (or `<ToolBanner>`) to its `relatedToolSlug`.
- Prefer linking specific converter routes (e.g. `/csv-to-sql/`) over hub
  pages when the sentence is about that exact conversion.
- `<ToolBanner tool="slug" />` can be embedded anywhere in an MDX body as an
  additional in-content CTA card.

## Writing conventions

- Heading texts must be **unique per post** — they become ToC anchor ids
  (`lib/blog/headings.ts`); duplicates fail the build.
- Use `##` / `###` freely: both feed the sidebar table of contents.
- Fenced code blocks get language badges and a copy button automatically
  (`components/blog/CodeBlock.tsx`) — always tag the language
  (```bash, ```sql, ```typescript, …).
- GFM tables, task lists, and strikethrough are enabled.
- No HTML/JSX in prose except `<ToolBanner />`; keep braces and angle
  brackets inside code fences.

## Images

Every article gets a **generated OpenGraph card** (`opengraph-image.tsx`) —
title, category, read time, branding — used for `og:image`, `twitter:image`,
and the JSON-LD `ImageObject`. No action needed from authors.

In-content images:

```mdx
![Annotated diagram of the five cron fields](/blog/cron-expressions-explained/fields.webp "Field positions · 1600x900")
```

- Store files under `public/blog/<slug>/` as **WebP or AVIF** — enforced at
  build time (`components/blog/BlogImage.tsx` throws on other local formats;
  the site is a static export and cannot transcode).
- Alt text **≥ 10 characters** (SEO; checked by `tests/blog-images.test.ts`).
- The optional title carries a caption and intrinsic dimensions
  (`"Caption · 1600x900"`) to prevent layout shift. Without it, images
  default to a 1200×630 ratio.
- The first image in a post automatically renders with loading priority.
- A featured hero image can also be declared in frontmatter:
  `image: { url, alt, caption?, width?, height? }` (same WebP/AVIF + alt
  rules, validated by the Zod schema). Omit `width`/`height` only for
  1200×630 assets — other ratios must declare their intrinsic size.
  Regenerate the committed diagrams with `npm run blog:images`.

## Verify before pushing

```sh
npm run typecheck && npm test && npm run build
```

Sitemap (`app/sitemap.ts`, priority 0.8 + `<lastmod>` from `updatedAt`) and
RSS (`app/rss.xml/route.ts`, newest 20 posts) regenerate automatically.
