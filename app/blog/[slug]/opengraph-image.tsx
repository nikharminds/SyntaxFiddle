import { ImageResponse } from "next/og";
import { getPostBySlug, getPostSlugs } from "@/lib/blog/posts";

/**
 * Dynamically generated OpenGraph card for every blog post — rendered once
 * at build time (static export) as a 1200×630 PNG per slug:
 * article title, category badge, read time, and SyntaxFiddle branding.
 *
 * Consumed automatically by Next's file convention (og:image on the post
 * route) and referenced explicitly by generateMetadata / the JSON-LD
 * ImageObject in structured-data.tsx.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams(): { slug: string }[] {
  return getPostSlugs().map((slug) => ({ slug }));
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title = post?.title ?? "SyntaxFiddle";
  const category = post?.category ?? "Engineering Notes";
  const readTime = post ? `${post.readingMinutes} min read` : "Free · No sign-up";
  const titleSize = title.length > 64 ? 44 : title.length > 42 ? 52 : 60;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: "#09090b",
          backgroundImage:
            "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(9,9,11,0) 45%)",
          borderLeft: "10px solid #10b981",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#10b981",
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, color: "#09090b" }}>{"{ }"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#fafafa",
                letterSpacing: "-0.5px",
              }}
            >
              SyntaxFiddle
            </span>
            <span style={{ fontSize: 20, color: "#a1a1aa" }}>
              100% Client-Side Dev Utilities
            </span>
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            padding: "24px 0",
          }}
        >
          <span
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              lineClamp: 3,
            }}
          >
            {title}
          </span>
        </div>

        {/* Meta row: category badge + read time + site */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              borderRadius: 9999,
              border: "2px solid rgba(16,185,129,0.5)",
              backgroundColor: "rgba(16,185,129,0.15)",
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 600, color: "#34d399" }}>{category}</span>
          </div>
          <span style={{ fontSize: 24, color: "#a1a1aa" }}>{readTime}</span>
          <div style={{ display: "flex", flex: 1 }} />
          <span style={{ fontSize: 24, color: "#52525b" }}>syntaxfiddle.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
