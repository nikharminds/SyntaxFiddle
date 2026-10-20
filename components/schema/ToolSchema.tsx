import { SITE_URL } from "@/lib/site";

export type ToolFaq = {
  question: string;
  answer: string;
};

export type ToolSchemaProps = {
  name: string;
  description: string;
  url: string;
  featureList: string[];
  faqs: ToolFaq[];
};

export function ToolSchema({ name, description, url, featureList, faqs }: ToolSchemaProps) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
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
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
