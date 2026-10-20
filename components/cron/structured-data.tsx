import type { RecipeFaq } from "@/lib/cron/seo";
import type { CronRecipe } from "@/lib/cron/recipes";
import { SITE_URL } from "@/lib/site";

export type StructuredDataProps = {
  recipe: CronRecipe;
  url: string;
  faqs: RecipeFaq[];
};

export function StructuredData({ recipe, url, faqs }: StructuredDataProps) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: recipe.title,
        url,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any (web browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: recipe.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Cron Directory", item: `${SITE_URL}/cron/` },
          { "@type": "ListItem", position: 3, name: recipe.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
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
