import type { ConversionPair } from "@/lib/converter/routes";
import { getPairExtraFaqs } from "@/lib/converter/pair-copy";
import { SITE_URL } from "@/lib/site";

export function ConverterSchema({ pair }: { pair: ConversionPair }) {
  const url = `${SITE_URL}/${pair.slug}/`;
  const faqs = [...pair.faqs, ...getPairExtraFaqs(pair.slug)];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${pair.title} | SyntaxFiddle`,
        url,
        description: pair.description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any (browser-based)",
        browserRequirements: "Requires JavaScript enabled in a modern browser",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          `Convert ${pair.sourceLabel} to ${pair.targetLabel} in the browser`,
          "100% client-side processing — no uploads",
          "Web Worker parsing for large files",
          "Copy and download buttons",
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Conversion Studio",
            item: `${SITE_URL}/csv/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${pair.sourceLabel} to ${pair.targetLabel}`,
            item: url,
          },
        ],
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
