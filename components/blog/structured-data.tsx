import { SITE_URL } from "@/lib/site";
import { toUtcTimestamp, type BlogPost } from "@/lib/blog/posts";

/**
 * Structured data for a blog article route: a combined TechArticle /
 * BlogPosting node (rich-result eligible) plus an FAQPage node when the
 * post ships questions. Emitted once per statically generated page.
 */
export function BlogPostStructuredData({ post }: { post: BlogPost }) {
  const url = `${SITE_URL}/blog/${post.slug}/`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": ["TechArticle", "BlogPosting"],
      headline: post.title,
      description: post.description,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      datePublished: toUtcTimestamp(post.publishedAt),
      dateModified: toUtcTimestamp(post.updatedAt),
      author: {
        "@type": "Person",
        name: post.author.name,
        ...(post.author.url ? { url: post.author.url } : {}),
      },
      publisher: {
        "@type": "Organization",
        name: "SyntaxFiddle",
        url: `${SITE_URL}/`,
      },
      image: [
        {
          "@type": "ImageObject",
          url: `${SITE_URL}/blog/${post.slug}/opengraph-image`,
          width: 1200,
          height: 630,
        },
        // In-article featured image — an extra surface for Google Images.
        ...(post.image
          ? [
              {
                "@type": "ImageObject",
                url: `${SITE_URL}${post.image.url}`,
                width: post.image.width ?? 1200,
                height: post.image.height ?? 630,
              },
            ]
          : []),
      ],
      keywords: post.tags.join(", "),
      articleSection: post.category,
      wordCount: post.wordCount,
      inLanguage: "en",
      isAccessibleForFree: true,
    },
  ];

  if (post.faq && post.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer,
        },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
