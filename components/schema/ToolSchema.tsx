import { SITE_URL } from "@/lib/site";

export type ToolFaq = {
  question: string;
  answer: string;
};

export type ToolBreadcrumb = {
  name: string;
  /** Absolute URL of the crumb target. */
  item: string;
};

export type ToolSchemaProps = {
  name: string;
  description: string;
  url: string;
  featureList: string[];
  faqs: ToolFaq[];
  /** Optional BreadcrumbList graph node — pass the full trail, last crumb = this page. */
  breadcrumbs?: ToolBreadcrumb[];
};

export function ToolSchema({ name, description, url, featureList, faqs, breadcrumbs }: ToolSchemaProps) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebApplication",
      name,
      url,
      description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript enabled in a modern browser",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList,
      publisher: {
        "@type": "Organization",
        name: "SyntaxFiddle",
        url: `${SITE_URL}/`,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
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
